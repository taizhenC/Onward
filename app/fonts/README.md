# Vendored typefaces

Onward self-hosts its reading face. Production compilation must never fetch a font
over the network (`app/globals.css` states this rule), which rules out
`next/font/google` — it downloads at build time. These files are committed instead
and loaded through `next/font/local` from `app/fonts.ts`.

## Source Serif 4

Designed by Frank Grießhammer for Adobe. Licensed under the SIL Open Font License
1.1 — the full license text sits beside these files in `OFL.txt`, as OFL clause 2
requires of any redistributed copy.

| File | Axes | OpenType features | Size |
| --- | --- | --- | --- |
| `source-serif-4-latin-roman.woff2` | `wght 300–700`, `opsz 8–60` | `smcp`, `onum`, `lnum`, `liga`, `kern`, `ccmp`, `mark` | 133 KB |
| `source-serif-4-latin-italic.woff2` | `wght 400–600`, `opsz 8–60` | `liga`, `kern`, `ccmp`, `mark` | 79 KB |

Both keep the **optical size** axis, which is the reason this face was chosen. A
display-size cut is a different drawing from a text-size cut — finer hairlines,
crisper serifs — so the hero no longer has to reach for a heavy weight to hold the
page, which is what made it shout.

The roman also keeps **small caps** and **oldstyle figures**. These are the two
features that read as *typeset* rather than *styled*, and they are the reason the
files are built from the upstream Adobe/Google sources rather than taken from a
package: the webfonts served by Google Fonts (and mirrored by `@fontsource`) strip
`smcp`, `c2sc` and `onum` from their subsets.

## Rebuilding

Sources are the upstream variable TTFs in `google/fonts`:

```
ofl/sourceserif4/SourceSerif4[opsz,wght].ttf
ofl/sourceserif4/SourceSerif4-Italic[opsz,wght].ttf
```

Built with `fonttools` (axis limiting, then subsetting to the Google "latin"
unicode range plus the punctuation this product sets):

```sh
UNI='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,\
U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2212,U+2215,U+FEFF,U+FFFD'

# roman — the full working weight range, small caps and oldstyle figures kept
python -m fontTools.varLib.instancer 'SourceSerif4[opsz,wght].ttf' wght=300:700 -o roman.ttf
pyftsubset roman.ttf --output-file=source-serif-4-latin-roman.woff2 --flavor=woff2 \
  --unicodes="$UNI" \
  --layout-features='kern,liga,ccmp,mark,rvrn,calt,locl,onum,lnum,smcp'

# italic — narrower weight range; it is never set in small caps
python -m fontTools.varLib.instancer 'SourceSerif4-Italic[opsz,wght].ttf' wght=400:600 -o italic.ttf
pyftsubset italic.ttf --output-file=source-serif-4-latin-italic.woff2 --flavor=woff2 \
  --unicodes="$UNI" \
  --layout-features='kern,liga,ccmp,mark,rvrn,calt,locl'
```

Axis limiting is what keeps the payload honest: the untrimmed roman subsets to
191 KB and the italic to 161 KB. Narrowing the weight ranges to what the design
actually sets, and dropping small caps from the italic, brings the pair to 212 KB
without giving up optical sizing on either.
