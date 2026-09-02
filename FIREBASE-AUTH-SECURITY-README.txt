HA Marketing - Firebase Auth security update

Required one-time Firebase Console step:
1) Firebase Console > Authentication > Sign-in method
2) Enable Anonymous provider
3) Save
4) Realtime Database > Rules
5) Replace rules with firebase-database.rules.json from this package and Publish

What changed:
- Taxi, Tuktuk, Delivery, Driver, Domino and Penalties now authenticate to Firebase anonymously with persistent browser identity.
- New rides store customerUid.
- Driver acceptance stores driverUid.
- Ride chat and ride calls are limited to the ride customer/driver Firebase UID.
- Ride writes are restricted to the customer, assigned driver, or a driver claiming a searching ride.
- Online game rooms require Firebase authentication and use the Firebase UID as the player ID.
- Root database read/write remains denied.

Important architecture note:
Firebase anonymous identity is browser/device-specific. Signing into the same Supabase account on a different device does not automatically produce the same Firebase UID. Full cross-device identity unification would require a server-issued Firebase custom token or moving these realtime features to Supabase.
