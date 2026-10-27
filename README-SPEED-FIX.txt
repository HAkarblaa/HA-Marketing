HA Marketing website startup speed adjustment

Replace these four files at the website's root with the copies in this ZIP:
- ha-account-gate.js
- ha-entertainment-offline.js
- service-worker.js
- ha-entertainment-offline-manifest.json

The main page now installs and activates its service worker without waiting for the full offline bundle. The offline bundle starts downloading in the background when the user opens study, entertainment, a game, or the generator. Once downloaded, the existing offline experience remains available.

Website-only change: no Android build or Play Console upload is required. After publishing, close and reopen HA Marketing or refresh the website to load the updated service worker. First-time offline preparation still needs an internet connection.

Validation: browser test confirmed the homepage startup no longer precaches the 255-file bundle, the bundle completes on entry to a game, and no page errors occur. The local 407 ms DOM-ready result is not a measurement from a physical phone.
