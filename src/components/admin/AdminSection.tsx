import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  description: string;
  count?: number;
  tone?: "cyan" | "green" | "yellow" | "purple" | "orange" | "blue" | "red" | "gray";
  children: ReactNode;
};

const toneClasses = {
  cyan: "text-cyan-300 border-cyan-400/30",
  green: "text-green-300 border-green-400/30",
  yellow: "text-yellow-300 border-yellow-400/30",
  purple: "text-purple-300 border-purple-400/30",
  orange: "text-orange-300 border-orange-400/30",
  blue: "text-blue-300 border-blue-400/30",
  red: "text-red-300 border-red-400/30",
  gray: "text-gray-200 border-gray-600/40",
};

export default function AdminSection({ id, title, description, count, tone = "cyan", children }: Props) {
  return (
    <details id={id} className={`group scroll-mt-6 overflow-hidden rounded-xl border bg-black/50 ${toneClasses[tone]}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-cyan-400 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2 text-lg font-bold">
            {title}
            {typeof count === "number" && <span className="rounded-full border border-current/30 px-2 py-0.5 text-xs">{count}</span>}
          </span>
          <span className="mt-1 block text-xs font-normal text-gray-400">{description}</span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-xl transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="border-t border-gray-800 p-5 text-white">{children}</div>
    </details>
  );
}
