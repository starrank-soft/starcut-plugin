#!/usr/bin/env node

import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { existsSync } from 'node:fs';
import {
  chmod,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import {
  dirname,
  isAbsolute,
  join,
  resolve,
  win32 as win32Path,
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const HOSTS = new Set(['workbuddy', 'trae']);
const TRAE_PRODUCTS = new Set(['solo-cn', 'solo', 'ide-cn', 'ide']);

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

function traeConfigCandidates({
  platform = process.platform,
  home = homedir(),
  appData = process.env.APPDATA,
} = {}) {
  const joinPath = platform === 'win32' ? win32Path.join : join;
  if (platform === 'win32') {
    if (!appData) {
      throw new Error('APPDATA is not set; cannot resolve TRAE MCP config path.');
    }
    return {
      'solo-cn': joinPath(appData, 'TRAE SOLO CN', 'User', 'mcp.json'),
      solo: joinPath(appData, 'TRAE SOLO', 'User', 'mcp.json'),
      'ide-cn': joinPath(appData, 'Trae CN', 'User', 'mcp.json'),
      ide: joinPath(appData, 'Trae', 'User', 'mcp.json'),
    };
  }

  if (platform === 'darwin') {
    const applicationSupport = join(home, 'Library', 'Application Support');
    return {
      'solo-cn': join(applicationSupport, 'TRAE SOLO CN', 'User', 'mcp.json'),
      solo: join(applicationSupport, 'TRAE SOLO', 'User', 'mcp.json'),
      'ide-cn': join(applicationSupport, 'Trae CN', 'User', 'mcp.json'),
      ide: join(applicationSupport, 'Trae', 'User', 'mcp.json'),
    };
  }

  const configHome = process.env.XDG_CONFIG_HOME ?? join(home, '.config');
  return {
    'solo-cn': join(configHome, 'TRAE SOLO CN', 'User', 'mcp.json'),
    solo: join(configHome, 'TRAE SOLO', 'User', 'mcp.json'),
    'ide-cn': join(configHome, 'Trae CN', 'User', 'mcp.json'),
    ide: join(configHome, 'Trae', 'User', 'mcp.json'),
  };
}

export function resolveConfigPath(
  host,
  {
    traeProduct,
    platform = process.platform,
    home = homedir(),
    appData = process.env.APPDATA,
  } = {},
) {
  if (host === 'workbuddy') {
    return join(home, '.workbuddy', 'mcp.json');
  }

  if (host !== 'trae') {
    throw new Error(`Unsupported OAuth host: ${host}`);
  }

  const candidates = traeConfigCandidates({ platform, home, appData });
  if (traeProduct) {
    if (!TRAE_PRODUCTS.has(traeProduct)) {
      throw new Error(
        `Unsupported TRAE product: ${traeProduct}. Expected solo-cn, solo, ide-cn, or ide.`,
      );
    }
    return candidates[traeProduct];
  }

  const existing = Object.entries(candidates).filter(([, candidate]) =>
    existsSync(dirname(candidate)),
  );
  if (existing.length === 1) {
    return existing[0][1];
  }
  if (existing.length === 0) {
    throw new Error(
      'No TRAE user data directory was found. Pass --trae-product solo-cn|solo|ide-cn|ide.',
    );
  }
  throw new Error(
    `Multiple TRAE products were found (${existing.map(([product]) => product).join(', ')}). ` +
      'Pass --trae-product solo-cn|solo|ide-cn|ide.',
  );
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const body = await response.text();
  let json;
  try {
    json = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(`Non-JSON response (${response.status}) from ${url}.`);
  }
  if (!response.ok) {
    const oauthError =
      typeof json.error_description === 'string'
        ? json.error_description
        : typeof json.error === 'string'
          ? json.error
          : 'request failed';
    throw new Error(`Request failed (${response.status}) for ${url}: ${oauthError}`);
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
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope: 'mcp:tools',
    }),
  });
}

