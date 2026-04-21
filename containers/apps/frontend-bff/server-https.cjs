const https = require('node:https');
const fs = require('node:fs');
const next = require('next');

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
