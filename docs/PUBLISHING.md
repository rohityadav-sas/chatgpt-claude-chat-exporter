# Publishing

1. Run unit and browser tests, then `npm run package`.
2. Upload the ZIP in releases/ to the Chrome Web Store developer dashboard. Its manifest must remain at ZIP root.
3. Paste the listing and permission justifications from STORE-LISTING.md.
4. Host PRIVACY.md at a publicly accessible URL. The source GitHub repository is private, so its private file URL is not suitable.
5. Supply the developer support email, public privacy URL, required screenshots and store promotional images. Use synthetic chats rather than private conversations.
6. Review all privacy declarations against actual behavior, select distribution and submit for review.

The production ZIP is prepared locally; creating it does not publish the extension. The public privacy-policy URL, support contact, store images and dashboard submission remain publishing steps.

Official references:
https://developer.chrome.com/docs/webstore/prepare
https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
