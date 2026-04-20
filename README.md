# engram-anchor-bridge

Bridge bot that reads Strata block status, creates Merkle batches, and anchors batch metadata to Babylon.

## Prerequisites

Required for this repository:

- Node.js: `20.x` (LTS recommended)
- npm: comes with Node.js
- Docker Engine: `24+` (if running with Docker)
- Docker Compose plugin: `v2+`

Not required for this repository:

- Python: not required
- Rust/Foundry (smart-contract tooling): not required

## Installation

### Option A: Run with Node.js directly

1. Install dependencies:

```bash
cd anchor-bot
npm install
```

2. Create local env file from template:

```bash
cp ../.env.example ../.env
```

3. Edit `.env` and fill real values (especially `BABYLON_MNEMONIC`).

### Option B: Run with Docker Compose

1. Create `.env` from `.env.example` at repository root.
2. Fill all required values.

## How To Run

### Run locally (Node.js)

```bash
cd anchor-bot
node index.js
```

### Run with Docker Compose

```bash
docker compose up -d --build
```

### View logs

```bash
docker compose logs -f babylon-upload-bot-js
```

### Stop service

```bash
docker compose down
```

## Environment Variables

See `.env.example` for all variables and inline notes.

## License

This project is licensed under the MIT License. See `LICENSE`.
