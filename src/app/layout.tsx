import type { Metadata, Viewport } from "next";
import "./globals.css";
import { UserModeProvider } from "@/components/context/UserModeContext";
import PwaInstaller from "@/components/pwa/PwaInstaller";

export const metadata: Metadata = {
  applicationName: "CSC",
  title: "Forge Je'daii | Combat Sensei Compagnon",
  description: "Compagnon de combat pour la Forge Je'daii",
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CSC",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#080b16",
  colorScheme: "dark",
  viewportFit: "cover",
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
        <UserModeProvider>
          {children}
          <PwaInstaller />
        </UserModeProvider>
      </body>
    </html>
  );
}
