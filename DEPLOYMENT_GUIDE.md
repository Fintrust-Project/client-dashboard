# Deployment Guide (GitHub & Vercel)

Follow these steps to deploy your application for free.

## 1. Push to GitHub

1.  **Create a New Repository**:
    *   Go to [GitHub.com](https://github.com/new).
    *   Name your repository (e.g., `cms-client-dashboard`).
    *   **Do NOT** initialize with README, .gitignore, or License (we already have them).
    *   Click "Create repository".

2.  **Push Your Code**:
    *   Copy the commands under basic section "…or push an existing repository from the command line".
    *   They will look like this (run these in your terminal):
        ```bash
        git remote add origin https://github.com/YOUR_USERNAME/cms-client-dashboard.git
        git branch -M main
        git push -u origin main
        ```

## 2. Deploy to Vercel

1.  **Import Project**:
    *   Go to [Vercel Dashboard](https://vercel.com/dashboard).
    *   Click **"Add New..."** -> **"Project"**.
    *   Select "Continue with GitHub" and choose the `cms-client-dashboard` repo you just created.

2.  **Configure Project**:
    *   **Framework Preset**: Vite (should be auto-detected).
    *   **Root Directory**: `./` (default).

3.  **Add Environment Variables (CRITICAL)**:
    *   Expand the **"Environment Variables"** section.
    *   Copy the values from your local `.env` file and add them here:
        *   **Key**: `VITE_SUPABASE_URL` | **Value**: (Your Supabase URL, e.g., `https://xyz.supabase.co`)
        *   **Key**: `VITE_SUPABASE_ANON_KEY` | **Value**: (Your long Anon Key)
    *   *Note: Since these variables start with `VITE_`, they will be exposed to the browser. This is normal for Supabase Anon keys.*

4.  **Deploy**:
    *   Click **"Deploy"**.
    *   Wait for the build to finish.
    *   Your site is now live!

## 3. Verify
*   Open the deployed URL.
*   Try logging in with your Supabase user credentials.
