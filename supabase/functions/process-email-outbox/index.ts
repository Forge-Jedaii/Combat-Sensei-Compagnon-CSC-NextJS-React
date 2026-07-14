import { createClient } from "npm:@supabase/supabase-js@2.109.0";

type OutboxRow = {
  id: number;
  user_id: string;
  template: "registration_pending" | "account_activated" | "account_rejected" | "account_suspended";
  payload: Record<string, unknown>;
  attempt_count: number;
  max_attempts: number;
};

type EmailContent = { subject: string; text: string; html: string };

function requiredEnvironment(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing Edge Function secret: ${name}`);
  return value;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

function content(template: OutboxRow["template"], displayName: string, appUrl: string): EmailContent {
  const name = displayName || "Combattant";
  const messages: Record<OutboxRow["template"], { subject: string; body: string }> = {
    registration_pending: {
      subject: "Votre demande CSC est en attente",
      body: "Votre compte a été créé. Un administrateur doit maintenant valider votre demande.",
    },
    account_activated: {
      subject: "Votre compte CSC est activé",
      body: "Votre demande a été validée. Vous pouvez maintenant vous connecter à CSC.",
    },
    account_rejected: {
      subject: "Votre demande CSC a été refusée",
      body: "Votre demande d’accès à CSC n’a pas été acceptée.",
    },
    account_suspended: {
      subject: "Votre compte CSC est suspendu",
      body: "Votre accès à CSC a été suspendu. Contactez un administrateur si vous pensez qu’il s’agit d’une erreur.",
    },
  };
  const selected = messages[template];
  const safeName = escapeHtml(name);
  const safeBody = escapeHtml(selected.body);
  const safeUrl = escapeHtml(appUrl);
  return {
    subject: selected.subject,
    text: `Bonjour ${name},\n\n${selected.body}\n\n${appUrl}`,
    html: `<p>Bonjour ${safeName},</p><p>${safeBody}</p><p><a href="${safeUrl}">Ouvrir CSC</a></p>`,
  };
}

function retryAfterSeconds(response: Response): number | null {
  const value = response.headers.get("retry-after");
  if (!value) return null;
  const seconds = Number.parseInt(value, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

Deno.serve(async (request) => {
  const workerToken = requiredEnvironment("OUTBOX_WORKER_TOKEN");
  if (request.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });
  if (request.headers.get("authorization") !== `Bearer ${workerToken}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabaseUrl = requiredEnvironment("SUPABASE_URL");
  const serviceRoleKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = requiredEnvironment("RESEND_API_KEY");
  const emailFrom = requiredEnvironment("EMAIL_FROM");
  const appUrl = requiredEnvironment("APP_URL");
  const workerId = crypto.randomUUID();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.rpc("claim_email_outbox", {
    target_worker_id: workerId,
    target_batch_size: 10,
  });
  if (error) {
    console.error("[email-outbox] claim failed", { workerId, error });
    return Response.json({ error: "claim_failed" }, { status: 500 });
  }

  const summary = { claimed: data?.length ?? 0, sent: 0, retried: 0, failed: 0 };
  for (const row of (data ?? []) as OutboxRow[]) {
    try {
      let recipient = typeof row.payload.email === "string" ? row.payload.email : "";
      if (!recipient) {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(row.user_id);
        if (userError) throw userError;
        recipient = userData.user.email ?? "";
      }
      if (!recipient) throw new Error("Recipient email is missing");

      const displayName = typeof row.payload.display_name === "string" ? row.payload.display_name : "";
      const email = content(row.template, displayName, appUrl);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${resendApiKey}`,
          "content-type": "application/json",
          "idempotency-key": `csc/${row.template}/${row.id}`,
        },
        body: JSON.stringify({ from: emailFrom, to: [recipient], ...email }),
        signal: AbortSignal.timeout(15_000),
      });
      const responseBody = await response.json().catch(() => ({})) as Record<string, unknown>;

      if (!response.ok) {
        const errorMessage = typeof responseBody.message === "string" ? responseBody.message : `Resend HTTP ${response.status}`;
        const errorCode = typeof responseBody.name === "string" ? responseBody.name : "resend_error";
        const { error: failureError } = await supabase.rpc("fail_email_outbox", {
          target_outbox_id: row.id,
          target_worker_id: workerId,
          target_http_status: response.status,
          target_error_code: errorCode,
          target_error_message: errorMessage,
          target_retry_after_seconds: retryAfterSeconds(response),
        });
        if (failureError) throw failureError;
        if (row.attempt_count >= row.max_attempts) summary.failed += 1;
        else summary.retried += 1;
        console.warn("[email-outbox] delivery deferred", { workerId, outboxId: row.id, status: response.status, errorCode });
        continue;
      }

      const providerMessageId = typeof responseBody.id === "string" ? responseBody.id : null;
      if (!providerMessageId) throw new Error("Resend response has no message id");
      const { error: completionError } = await supabase.rpc("complete_email_outbox", {
        target_outbox_id: row.id,
        target_worker_id: workerId,
        target_provider_message_id: providerMessageId,
        target_http_status: response.status,
      });
      if (completionError) throw completionError;
      summary.sent += 1;
      console.info("[email-outbox] delivered", { workerId, outboxId: row.id, providerMessageId });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      const { error: failureError } = await supabase.rpc("fail_email_outbox", {
        target_outbox_id: row.id,
        target_worker_id: workerId,
        target_http_status: null,
        target_error_code: "worker_exception",
        target_error_message: message,
        target_retry_after_seconds: null,
      });
      if (failureError) console.error("[email-outbox] failure acknowledgement failed", { workerId, outboxId: row.id, failureError });
      if (row.attempt_count >= row.max_attempts) summary.failed += 1;
      else summary.retried += 1;
      console.error("[email-outbox] delivery failed", { workerId, outboxId: row.id, message });
    }
  }

  return Response.json(summary, { headers: { "cache-control": "no-store" } });
});
