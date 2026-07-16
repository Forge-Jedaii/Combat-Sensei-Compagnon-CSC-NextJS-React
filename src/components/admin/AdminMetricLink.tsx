"use client";

import Link from "next/link";

type Props = { href: string; label: string; value: number; tone: string };

export default function AdminMetricLink({ href, label, value, tone }: Props) {
  return (
    <Link
      href={href}
      onClick={() => {
        if (!href.startsWith("#")) return;
        const section = document.querySelector<HTMLDetailsElement>(href);
        if (section) section.open = true;
      }}
      className="rounded-xl border border-gray-700 bg-black/50 p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
    >
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </Link>
  );
}
