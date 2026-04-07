type AuthResponse = {
  accessToken: string;
};

const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000';

async function waitForApi(timeoutMs = 30000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/users`);
      if (response.status > 0) return;
    } catch {
      // Continue retrying until timeout.
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new Error(`API did not become ready within ${timeoutMs}ms`);
}

async function postJson<T>(path: string, body: Record<string, string>, token?: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`POST ${path} failed (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}

async function get(path: string, token: string): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function run(): Promise<void> {
  await waitForApi();

  const id = Date.now();
  const email = `smoke.${id}@priv.local`;
  const password = `SmokePass!${id}`;

  const register = await postJson<AuthResponse>('/auth/register', {
    email,
    name: 'Smoke User',
    password,
  });
  if (!register.accessToken) throw new Error('Register did not return accessToken');

  const login = await postJson<AuthResponse>('/auth/login', {
    email,
    password,
  });
  if (!login.accessToken) throw new Error('Login did not return accessToken');

  const profile = await get('/users/me', login.accessToken);
  if (!profile.ok) throw new Error(`/users/me failed (${profile.status})`);

  const users = await get('/users', login.accessToken);
  if (!users.ok) throw new Error(`/users failed (${users.status})`);

  const ice = await get('/webrtc/ice-config', login.accessToken);
  if (!ice.ok) throw new Error(`/webrtc/ice-config failed (${ice.status})`);

  console.log('Smoke test passed: auth/users/webrtc endpoints are healthy.');
}

void run().catch((error: unknown) => {
  console.error('Smoke test failed.');
  console.error(error);
  process.exit(1);
});
