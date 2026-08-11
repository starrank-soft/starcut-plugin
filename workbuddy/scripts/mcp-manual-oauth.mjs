#!/usr/bin/env node

import {
  createHash,
  randomBytes,
} from 'node:crypto';
import { existsSync } from 'node:fs';
import {
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

const HOSTS = {
  workbuddy: {
    callbackPort: 52961,
    resolveConfigPath,
  },
  trae: {
    callbackPort: 52960,
    resolveConfigPath,
  },
};

function readOption(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function base64Url(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function createPkcePair() {
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(
    createHash('sha256').update(verifier).digest(),
  );
  return { verifier, challenge };
}

function issuerFromMcpUrl(mcpUrl) {
  return `${mcpUrl.replace(/\/mcp\/?$/, '')}/api/auth`;
}

function resolveConfigPath(host) {
  if (host === 'workbuddy') {
    return join(homedir(), '.workbuddy', 'mcp.json');
  }

  if (process.platform === 'win32') {
    const appData = process.env.APPDATA;
    if (!appData) {
      throw new Error('APPDATA is not set; cannot resolve TRAE MCP config path.');
    }
    const candidates = [
      join(appData, 'Trae', 'User', 'mcp.json'),
      join(appData, 'Trae CN', 'User', 'mcp.json'),
    ];
    for (const candidate of candidates) {
      if (existsSync(dirname(candidate))) {
        return candidate;
      }
    }
    return candidates[0];
  }

  const candidates = [
    join(homedir(), 'Library', 'Application Support', 'Trae', 'User', 'mcp.json'),
    join(
      homedir(),
      'Library',
      'Application Support',
      'Trae CN',
      'User',
      'mcp.json',
    ),
  ];
  for (const candidate of candidates) {
    if (existsSync(dirname(candidate))) {
      return candidate;
    }
  }
  return candidates[0];
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const body = await response.text();
  let json;
  try {
    json = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(`Non-JSON response (${response.status}) from ${url}: ${body}`);
  }
  if (!response.ok) {
    throw new Error(
      `Request failed (${response.status}) for ${url}: ${JSON.stringify(json)}`,
    );
  }
  return json;
}

async function registerClient(issuer, host, redirectUri) {
  return fetchJson(`${issuer}/oauth2/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: host,
      redirect_uris: [redirectUri],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope: 'mcp:tools offline_access',
    }),
  });
}

function buildAuthorizeUrl({
  issuer,
  clientId,
  challenge,
  redirectUri,
  mcpUrl,
}) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    redirect_uri: redirectUri,
    scope: 'mcp:tools offline_access',
    state: 'starcut',
    resource: mcpUrl,
  });
  return `${issuer}/oauth2/authorize?${params.toString()}`;
}

function waitForAuthorizationCode(port) {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
      const code = url.searchParams.get('code');
      if (code) {
        response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('StarCut authorized - you can close this tab.');
        server.close(() => resolve(code));
        return;
      }
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Missing authorization code.');
    });

    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {});
    setTimeout(() => {
      server.close(() =>
        reject(new Error(`Timed out waiting for OAuth callback on port ${port}.`)),
      );
    }, 180_000);
  });
}

function openBrowser(url) {
  const platform = process.platform;
  if (platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], {
      detached: true,
      stdio: 'ignore',
    }).unref();
    return;
  }
  if (platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
}

async function exchangeCode({
  issuer,
  code,
  redirectUri,
  clientId,
  verifier,
  mcpUrl,
}) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
    resource: mcpUrl,
  });
  return fetchJson(`${issuer}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}

async function verifyInitialize(mcpUrl, accessToken) {
  const response = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'starcut-manual-oauth', version: '1.0.0' },
      },
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MCP initialize failed (${response.status}): ${text}`);
  }
}

async function mergeMcpConfig(configPath, mcpUrl, accessToken) {
  let existing = { mcpServers: {} };
  try {
    existing = JSON.parse(await readFile(configPath, 'utf8'));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
      throw error;
    }
  }

  const next = {
    ...existing,
    mcpServers: {
      ...(existing.mcpServers ?? {}),
      starcut: {
        type: 'http',
        url: mcpUrl,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  };

  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return configPath;
}

async function main() {
  const host = readOption('--host');
  const mcpUrl =
    readOption('--mcp-url') ??
    (process.env.NODE_ENV === 'production'
      ? 'https://api.starcut.io/mcp'
      : 'http://localhost:2330/mcp');
  const writeConfig = hasFlag('--write-config');

  if (!host || !HOSTS[host]) {
    throw new Error('Usage: node mcp-manual-oauth.mjs --host workbuddy|trae [--mcp-url URL] [--write-config]');
  }

  const { callbackPort } = HOSTS[host];
  const redirectUri = `http://127.0.0.1:${callbackPort}/callback`;
  const issuer = issuerFromMcpUrl(mcpUrl);
  const { verifier, challenge } = createPkcePair();

  console.log(`Registering OAuth client at ${issuer}/oauth2/register ...`);
  const registration = await registerClient(issuer, host, redirectUri);
  const clientId = registration.client_id;
  if (!clientId) {
    throw new Error(`Missing client_id in registration response: ${JSON.stringify(registration)}`);
  }

  const authorizeUrl = buildAuthorizeUrl({
    issuer,
    clientId,
    challenge,
    redirectUri,
    mcpUrl,
  });

  console.log(`Listening for callback on ${redirectUri} ...`);
  const codePromise = waitForAuthorizationCode(callbackPort);
  openBrowser(authorizeUrl);
  console.log('Opened the StarCut authorization page. Log in, pick a workspace, and allow StarCut.');
  console.log(`If the browser did not open, visit:\n${authorizeUrl}\n`);

  const code = await codePromise;
  console.log('Authorization code captured. Exchanging for tokens ...');

  const tokens = await exchangeCode({
    issuer,
    code,
    redirectUri,
    clientId,
    verifier,
    mcpUrl,
  });

  if (!tokens.access_token) {
    throw new Error(`Missing access_token in token response: ${JSON.stringify(tokens)}`);
  }

  console.log('Verifying MCP initialize ...');
  await verifyInitialize(mcpUrl, tokens.access_token);

  console.log('\nOAuth succeeded.');
  console.log(`CLIENT_ID=${clientId}`);
  console.log(`ACCESS_TOKEN=${tokens.access_token}`);
  if (tokens.refresh_token) {
    console.log(`REFRESH_TOKEN=${tokens.refresh_token}`);
  }
  if (tokens.expires_in) {
    console.log(`EXPIRES_IN=${tokens.expires_in}`);
  }

  if (writeConfig) {
    const configPath = resolveConfigPath(host);
    await mergeMcpConfig(configPath, mcpUrl, tokens.access_token);
    console.log(`WROTE_MCP_CONFIG=${configPath}`);
  } else {
    console.log(`MCP_CONFIG_PATH=${resolveConfigPath(host)}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
