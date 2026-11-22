import type { Metadata, Viewport } from "next";
import { displayFont, uiFont } from "./fonts";
import "./globals.css";

const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: { default: "WARTRACE — How far can your knowledge take you?", template: "%s · WARTRACE" },
  description: "A daily history knowledge game. Seven rounds, one real answer each. Rarer valid answers carry your courier farther.",
  openGraph: {
    title: "WARTRACE",
    description: "Seven rounds. One real answer each. Rarer answers travel farther.",
    type: "website",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111715",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${uiFont.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
