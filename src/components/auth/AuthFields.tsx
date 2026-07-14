const inputClass =
  "w-full rounded-lg border border-gray-600 bg-black/70 px-3 py-2.5 text-white outline-none transition focus:border-cyan-400";

export function EmailField({ defaultValue }: { defaultValue?: string }) {
  return (
    <label className="block space-y-1.5 text-sm text-gray-300">
      <span>Adresse email</span>
      <input
        className={inputClass}
        type="email"
        name="email"
        defaultValue={defaultValue}
        autoComplete="email"
        required
      />
    </label>
  );
}

export function PasswordField({
  name = "password",
  label = "Mot de passe",
  autoComplete = "current-password",
  minLength = 8,
}: {
  name?: string;
  label?: string;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <label className="block space-y-1.5 text-sm text-gray-300">
      <span>{label}</span>
      <input
        className={inputClass}
        type="password"
        name={name}
        autoComplete={autoComplete}
        minLength={minLength}
        required
      />
    </label>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="w-full rounded-lg border border-purple-400 bg-purple-600/90 px-4 py-2.5 font-bold transition hover:bg-purple-500"
    >
      {children}
    </button>
  );
}

export function AuthNotice({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (!error && !message) return null;
  return (
    <p
      role="status"
      className={`rounded-lg border px-3 py-2 text-sm ${
        error
          ? "border-red-500/40 bg-red-500/10 text-red-300"
          : "border-green-500/40 bg-green-500/10 text-green-300"
      }`}
    >
      {error ?? message}
    </p>
  );
}
