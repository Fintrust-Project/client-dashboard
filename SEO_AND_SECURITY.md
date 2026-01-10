# SEO and Security Optimization Guide

This document provides instructions for manual setup of SEO and Security configurations that cannot be automated in the codebase.

## 1. Google Analytics
We have added a placeholder script in `index.html`. 
To activate it:
1. Go to [Google Analytics](https://analytics.google.com/).
2. Create a new Property and get your **G-Tracking ID** (e.g., `G-1234567890`).
3. Replace all occurrences of `G-XXXXXXXXXX` in `index.html` with your actual ID.

## 2. SPF Record (Email Security)
To prevent spammers from spoofing your email (Low Priority Recommendation), you must add an **SPF (Sender Policy Framework)** record to your domain's DNS settings.

### How to set it up:
1. Log in to your domain registrar (e.g., GoDaddy, Namecheap, Google Domains).
2. Go to the **DNS Management** or **Name Server** settings.
3. Add a new **TXT Record**:
   - **Host/Name**: `@` or leave blank.
   - **Value**: `v=spf1 include:_spf.google.com ~all` (If you use Google Workspace) or your email provider's specific SPF string.
   - **TTL**: Auto or 1 hour.

## 3. WebP Image Formats
We highly recommend converting `src/assets/logo.png` to `logo.webp`. 
You can use free online converters like **Squoosh.app** or **CloudConvert**. Once converted:
1. Place the new file in `src/assets/logo.webp`.
2. Update the import in `PublicLanding.jsx` and `SidePanel.jsx`.

## 4. Render-Blocking Optimization
We have implemented basic optimizations. To further improve mobile speed:
- Use a CDN like Cloudflare to serve your site.
- Enable Gzip or Brotli compression on your hosting provider (Vercel/Netlify do this automatically).

## 5. Structured Data
We've added JSON-LD to `index.html`. This helps Google understand that "India Invest Karo" is an organization with specific contact details, improving your appearance in the "Knowledge Graph" (the sidebar on Google search).
