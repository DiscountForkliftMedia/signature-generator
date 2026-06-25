# Discount Forklift — Signature Card Generator (AI-Powered)

A Next.js + Gemini app that **clones an existing signature card and only swaps the photo + contact info**, using Google's `gemini-3.1-flash-image-preview` image-editing model. Designed to deploy on Vercel.

## How it works

This is an **image-editing app**, not a layout app. You give it two images plus some form data; it gives you back a near-identical card with the changes applied.

```
Inputs:
  • New employee headshot                    ← required
  • Reference card                           ← built-in default; upload to override
  • Name, job title, contact info, location
  • Optional: smile, bigger smile, studio lighting
        ↓
Sent as a multimodal prompt (text + 2 images) to
  gemini-3.1-flash-image-preview
        ↓
Returns: edited card image (ready to download as PNG)
```

## Features

| Feature | Notes |
| --- | --- |
| 🎨 **Pixel-perfect cloning via AI** | Gemini reproduces the entire reference card — fonts, logos, colors, backgrounds — and only changes what you tell it to. |
| 🏢 **Location toggle** | Denver · Las Vegas · Phoenix · DFW. Picking a location sets the address line shown on the card. All four city names in the location strip always stay the same uniform green — no city is emphasized. |
| 🖼️ **Built-in reference card** | A reference card is bundled on the server, so employees only need to upload a headshot. Uploading a reference in the UI overrides the default. |
| 🌐 **Hablo Español toggle** | Adds or removes the `Hablo Español` line. The prompt is hardened against hallucinated Spanish — it forces the exact two-word phrase (with the ñ tilde) or nothing. |
| 😊 **Smile enhancement (optional)** | Asks Gemini to give the new person a large, genuine, teeth-showing corporate smile. |
| 😁 **Even bigger smile (optional)** | An ear-to-ear grin. Overrides the regular smile when both are on. |
| 💡 **Lighting enhancement (optional)** | Even, studio-style lighting on the headshot. |
| 🧑 **Headshot uploader (Field 1)** | The new employee's photo. **Required.** |
| 🖼️ **Reference uploader (Field 2)** | Optional override for the built-in reference card. |
| 🗜️ **Client-side compression** | Uploads are downscaled to 1600px max and re-encoded as JPEG (q0.9) before being sent, to keep the request payload small. |
| ⬇️ **PNG download** | One click from the result panel. Filename is `<year> <name>.png` (e.g. `2026 Doug Bolinger.png`). |

> **Note:** Form state is **not** persisted. Reloading the page resets everything to defaults.

## Quick start

```bash
npm install
cp .env.example .env.local
# Add your key to .env.local — get one at https://aistudio.google.com/apikey
npm run dev
```

Open <http://localhost:3000>.

### Built-in reference card

Add the master signature card the app should clone at:

```
public/reference-card.png   (.jpg / .jpeg / .webp also accepted)
```

The API route loads this automatically when no reference is uploaded, so users
only need to provide a headshot. If the file is missing and no reference is
uploaded, generation returns a clear error.

## Environment variables

| Var | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | **Yes** | Used by the image-editing route. |
| `GEMINI_IMAGE_MODEL` | No | Override the model. Defaults to `gemini-3.1-flash-image-preview`. Use a higher-fidelity image model for better results at higher cost. |

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo in Vercel.
3. Add `GEMINI_API_KEY` under Project Settings → Environment Variables.
4. Deploy. The image route sets `maxDuration = 60` to allow for Gemini's edit time.

## The prompt

Lives in [app/api/generate-card/route.ts](app/api/generate-card/route.ts) → `buildPrompt()`. It frames the task as a flawless reproduction of the reference card and only permits three categories of change:

1. **Photo replacement** — drop the new headshot into the existing circular frame, matching the original crop, ring, position, and scale. Optionally adjust expression (smile / bigger smile) and lighting.
2. **Text value updates** — name, title, optional Spanish line, cell, main, email, website, and address. Every visual property (color, font, weight, size, alignment, drop shadow) is preserved; only the words change.
3. **Uniform location strip** — render all four cities (Denver · Las Vegas · Phoenix · DFW) in the same green, recoloring any bold/white city to match, so none is emphasized.

Everything else — banner, forklift-and-heart graphic, tagline, background, script logo, shield wordmark, corner wordmark, all field labels, layout, and the ~1000×838 aspect ratio — is to be preserved pixel-for-pixel. The prompt also carries a **color-fidelity** directive — the model tends to wash colors out, so it's explicitly told to match the reference's saturation/vibrancy exactly and keep the reds and greens fully saturated — plus an explicit `ABSOLUTELY DO NOT` list (don't desaturate any color, don't invent colors, don't add highlight boxes / pills / fills behind text, don't recolor text, don't add underlines, watermarks, or new graphics, don't crop or rotate, don't hallucinate Spanish words). The forklift heart in particular must keep its exact color from the reference.

Tune the prompt to taste; the model responds well to specific, declarative directives.

## Project structure

```
app/
  api/
    generate-card/route.ts   ← Gemini image-editing route (the brain)
  layout.tsx
  page.tsx                   ← UI: form on left, result on right
  globals.css
components/
  ControlPanel.tsx           ← Form controls, toggles, uploaders, Generate button
  ImageUploader.tsx          ← Used twice (headshot + reference); handles compression
lib/
  addresses.ts               ← The four locations + display order
  types.ts                   ← EmployeeData type + defaults
public/
  reference-card.png         ← Built-in reference card (you provide this)
```

## Notes on form fields

- **Main number** (`877-779-9431`) and **Website** (`www.DiscountForklift.us`) are fixed/read-only in the UI — they're sent to the prompt but not user-editable.
- **Generate** is enabled once a headshot is uploaded and the name and job title are filled in. The reference card is optional (built-in default).

## Cost notes

Each "Generate Card" click is one Gemini image edit (a small fraction of a cent at current pricing). Make sure billing is enabled on your AI Studio key.