export function buildAuthorizeUrl({
  issuer,
  clientId,
  challenge,
  redirectUri,
  mcpUrl,
  state,
}) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    redirect_uri: redirectUri,
    scope: 'mcp:tools',
    state,
    resource: mcpUrl,
  });
  return `${issuer}/oauth2/authorize?${params.toString()}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function renderOAuthResultPage({ success, title, message }) {
  const accent = success ? '#7c5cff' : '#ef4444';
  const icon = success ? '&#10003;' : '!';
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; color: #f8fafc; background: radial-gradient(circle at top, #292344 0, #11111a 48%, #09090f 100%); }
      main { width: min(100%, 480px); padding: 40px; text-align: center; border: 1px solid rgba(255,255,255,.1); border-radius: 24px; background: rgba(19,19,29,.88); box-shadow: 0 24px 80px rgba(0,0,0,.42); backdrop-filter: blur(20px); }
      .mark { width: 64px; height: 64px; margin: 0 auto 24px; display: grid; place-items: center; border-radius: 20px; color: white; font-size: 32px; font-weight: 700; background: ${accent}; box-shadow: 0 12px 36px color-mix(in srgb, ${accent} 45%, transparent); }
      .brand { margin: 0 0 12px; color: #a99bff; font-size: 13px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
      h1 { margin: 0; font-size: 28px; line-height: 1.2; }
      p { margin: 16px 0 0; color: #b8b8c7; font-size: 15px; line-height: 1.65; }
    </style>
  </head>
  <body>
    <main>
      <div class="mark">${icon}</div>
      <div class="brand">StarCut</div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
    </main>
  </body>
</html>`;
}

function sendHtml(response, status, page) {
  if (response.destroyed || response.writableEnded) return Promise.resolve();
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    Connection: 'close',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
    'Content-Type': 'text/html; charset=utf-8',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  });
  return new Promise((resolveResponse) => response.end(page, resolveResponse));
}

function statesMatch(actual, expected) {
  if (!actual) return false;
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return (
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
  );
}

export async function startAuthorizationCallback({
  expectedState,
  timeoutMs = 180_000,
}) {
  let resolveAuthorization;
  let rejectAuthorization;
  let settled = false;
  let timeout;
  let closePromise;

  const authorization = new Promise((resolvePromise, rejectPromise) => {
    resolveAuthorization = resolvePromise;
    rejectAuthorization = rejectPromise;
  });
  authorization.catch(() => {});

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (request.method !== 'GET' || url.pathname !== '/callback') {
      void sendHtml(
        response,
        404,
        renderOAuthResultPage({
          success: false,
          title: 'Page not found',
          message: 'Return to the StarCut authorization page and try again.',
        }),
      );
      return;
    }

    if (settled) {
      void sendHtml(
        response,
        409,
        renderOAuthResultPage({
          success: false,
          title: 'Authorization already handled',
          message: 'This authorization request has already been completed.',
        }),
      );
      return;
    }

    const state = url.searchParams.get('state');
    if (!statesMatch(state, expectedState)) {
      settled = true;
      clearTimeout(timeout);
      void sendHtml(
        response,
        400,
        renderOAuthResultPage({
          success: false,
          title: 'Authorization rejected',
          message: 'The callback state did not match. Restart authorization from the plugin installer.',
        }),
      ).finally(() => void close());
      rejectAuthorization(new Error('OAuth callback state mismatch.'));
      return;
    }

    const oauthError = url.searchParams.get('error');
    if (oauthError) {
      const description =
        url.searchParams.get('error_description') ?? 'Authorization was not granted.';
      settled = true;
      clearTimeout(timeout);
      void sendHtml(
        response,
        400,
        renderOAuthResultPage({
          success: false,
          title: 'Authorization cancelled',
          message: description,
        }),
      ).finally(() => void close());
      rejectAuthorization(new Error(`OAuth authorization failed: ${oauthError}.`));
      return;
    }

    const code = url.searchParams.get('code');
    if (!code) {
      void sendHtml(
        response,
        400,
        renderOAuthResultPage({
          success: false,
          title: 'Authorization incomplete',
          message: 'The callback did not include an authorization code. Return to StarCut and try again.',
        }),
      );
      return;
    }

    settled = true;
    clearTimeout(timeout);
    resolveAuthorization({
      code,
      async succeed() {
        await sendHtml(
          response,
          200,
          renderOAuthResultPage({
            success: true,
            title: 'StarCut is connected',
            message: 'Authorization, configuration, and MCP verification all succeeded. You can close this tab.',
          }),
        );
        await close();
      },
      async fail() {
        await sendHtml(
          response,
          500,
          renderOAuthResultPage({
            success: false,
            title: 'Setup could not finish',
            message: 'Authorization was received, but local setup failed. Return to the installer for the exact error.',
          }),
        );
        await close();
      },
    });
  });

  function close() {
    clearTimeout(timeout);
    if (closePromise) return closePromise;
    closePromise = new Promise((resolveClose) => {
      if (!server.listening) {
        resolveClose();
        return;
      }
      server.close(() => resolveClose());
      // The callback server serves exactly one short-lived browser response.
      // Once that response has been flushed, no connection is useful anymore;
      // close it explicitly instead of making the host wait for Node's idle
      // socket timeout before reporting that authorization completed.
      server.closeAllConnections?.();
    });
    return closePromise;
  }

  await new Promise((resolveListening, rejectListening) => {
    const handleError = (error) => rejectListening(error);
    server.once('error', handleError);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', handleError);
      resolveListening();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    await close();
    throw new Error('Could not resolve the OAuth callback address.');
  }

  server.on('error', (error) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    rejectAuthorization(error);
    void close();
  });

  timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    rejectAuthorization(
      new Error(`Timed out waiting for OAuth callback on port ${address.port}.`),
    );
    void close();
  }, timeoutMs);
  timeout.unref?.();

  return {
    authorization,
    close,
    redirectUri: `http://127.0.0.1:${address.port}/callback`,
  };
}

