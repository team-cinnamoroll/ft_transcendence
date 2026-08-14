const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function parsePort(value, fallback) {
  if (!value) return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535 (got: ${value})`);
  }
  return port;
}

const port = parsePort(process.env.PORT, 3443);
const hostname = process.env.HOSTNAME || '0.0.0.0';
const tlsCertPath = requireEnv('TLS_CERT_PATH');
const tlsKeyPath = requireEnv('TLS_KEY_PATH');

// standalone出力が自動生成する server.js と同じ処理。これをしないと next() は
// next.config.ts をファイルシステムから探しに行くが、standalone出力にはソースファイルが
// 含まれないため見つからず、bodySizeLimit などの設定が全てデフォルト値にフォールバックしてしまう。
const requiredServerFiles = JSON.parse(
  fs.readFileSync(path.join(__dirname, '.next', 'required-server-files.json'), 'utf8')
);
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(requiredServerFiles.config);

const next = require('next');

const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = https.createServer(
      {
        key: fs.readFileSync(tlsKeyPath),
        cert: fs.readFileSync(tlsCertPath),
      },
      (req, res) => handle(req, res)
    );

    server.listen(port, hostname, () => {
      console.warn(`Listening on https://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
