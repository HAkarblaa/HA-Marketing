HA Marketing - Firebase Web Push final wiring

This package contains the complete current website plus final push-notification files.

Already completed in dashboards:
- Firebase Web App configuration
- VAPID public key
- Firebase Admin service account secrets in Supabase Edge Function Secrets
- Edge Function send-fcm-push exists and is deployed

To finish the new automatic push wiring:
1) Supabase > Edge Functions > send-fcm-push > Code
   Replace index.ts with EDGE-send-fcm-push-index.ts and redeploy.
   Keep "Verify JWT with legacy secret" OFF.
2) Supabase > SQL Editor
   Run PUSH-NOTIFICATIONS-FINAL.sql once.
3) Upload/replace the website files on GitHub Pages using this package.
4) A signed-in user clicks the bell on the homepage and allows notifications once per device.

Security:
- Firebase private key is NOT included in this package.
- The Edge Function reads it from Supabase Secrets.
- The browser stores only Firebase's public configuration/VAPID key.
- The Edge Function only sends notifications that already exist in public.notifications.
