# UHRP Workshop Frontend

Broadcast text posts, upload images through UHRP, and publish UHRP references as BSV-backed post content.

## Overview

This workshop application demonstrates current BSV application patterns:

- `@bsv/sdk` `WalletClient` for BRC-100 wallet access.
- `StorageUploader` for publishing files to UHRP storage.
- `@bsv/uhrp-react` for rendering UHRP-backed media.
- PushDrop-style HelloWorld tokens for text and image-reference posts.

## Development Instructions

Clone the repo, then run npm i to install packages.

To start the live development server on localhost:8088, run npm run start.

Start a BRC-100 compatible wallet such as BSV Desktop or BSV Browser to interact with this application.

Your changes should be reflected on-screen whenever you save in your editor, or reload.

## HelloWorld Protocol Document

You can find the HelloWorld Protocol in PROTOCOL.md

## Tools Used

This HelloWorld application uses various Bitcoin and web-related tools for different things:

- React We use React to render the webpage UI for this application, and track the state of the page.
- MUI We use a UI framework within React called MUI to help with page styling, text fields, buttons, and dialog boxes.
- Bitcoin SV We use the Bitcoin SV blockchain to timestamp and register our HelloWorld message tokens, and we rely on satoshis (a measurement of Bitcoin), so that the HelloWorld tokens are valuable.
- BSV TypeScript SDK We use `@bsv/sdk` so users can connect through a BRC-100 wallet, create tokens, and upload UHRP-backed media.
- PushDrop We use PushDrop to create Bitcoin tokens that follow the HelloWorld protocol. - PushDrop makes it easier to add data payloads to tokens, while still being able to give them value.

## License

The license for the code in this repository is the Open BSV License.
