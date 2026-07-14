# Authentification et emails CSC

## Deux circuits différents

CSC utilise deux circuits qui ne doivent pas être confondus :

1. **Supabase Auth** envoie les confirmations, Magic Links, invitations et récupérations de mot de passe. En production, ce circuit doit utiliser le SMTP personnalisé Resend configuré dans le Dashboard Supabase.
2. **`email_outbox`** contient les notifications métier `registration_pending`, `account_activated`, `account_rejected` et `account_suspended`. L’Edge Function `process-email-outbox` les envoie avec l’API HTTP Resend.

Le worker d’outbox ne remplace pas le SMTP de Supabase Auth.

## Développement local

`supabase/config.toml` définit :

- inscriptions email activées ;
- confirmation email désactivée (`auth.email.enable_confirmations = false`) ;
- site et callback sur `http://localhost:3000` ;
- Edge Function protégée par `OUTBOX_WORKER_TOKEN` plutôt que par un JWT utilisateur.

Avec la confirmation désactivée, `signUp()` retourne immédiatement une session. L’action Register la ferme volontairement : le profil créé par le trigger reste `pending` et la connexion applicative demeure refusée jusqu’à validation administrative.

Préparer les secrets locaux sans les committer :

```bash
cp supabase/functions/.env.example supabase/functions/.env
supabase functions serve process-email-outbox --env-file supabase/functions/.env
```

Pour éviter d’envoyer de vrais emails en développement, utiliser une clé Resend de test et une adresse destinataire autorisée, ou un fournisseur sandbox.

## Production

### Supabase Auth avec Resend SMTP

Dans Resend, vérifier un domaine dédié, idéalement `auth.example.com`. Dans Supabase Dashboard, ouvrir **Authentication → SMTP Settings** et configurer :

- Host : `smtp.resend.com`
- Port : `465`
- Username : `resend`
- Password : clé API Resend
- Sender : adresse du domaine vérifié
- Sender name : `Combat Sensei`

Ensuite, régler **Authentication → Rate Limits** selon le trafic attendu. Le SMTP par défaut Supabase est limité et ne convient pas à la production.

Choix de confirmation :

- si **Confirm Email est désactivé**, Register ne dépend pas d’un email Auth et le compte est implicitement confirmé, mais reste bloqué par `profiles.status = pending` ;
- si **Confirm Email est activé**, le SMTP Resend doit être opérationnel et l’utilisateur doit confirmer son adresse avant toute connexion.

Les URLs de production doivent être configurées dans **Authentication → URL Configuration** : Site URL HTTPS et `/auth/callback` dans la liste des redirects autorisés.

### Déployer l’outbox

Appliquer d’abord les migrations, puis déployer la fonction :

```bash
supabase link --project-ref <project-ref>
supabase db push
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set 'EMAIL_FROM=Combat Sensei <notifications@updates.example.com>'
supabase secrets set APP_URL=https://csc.example.com
supabase secrets set OUTBOX_WORKER_TOKEN=<secret-aleatoire-de-32-caracteres-minimum>
supabase functions deploy process-email-outbox
```

`RESEND_API_KEY` et `OUTBOX_WORKER_TOKEN` ne doivent jamais être ajoutés aux variables `NEXT_PUBLIC_*`.

### Planifier le worker

Créer les secrets Vault puis appeler la fonction toutes les minutes avec Cron/`pg_net` :

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<OUTBOX_WORKER_TOKEN>', 'outbox_worker_token');

select cron.schedule(
  'process-csc-email-outbox',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/process-email-outbox',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'outbox_worker_token')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Fiabilité et exploitation

- Un lot contient au maximum 10 emails.
- `FOR UPDATE SKIP LOCKED` empêche deux workers de réclamer la même ligne.
- Un verrou `processing` abandonné redevient réclamable après 10 minutes.
- Le délai de reprise est exponentiel, de 30 secondes à 1 heure.
- Après 5 tentatives, la ligne passe définitivement à `failed`.
- Chaque tentative est enregistrée dans `email_delivery_attempts`.
- La clé Resend `csc/<template>/<outbox-id>` rend les reprises idempotentes pendant la fenêtre gérée par Resend.
- Les erreurs et identifiants fournisseur sont visibles dans `email_outbox`, `email_delivery_attempts`, les logs Edge Functions et le Dashboard Resend.

Requête d’exploitation :

```sql
select status, count(*)
from public.email_outbox
group by status
order by status;
```

Une ligne `failed` doit être diagnostiquée avant d’être remise manuellement en file. Ne jamais effacer `attempt_count` ou `last_error` sans conserver la cause dans un incident.

## Validation Register

Le test du trigger transactionnel est disponible avec :

```bash
npm run test:register
```

Il crée, vérifie et supprime dix fois un compte réservé aux tests. Pour valider le chemin public avec confirmation désactivée, désactiver **Confirm Email** sur l’instance ciblée, créer une adresse neuve depuis `/register`, puis vérifier :

- Auth créé et email implicitement confirmé ;
- `profiles.status = pending` ;
- une ligne `user_settings` ;
- le rôle `member` ;
- une ligne `email_outbox` en `queued` ;
- aucune session persistante dans le navigateur ;
- connexion refusée avant activation et acceptée après activation.
