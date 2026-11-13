# My Garage Companion — Accounts & cloud setup

The website has an **optional** Supabase account/cloud backup feature. It remains local-first until you configure a Supabase project and sign in. No account or cloud database is created automatically by a GitHub commit.

1. Create a Supabase project (an adult should review the provider's terms and account requirements where applicable).
2. Open **SQL Editor** in that project and run the contents of `supabase-setup.sql`. This creates a per-user backup table and row-level security policies.
3. In **Project Settings → API**, copy the **Project URL** and **publishable/anon key** into `cloud-config.js`. These values are public by design. **Never** put a `service_role` or secret key into a public GitHub repository.
4. Under **Authentication → Providers**, enable Email; decide whether to require email confirmation. Configure **Authentication → URL Configuration** with the published GitHub Pages URL (https://avreyradloff-source.github.io/garadge-test/) as Site URL / permitted redirect as needed.
5. Wait for GitHub Pages to deploy. Open **Data & Backup → Accounts & cloud backup**, create an account, verify email if prompted, then sign in.
6. On your first device, use **Upload this device to cloud**. On other devices, choose **Restore cloud to this device** (after exporting a local JSON backup). The first sync direction is intentionally manual to avoid silently overwriting records.
7. After the first successful upload or restore, changes made in the main garage app will upload automatically while signed in and online. This is **not** live two-way conflict resolution: avoid editing simultaneously on two devices; use Restore to refresh a second device before editing.

**Important:** The existing JSON Export/Import remains available. Keep independent backups. This feature saves one JSON snapshot per account, including any embedded photos, not separate files in Supabase Storage. Very large photo collections may exceed storage/request limits. Cloud sync is best-effort; check status and use manual backup if it fails. Browser storage and cloud are not encrypted end-to-end; Supabase manages server-side security. Authentication tokens are stored locally on the device for persistent login. Use a trusted device and sign out on shared devices.

**Testing:** Verify email signup, confirmation, sign-in, first upload, restore on another browser, sign-out, wrong password, network interruption, and row-level security isolation with two test accounts before relying on cloud backups.
