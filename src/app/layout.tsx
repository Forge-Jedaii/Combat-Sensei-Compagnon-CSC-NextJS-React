import type { Metadata } from "next";
import "./globals.css";
import { UserModeProvider } from "@/components/context/UserModeContext";

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
        className="font-orbitron min-h-screen overflow-y-auto bg-cyber-gradient bg-cyber-overlay"
      >
        <UserModeProvider>{children}</UserModeProvider>
      </body>
    </html>
  );
}
