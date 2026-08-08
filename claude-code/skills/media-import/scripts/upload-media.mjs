#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { open, stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { Transform } from 'node:stream';

const MAX_FILES = 4;
const CONTROL_RETRIES = 3;
const PROGRESS_PING_MS = 8_000;
const UPLOAD_CONCURRENCY = 4;

const CONTENT_TYPES = {
  '.aac': 'audio/aac',
  '.avi': 'video/x-msvideo',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.flac': 'audio/flac',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.m4a': 'audio/mp4',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.ogg': 'audio/ogg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx':
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function usage() {
  process.stderr.write(
    'Usage: node upload-media.mjs --token <token> --endpoint <url> <file> [file...]\n',
  );
}

function parseArgs(argv) {
  const result = {
    endpoint: '',
    files: [],
    token: '',
  };
  for (let index = 0; index < argv.length;) {
    const argument = argv[index];
    if (argument === '--token' || argument === '--endpoint') {
      const value = argv[index + 1];
      if (!value) throw new Error(`${argument} requires a value`);
      if (argument === '--token') result.token = value;
      else result.endpoint = value;
      index += 2;
      continue;
    }
    if (argument === '--help' || argument === '-h') {
      usage();
      process.exit(0);
    }
    if (argument.startsWith('--')) {
      throw new Error(`Unknown option: ${argument}`);
    }
    result.files.push(argument);
    index += 1;
  }
  if (!result.token || !result.endpoint || result.files.length === 0) {
    usage();
    throw new Error('token, endpoint, and at least one file are required');
  }
  if (result.files.length > MAX_FILES) {
    throw new Error(`One import session accepts at most ${MAX_FILES} files`);
  }
  return result;
}

class Pool {
  constructor(limit) {
    this.limit = limit;
    this.active = 0;
    this.waiting = [];
  }

  async run(operation) {
    if (this.active >= this.limit) {
      await new Promise((resolve) => this.waiting.push(resolve));
    }
    this.active += 1;
    try {
      return await operation();
    } finally {
      this.active -= 1;
      this.waiting.shift()?.();
    }
  }
}

async function sha256(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

async function postJson(endpoint, token, body) {
  let lastError;
  for (let attempt = 1; attempt <= CONTROL_RETRIES; attempt += 1) {
    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      lastError = error;
      if (attempt === CONTROL_RETRIES) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      continue;
    }

    const text = await response.text();
    if (response.ok) return text ? JSON.parse(text) : {};
    const error = new Error(
      `Import endpoint returned ${response.status}: ${text.slice(0, 1_000)}`,
    );
    if (response.status < 500 || attempt === CONTROL_RETRIES) throw error;
    lastError = error;
    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }
  throw lastError;
}

function progressReporter(endpoint, token, artifactId, total) {
  let loaded = 0;
  let chain = Promise.resolve();
  const send = () => {
    const progress = Math.min(100, Math.floor((loaded / total) * 100));
    chain = chain.then(() =>
      postJson(endpoint, token, {
        action: 'progress',
        artifactId,
        progress,
      }),
    ).catch((error) => {
      process.stderr.write(
        `[starcut-upload] progress ping failed: ${error.message}\n`,
      );
    });
  };
  const timer = setInterval(send, PROGRESS_PING_MS);
  return {
    add(bytes) {
      loaded += bytes;
    },
    async finish() {
      clearInterval(timer);
      loaded = total;
      send();
      await chain;
    },
    stop() {
      clearInterval(timer);
    },
  };
}

async function putStream(url, path, contentType, size, reporter, pool) {
  await pool.run(async () => {
    const stream = createReadStream(path);
    const progress = new Transform({
      transform(chunk, _encoding, callback) {
        reporter.add(chunk.length);
        callback(null, chunk);
      },
    });
    let response;
    try {
      response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Length': String(size),
          'Content-Type': contentType,
        },
        body: stream.pipe(progress),
        duplex: 'half',
      });
    } catch (error) {
      throw new Error(
        `Object upload request failed: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
    if (!response.ok) {
      throw new Error(`Object upload failed: ${response.status}`);
    }
  });
}

async function putParts(plan, path, contentType, size, reporter, pool) {
  const handle = await open(path, 'r');
  try {
    return await Promise.all(plan.partUrls.map((url, index) =>
      pool.run(async () => {
        const start = index * plan.partSize;
        const length = Math.min(plan.partSize, size - start);
        const buffer = Buffer.allocUnsafe(length);
        const { bytesRead } = await handle.read(buffer, 0, length, start);
        if (bytesRead !== length) {
          throw new Error(`Could not read multipart part ${index + 1}`);
        }
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Length': String(length),
            'Content-Type': contentType,
          },
          body: buffer,
        });
        if (!response.ok) {
          throw new Error(
            `Multipart upload part ${index + 1} failed: ${response.status}`,
          );
        }
        const etag = response.headers.get('etag');
        if (!etag) {
          throw new Error(`Multipart upload part ${index + 1} has no ETag`);
        }
        reporter.add(length);
        return { partNumber: index + 1, etag };
      }),
    ));
  } finally {
    await handle.close();
  }
}

async function importFile(path, options, pool) {
  const file = await stat(path);
  if (!file.isFile() || file.size <= 0) {
    throw new Error(`Not a non-empty file: ${path}`);
  }
  const filename = basename(path);
  const contentType = CONTENT_TYPES[extname(filename).toLowerCase()];
  if (!contentType) {
    throw new Error(`Unsupported file extension: ${filename}`);
  }
  const artifactId = randomUUID();
  const hash = await sha256(path);
  let prepareRequested = false;
  try {
    prepareRequested = true;
    const prepared = await postJson(options.endpoint, options.token, {
      action: 'prepare',
      artifactId,
      filename,
      contentType,
      hash,
      size: file.size,
    });
    if (prepared.exists) {
      return {
        artifactId,
        path: prepared.artifact.path,
        status: 'ready',
        transfer: 'deduplicated',
      };
    }

    const reporter = progressReporter(
      options.endpoint,
      options.token,
      artifactId,
      file.size,
    );
    try {
      let parts = [];
      if ('partUrls' in prepared) {
        parts = await putParts(
            prepared,
            path,
            contentType,
            file.size,
            reporter,
            pool,
          );
      } else {
        await putStream(
          prepared.presignedUrl,
          path,
          contentType,
          file.size,
          reporter,
          pool,
        );
      }
      await reporter.finish();
      const artifact = await postJson(options.endpoint, options.token, {
        action: 'complete',
        artifactId,
        contentType,
        key: prepared.key,
        uploadId: prepared.uploadId ?? '',
        parts,
        hash,
        size: file.size,
      });
      return {
        artifactId,
        path: artifact.path,
        status: artifact.status,
        transfer: 'uploaded',
      };
    } catch (error) {
      reporter.stop();
      throw error;
    }
  } catch (error) {
    if (prepareRequested) {
      await postJson(options.endpoint, options.token, {
        action: 'fail',
        artifactId,
        code: 'upload_failed',
        message: error instanceof Error ? error.message : String(error),
      }).catch(() => {});
    }
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const pool = new Pool(UPLOAD_CONCURRENCY);
  const imports = await Promise.all(
    options.files.map((path) => importFile(path, options, pool)),
  );
  process.stdout.write(`${JSON.stringify({ imports }, null, 2)}\n`);
}

main().catch((error) => {
  const cause = error instanceof Error && error.cause instanceof Error
    ? ` (${error.cause.message})`
    : '';
  process.stderr.write(
    `[starcut-upload] ${error instanceof Error ? error.message : String(error)}${cause}\n`,
  );
  process.exitCode = 1;
});
