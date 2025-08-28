import type { Metadata } from "next";
import "./globals.css";
import { Orbitron } from "next/font/google";

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
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body
        className={`${orbitron.variable} font-orbitron h-screen overflow-hidden bg-cyber-gradient bg-cyber-overlay`}
      >
        {children}
      </body>
    </html>
  );
}
