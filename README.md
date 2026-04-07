# Priv

Local stack for **real-time, peer-to-peer** encrypted chat: NestJS (signaling + auth), React (WebRTC DataChannel + E2EE), PostgreSQL (users only), Redis (presence), and coturn (TURN).

Chat content is **not** stored on the server; messages flow only over the WebRTC DataChannel after clients exchange keys via the signaling socket.

## Services

- `backend` — `http://localhost:3000` (REST: auth, users, ICE config; Socket.IO: signaling only)
- `postgres` — user accounts (`localhost:5432`)
- `redis` — presence / socket mapping (`localhost:6379`)
- `coturn` — TURN (`localhost:3478`)

## Run locally

```bash
docker compose up --build --watch
```

Frontend (dev):

```bash
cd frontend && npm install && npm run dev
```

Point the app at `http://localhost:3000` for the API (see `frontend/src/App.tsx` for `API_BASE`).

## E2EE + WebRTC

1. Clients authenticate; signaling uses JWT on Socket.IO.
2. For each chat, clients generate ECDH (P-256) key pairs and exchange public keys over signaling only.
3. They derive a shared AES-GCM key and encrypt messages before sending on the DataChannel.
4. The backend never sees plaintext messages and does not persist chat history.

## Next steps

- Optional: tighten signaling (emit to specific socket ids), reconnection UX, and production hardening (CORS, TLS, secrets).
