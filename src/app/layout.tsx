import type { Metadata } from "next";
import "./globals.css";
import { Orbitron } from "next/font/google";
import { UserModeProvider } from "@/components/context/UserModeContext";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "Forge Je'daii | Combat Sensei Compagnon",
  description: "Compagnon de combat pour la Forge Je'daii",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        className={`${orbitron.variable} font-orbitron min-h-screen overflow-y-auto bg-cyber-gradient bg-cyber-overlay`}
      >
        {/* ✅ PROVIDER GLOBAL OBLIGATOIRE */}
        <UserModeProvider>{children}</UserModeProvider>
      </body>
    </html>
  );
}
