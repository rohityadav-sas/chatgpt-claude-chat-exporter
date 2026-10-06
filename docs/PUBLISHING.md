# Publishing

1. Run unit and browser tests, then `npm run package`.
2. Upload the ZIP in releases/ to the Chrome Web Store developer dashboard. Its manifest must remain at ZIP root.
3. Paste the listing and permission justifications from STORE-LISTING.md.
4. Host PRIVACY.md at a publicly accessible URL. Verify the privacy URL is readable while signed out.
5. Supply the developer support email, public privacy URL, required screenshots and store promotional images. Use synthetic chats rather than private conversations.
6. Review all privacy declarations against actual behavior, select distribution and submit for review.

The production ZIP is prepared locally; creating it does not publish the extension. The public privacy-policy URL, support contact, store images and dashboard submission remain publishing steps.

## Firefox

1. Run `node scripts/build.mjs --release --firefox`, then `npx web-ext lint --source-dir dist`.
2. Run `node scripts/package.mjs --firefox` on Windows to create the Firefox ZIP.
3. Submit the Firefox ZIP to Mozilla and provide unbundled source, `package-lock.json`, assets and build scripts as a separate source archive.
4. Include the exact Node/npm versions, operating-system requirements and build commands in the source README. Verify rebuilt files against the uploaded extension.
5. Save the listing, privacy policy, icon, screenshots and reviewer testing notes. Submission is complete when Mozilla reports Awaiting Review; publication follows review.

Official references:
https://developer.chrome.com/docs/webstore/prepare
https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
