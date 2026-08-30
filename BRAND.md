# Brand reference — harvested from the Wix build, 30 Aug 2026

## Palette

Taken from computed styles on the live "Puppy Connection Copy" build.

| Token | Hex | Where it is used |
|---|---|---|
| charcoal | `#262626` | Header background, primary dark surface |
| charcoal-2 | `#2f2e2e` | Secondary dark band |
| gold | `#f7d57f` | Footer background, accent text, highlight word ("FAMILY") |
| bronze | `#bc9b5d` | Secondary accent, used as both text and fill |
| olive | `#7c6b40` | Deep accent |
| cream | `#e6deca` | Text on dark surfaces |
| cream-2 | `#e7e2d2` | Light section background |
| off-white | `#fcfcfc` | Page background |
| grey | `#414141` | Body text alt |
| grey-mid | `#a6a6a6` | Muted text |

## Typefaces

| Role | Family | Notes |
|---|---|---|
| Display / wordmark | **Playfair Display** | "Puppy Connection", "Welcome to" (italic) |
| UI / navigation / body | **DIN Neuzeit Grotesk** (`dinneuzeitgroteskltw01`) | Condensed sans, all nav and body copy |
| Secondary headings | **Futura LT Book** | Some h1s, e.g. "Contact us" |

Both Playfair Display and a DIN-alike are freely substitutable in a rebuild.
Playfair Display is on Google Fonts. DIN Neuzeit Grotesk is licensed through
Wix; **Barlow Condensed** or **Oswald** are the closest free equivalents.

## Logo

Source file: `PuppyConnectionLogo (2).png`, 1851×897, white script wordmark
with a walking-figure-and-dog mark under an arc.

| File | Use |
|---|---|
| `img/brand/logo-white.png` | On charcoal header |
| `img/brand/logo-charcoal.png` | Generated from the white version, for light backgrounds |
| `img/brand/logo-charcoal-trim.png` | Same, whitespace trimmed to 1600×838 |

Tagline as set beneath the mark: *Connecting responsible breeders with loving families.*

## Hero

`img/brand/hero-home.jpg` — 2400×1014, infant with a puppy. Sourced from a
different Wix media account than her own uploads, so it is likely stock.
**Confirm licensing before production use.**

## Form vocabularies (real, from the Add Puppy form)

- **Gender**: Female, Male
- **Registry Type**: AKC, AKC Canine Partners, APRI, ACA, CKC, UKC
- **Breed**: NOT SET. The dropdown still contains Wix's default
  `Item 1 / Item 2` placeholders. See `_harvest/data/breeds.json` for a
  25-breed list derived from her actual live inventory instead.
