"use client";

import { useUserMode } from "@/components/context/UserModeContext";

type Props = {
  label: string;
  value: string;
  onChange: (name: string) => void;
  className?: string;
  placeholder?: string;
  excludedNames?: string[];
};

export default function FighterField({ label, value, onChange, className = "", placeholder = "Choisir un Je'daii", excludedNames = [] }: Props) {
  const { mode, fighterDirectory, fighterDirectoryLoading } = useUserMode();
  const id = `fighter-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-bold">{label}</label>
      {mode === "authenticated" ? (
        <select
          id={id}
          value={value}
          disabled={fighterDirectoryLoading}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-lg bg-black/70 p-3 text-white disabled:opacity-60 ${className}`}
          required
        >
          <option value="">{fighterDirectoryLoading ? "Chargement des combattants…" : placeholder}</option>
          {fighterDirectory.filter((fighter) => !excludedNames.includes(fighter.display_name) || fighter.display_name === value).map((fighter) => (
            <option key={fighter.id} value={fighter.display_name}>{fighter.display_name}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          maxLength={80}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-lg bg-black/70 p-3 text-white ${className}`}
        />
      )}
    </div>
  );
}