function openBrowser(url) {
  const command =
    process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : process.platform === 'darwin'
        ? ['open', [url]]
        : ['xdg-open', [url]];
  const child = spawn(command[0], command[1], {
    detached: true,
    stdio: 'ignore',
  });
  child.once('error', () => {
    console.error(`The browser could not be opened. Open this URL manually:\n${url}`);
  });
  child.unref();
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
    throw new Error(`MCP initialize failed (${response.status}).`);
  }
}

export async function mergeMcpConfig(configPath, mcpUrl, accessToken) {
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
  const temporaryPath = `${configPath}.${process.pid}.${base64Url(randomBytes(8))}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    await rename(temporaryPath, configPath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
  if (process.platform !== 'win32') {
    await chmod(configPath, 0o600);
  }
  return configPath;
}

async function main() {
  const host = readOption('--host');
  const mcpUrl =
    readOption('--mcp-url') ??
    (process.env.NODE_ENV === 'production'
      ? 'https://api.starcut.io/mcp'
      : 'http://localhost:2330/mcp');
  const configPathOption = readOption('--config-path');
  const traeProduct = readOption('--trae-product');

  if (!host || !HOSTS.has(host)) {
    throw new Error(
      'Usage: node mcp-manual-oauth.mjs --host workbuddy|trae --write-config ' +
        '[--mcp-url URL] [--trae-product solo-cn|solo|ide-cn|ide] [--config-path PATH]',
    );
  }
  if (!hasFlag('--write-config')) {
    throw new Error('--write-config is required because OAuth tokens are never printed.');
  }
  if (configPathOption && !isAbsolute(configPathOption)) {
    throw new Error('--config-path must be an absolute path.');
  }
  if (host !== 'trae' && traeProduct) {
    throw new Error('--trae-product is only valid with --host trae.');
  }

  const configPath =
    configPathOption ??
    resolveConfigPath(host, {
      traeProduct,
    });
  const issuer = issuerFromMcpUrl(mcpUrl);
  const { verifier, challenge } = createPkcePair();
  const state = base64Url(randomBytes(32));
  const callback = await startAuthorizationCallback({ expectedState: state });
  let callbackResult;

  try {
    console.log(`Registering OAuth client at ${issuer}/oauth2/register ...`);
    const registration = await registerClient(issuer, host, callback.redirectUri);
    const clientId = registration.client_id;
    if (!clientId) {
      throw new Error('OAuth client registration did not return a client_id.');
    }

    const authorizeUrl = buildAuthorizeUrl({
      issuer,
      clientId,
      challenge,
      redirectUri: callback.redirectUri,
      mcpUrl,
      state,
    });

    console.log(`OAuth callback is ready on ${callback.redirectUri}.`);
    openBrowser(authorizeUrl);
    console.log('Opened StarCut authorization. Complete the browser prompt to continue.');

    callbackResult = await callback.authorization;
    console.log('Authorization received. Finishing secure local setup ...');

    try {
      const tokens = await exchangeCode({
        issuer,
        code: callbackResult.code,
        redirectUri: callback.redirectUri,
        clientId,
        verifier,
        mcpUrl,
      });
      if (!tokens.access_token) {
        throw new Error('The token endpoint did not return an access token.');
      }

      await verifyInitialize(mcpUrl, tokens.access_token);
      await mergeMcpConfig(configPath, mcpUrl, tokens.access_token);
      await callbackResult.succeed();

      console.log('OAuth succeeded and MCP initialize was verified.');
      console.log(`WROTE_MCP_CONFIG=${configPath}`);
    } catch (error) {
      await callbackResult.fail();
      throw error;
    }
  } finally {
    await callback.close();
  }
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
