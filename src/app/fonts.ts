import { Barlow_Condensed, IBM_Plex_Sans } from "next/font/google";

/** Both families are SIL OFL 1.1 (see assets/asset-register.json FONT-DISPLAY / FONT-UI); next/font self-hosts them at build time. */
export const displayFont = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const uiFont = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-ui",
  display: "swap",
});
