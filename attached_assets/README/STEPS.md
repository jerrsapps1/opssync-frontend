# Apple Wallets Prep + Owner Toggle

This bundle lets you prepare for Apple Pay now (domain verification) and add an owner-only
**info toggle** to show/hide "Apple/Google wallets available" messaging in your UI.
You can enable the actual wallet methods in Stripe later.

## 1) Files in this bundle
- `public/.well-known/apple-developer-merchantid-domain-association`
  - **Replace** the contents with the file you download from Stripe Dashboard → Settings → Payments → Apple Pay → Add domain.
  - Keep the **exact** filename and path.
- `scripts/enable_wallets_info_toggle.js`
  - Adds a new owner flag `WALLETS_INFO` to your Owner Settings page and API.

## 2) Install
```bash
unzip apple_wallets_prep_bundle.zip
```

## 3) Add the owner toggle (optional, for messaging)
```bash
node scripts/enable_wallets_info_toggle.js
```
Set a default in your env:
```
FEATURE_WALLETS_INFO=0
```
Now your **Owner Settings** page will show `WALLETS_INFO` as a toggle.

## 4) Domain verification for Apple Pay (when ready)
In Stripe Dashboard:
1. Go to **Settings → Payments → Wallets → Apple Pay → Add new domain**.
2. Download the verification file.
3. Replace the contents of:
   `public/.well-known/apple-developer-merchantid-domain-association`
   with the exact file from Stripe (no extra whitespace, no rename).
4. Deploy your site. Stripe will fetch:
   `https://<your-domain>/.well-known/apple-developer-merchantid-domain-association`

> If you serve static from Express, ensure dotfiles are allowed (or place the file in your frontend's public folder):
```ts
import path from "path";
import express from "express";
app.use("/.well-known", express.static(path.join(process.cwd(), "public/.well-known"), { dotfiles: "allow" }));
```

## 5) Turn wallets ON (later, no code change if using Stripe Checkout)
When you're ready, enable Apple Pay / Google Pay in Stripe Dashboard.
- **Stripe Checkout** shows wallet buttons automatically on supported devices.
- If you host payment UI yourself, render your Payment Request Button based on `WALLETS_INFO`.

## Notes
- This bundle is safe to ship now; it doesn't change payment behavior until you enable wallets in Stripe and/or flip your messaging flag.
