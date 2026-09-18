# Zero Fee UPI

Build a single-page web app called "one999" — a zero-fee UPI payment collection tool for India.



CONCEPT

UPI apps/limits often cap small-value or new-payee transfers, so the app splits any total

into multiple UPI QR codes of ₹1,999 or less. The payer scans and pays each code until the

full amount is covered. 100% client-side: no backend, no database, no accounts, no fees.



STACK

React + TypeScript + Tailwind + a QR library (qrcode.react or qrcode). Fully static; deployable on Vercel.



LAYOUT (desktop two-column, stacks on mobile)

Top bar: QR glyph logo + wordmark "one999", divider, tagline "Accept UPI payments".

Right side: a small pill badge with a lock icon reading "On-device".

Hero, left-aligned inside the content column:

  H1: "Collect the full amount. Pay ₹0 fees."

  Sub: "Accept UPI payments directly, with no setup or transaction fees."

Left card "Payment details" — subtitle "Add your UPI details and the full amount you're owed."

  - Your UPI ID (placeholder "name@bank")

  - Account holder name (placeholder "Full name")

  - hairline divider

  - Full amount to collect — ₹ prefix inside the field, "INR" suffix on the right,

    helper text "Maximum ₹1,99,900 · Up to 100 QR codes"

  - Payment note (label shows a muted "Optional" chip), placeholder "e.g. Invoice 001"

  - Full-width primary button "Generate QR codes →"

  - Footnote with lock icon: "Payment details never leave your browser."

Right column "Payment summary":

  - "Total to collect" with a very large ₹0.00 figure, live-updating in Indian digit grouping

  - rows: "QR codes" (count or —) and "Amount per QR" (Up to ₹1,999)

  - divider, then a dashed-border empty state: QR icon in a soft tinted square,

    "Collect every part of the payment", "Generate QR codes of ₹1,999 or less.",

    "Your customer pays each code to cover the full amount."

After generating, this panel becomes a grid of QR cards, each showing

"QR 1 of 5 · ₹1,999", the QR image, and Download PNG / Copy UPI link actions,

plus "Download all" and "Print sheet" buttons.

Footer: small muted disclaimer line + "Made with ❤️ by <name>".



SPLIT LOGIC

count = ceil(total / 1999); first count-1 codes = ₹1,999; last = total - 1999*(count-1).

Reject total <= 0 or > 199900. Round to 2 decimals; never emit a ₹0 code.



QR PAYLOAD

upi://pay?pa={upiId}&pn={encoded name}&am={amount with 2 decimals}&cu=INR&tn={encoded note + " (i/n)"}

URL-encode pn and tn. Nothing is ever sent to a server.



VALIDATION & SECURITY

- UPI ID regex ^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$, inline error under the field.

- Amount numeric, 2 decimals, within bounds; name required, max 100 chars.

- Strip/encode all user text before embedding in the URI; no dangerouslySetInnerHTML.

- No analytics that capture field values, no localStorage of UPI IDs by default.

- Clear disclaimer that the app never touches or holds money; payments go bank-to-bank via UPI.



DESIGN SYSTEM

Light, airy fintech aesthetic. Page background very light cool grey (#F7F8FC), cards pure

white with 16px radius, 1px #E8EAF2 border and a soft low shadow. Primary accent indigo/violet

#635BFF used only for the main button, links and the QR icon tint. Text: near-black #14161F

headings, #6B7280 muted body. Geometric rounded sans (Poppins / Plus Jakarta Sans) for headings

in bold, regular weight for body. Generous whitespace, 8px spacing scale, inputs 44px tall with

#E8EAF2 borders and an indigo focus ring. Subtle fade/slide-in when QR cards appear.

No dark mode needed. Accessible labels, keyboard-navigable, mobile-first responsive.



SEO

Title: "one999 — Accept UPI payments with ₹0 fees". Meta description about splitting a total

into ₹1,999 UPI QR codes, generated on-device. Add og:title, og:description, og:type, twitter:card.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0d979c65-e89d-4086-89fa-f2d2c3dd8b38).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
