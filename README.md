# engram-anchor-bridge

Checkpoint anchoring bridge for the Engram protocol. The bridge reads finalized block status from a Engram node (the Engram publication-layer node), aggregates block headers into Merkle-batched checkpoints, and submits the checkpoint commitment to the settlement backend.

This is the operational implementation of the checkpoint flow described in the Engram paper (Section 3.3, "Data Lifecycle and Anchoring Flow"; measured as Stage 3 in Section 4.3).

## Current backend and roadmap

The current settlement backend is **Babylon** (testnet): checkpoints are submitted as Babylon transactions and inherit Bitcoin timestamping through Babylon's own anchoring. Submitting a commitment directly to Bitcoin (OP_RETURN / Taproot) is straightforward but costly per anchor; Babylon is the cost-efficient default, and the paper's cost–latency analysis (§4.4) is the tool for choosing anchoring frequency. The next milestones are (i) a **trust-minimized direct anchoring path** for epoch-level checkpoints, and (ii) the substantive gap: a **verification library** that produces and checks SPV-style proofs that an Engram checkpoint is committed under Bitcoin proof-of-work (stretch goal: direct-path proofs serialized in the OpenTimestamps format, verifiable with standard OTS tooling). The bridge is written so the submission backend is swappable; `src/babylon.js` is one backend implementation.

- Paper: *Engram: Bitcoin-Anchored Data Publication and Persistent Decentralized Storage* (under review at ACM TOIT) · artifacts: [DOI 10.5281/zenodo.19879674](https://doi.org/10.5281/zenodo.19879674)
- Organization: [github.com/EngramProtocol](https://github.com/EngramProtocol)

## Layout

```
anchor-bot/
  index.js          entry point
  src/Engram.js     reads block status from the Engram node RPC
  src/merkle.js     Merkle batch construction over block headers
  src/babylon.js    settlement submission backend (current: Babylon testnet)
  src/epoch-store.js  local persistence of anchored epochs
  src/config.js     environment configuration
```

## Prerequisites

- Node.js 20.x (LTS), npm
- Docker Engine 24+ and Docker Compose v2 (only if running with Docker)

## Run

**Node.js:**

```bash
cd anchor-bot
npm install
cp ../.env.example ../.env   # then fill values; see .env.example notes
node index.js
```

**Docker Compose:**

```bash
cp .env.example .env         # fill values
docker compose up -d --build
docker compose logs -f babylon-upload-bot-js
```

## Configuration

All variables are documented inline in `.env.example`. The bridge needs a Engram RPC endpoint, a settlement RPC endpoint, and a funded testnet wallet mnemonic. **Never commit a real mnemonic or a `.env` file.**

## License

Apache-2.0. See `LICENSE` and `NOTICE`.
