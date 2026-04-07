#!/usr/bin/env node
/**
 * Two-user Socket.IO signaling smoke test (requires running API on BASE_URL).
 * Run from repo: cd backend && npm install && npm run test:signaling
 */
const { io } = require('socket.io-client');

const BASE = process.env.API_URL ?? 'http://localhost:3000';
const NS = `${BASE}/signaling`;

async function register(email, name, password) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password }),
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`register ${email}: ${res.status} ${JSON.stringify(body)}`);
  return body.accessToken;
}

function connect(token) {
  return io(NS, {
    transports: ['websocket'],
    auth: { token },
  });
}

function waitConnect(socket, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} connect timeout`)), 15000);
    socket.once('connect', () => {
      clearTimeout(t);
      resolve();
    });
    socket.once('connect_error', (err) => {
      clearTimeout(t);
      reject(err);
    });
  });
}

function waitEvent(socket, event, predicate, timeoutMs) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`timeout waiting for ${event}`));
    }, timeoutMs);
    const handler = (payload) => {
      if (predicate(payload)) {
        clearTimeout(t);
        socket.off(event, handler);
        resolve(payload);
      }
    };
    socket.on(event, handler);
  });
}

async function main() {
  const id = Date.now();
  const pass = `TestPass!${id}`;
  const tokenA = await register(`sig-a.${id}@priv.local`, 'Sig A', pass);
  const tokenB = await register(`sig-b.${id}@priv.local`, 'Sig B', pass);

  const meA = await fetch(`${BASE}/users/me`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  }).then((r) => r.json());
  const meB = await fetch(`${BASE}/users/me`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  }).then((r) => r.json());

  const roomId = [meA.id, meB.id].sort().join(':');
  console.log(`Room ${roomId}`);

  const sa = connect(tokenA);
  const sb = connect(tokenB);
  await Promise.all([waitConnect(sa, 'A'), waitConnect(sb, 'B')]);
  console.log('Both sockets connected');
  await new Promise((r) => setTimeout(r, 400));

  sa.emit('join', { roomId });
  sb.emit('join', { roomId });

  const dummyJwk = { kty: 'EC', crv: 'P-256', x: 'test', y: 'test', key_ops: [], ext: true };

  const recvB = waitEvent(
    sb,
    'public-key',
    (p) => p.fromUserId === meA.id && p.targetUserId === meB.id,
    5000,
  );
  sa.emit('public-key', { roomId, targetUserId: meB.id, key: dummyJwk });
  await recvB;
  console.log('✓ public-key relay A → B');

  const recvA = waitEvent(
    sa,
    'public-key',
    (p) => p.fromUserId === meB.id && p.targetUserId === meA.id,
    5000,
  );
  sb.emit('public-key', { roomId, targetUserId: meA.id, key: dummyJwk });
  await recvA;
  console.log('✓ public-key relay B → A');

  const fakeSdp = { type: 'offer', sdp: 'v=0\r\n' };
  const recvOffer = waitEvent(
    sb,
    'offer',
    (p) => p.fromUserId === meA.id && p.targetUserId === meB.id && p.sdp?.sdp,
    5000,
  );
  sa.emit('offer', { roomId, targetUserId: meB.id, sdp: fakeSdp });
  await recvOffer;
  console.log('✓ offer relay A → B');

  sa.disconnect();
  sb.disconnect();
  console.log('\nAll signaling relay checks passed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});