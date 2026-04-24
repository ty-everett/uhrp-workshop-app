# BSV Workshop App: UHRP

This project is a frontend-only workshop app that lets users:

- Publish text posts on-chain.
- Upload images to UHRP storage.
- Publish the image UHRP URL as post content.
- Render posts as either text or images, depending on content.

The app uses the current `@bsv/sdk` storage APIs with a BRC-100 `WalletClient`. BSV Desktop, BSV Browser, or any compatible BRC-100 wallet can satisfy the wallet side of the flow.

## Project Structure

```txt
.
|- deployment-info.json
|- package.json
|- frontend/
   |- package.json
   |- src/
   |- public/
```

## Quick Start

Install dependencies:

```bash
npm install
cd frontend && npm install
```

Run the frontend locally:

```bash
cd frontend
npm run dev
```

Build the frontend:

```bash
cd frontend
npm run build
```

## UHRP Components in This App

### 1) StorageUploader (`@bsv/sdk`)

Used when creating an image post.

Flow:

1. User chooses an image file in the upload tab.
2. The file is converted to `Uint8Array` from `File.arrayBuffer()`.
3. `StorageUploader.publishFile({ file, retentionPeriod })` uploads the bytes.
4. The returned UHRP URL is normalized to base58 text.
5. That base58 string is passed to `createToken(...)` as the post content.

What this gives you:

- Content-addressed storage by hash.
- Configurable retention period (for example: 1 hour, 1 day, 7 days, 30 days).

### 2) StorageDownloader concepts (`@bsv/sdk`)

This app currently uses `@bsv/uhrp-react` for display-time resolution, but the same ecosystem supports direct downloader flows through `StorageDownloader`.

`StorageDownloader` is useful when you want to:

- Resolve a UHRP identifier to one or more HTTP URLs.
- Download raw file bytes yourself.
- Build custom processing pipelines (validation, transforms, caching, etc.).

In other words:

- Use `StorageUploader` for publishing.
- Use `StorageDownloader` for low-level retrieval.
- Use `@bsv/uhrp-react` for convenient React rendering.

### 3) UHRP React (`@bsv/uhrp-react`)

Used when rendering message tiles.

Rendering rule in this app:

1. If a post message is a valid UHRP URL/base58 hash, render `<Img src={...} />`.
2. Otherwise render plain text.

This allows mixed feeds where users can post either:

- Human-readable text messages
- UHRP-backed image posts

## Environment Configuration

The uploader storage service can be configured in the frontend via:

- `VITE_UHRP_STORAGE_URL`

If not provided, the app uses its built-in default from `frontend/src/App.tsx`.

The current default storage host is `https://go-uhrp-us-1.bsvblockchain.tech`.

## Notes for Workshop Participants

- Image posts are still "messages" at token level; the message value is the UHRP reference.
- UHRP references are compact and content-addressed.
- Rendering is deterministic: if the message parses as a UHRP URL, the UI treats it as image content.
