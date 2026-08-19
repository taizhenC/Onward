import localFont from "next/font/local";

// The reading face. Loaded from committed WOFF2 in app/fonts/ rather than
// next/font/google, because production compilation must never fetch a font over
// the network — see the rule in app/globals.css and the provenance notes in
// app/fonts/README.md.
//
// Both cuts are variable on `opsz` as well as `wght`, so `font-optical-sizing:
// auto` (the browser default) hands display sizes a display-cut drawing and
// prose a text-cut one. That is the point of the face; do not pin `opsz`.
export const sourceSerif = localFont({
  src: [
    {
      path: "./fonts/source-serif-4-latin-roman.woff2",
      // The vendored roman is instanced to this range. Declaring it is required:
      // without an explicit weight descriptor the face collapses to 400 and the
      // browser synthesizes every heavier weight by smearing the outlines.
      weight: "300 700",
      style: "normal",
    },
    {
      path: "./fonts/source-serif-4-latin-italic.woff2",
      weight: "400 600",
      style: "italic",
    },
  ],
  variable: "--font-source-serif",
  // Prose must be readable while the face is still arriving. A distressed reader
  // on a slow connection should never wait on a download to see words.
  display: "swap",
  // next/font/local defaults this to Arial — a sans — which would compute
  // size-adjust and ascent-override from the wrong metrics and make the swap
  // visibly shift the page. Times New Roman is the correct metric donor here.
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "Times New Roman", "serif"],
});
