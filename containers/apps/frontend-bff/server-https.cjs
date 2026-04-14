const https = require('node:https');
const fs = require('node:fs');
const next = require('next');

const port = Number(process.env.PORT ?? 3443);
const hostname = process.env.HOSTNAME ?? '0.0.0.0';

const tlsCertPath = process.env.TLS_CERT_PATH;
const tlsKeyPath = process.env.TLS_KEY_PATH;

if (!tlsCertPath || !tlsKeyPath) {
  throw new Error('TLS_CERT_PATH と TLS_KEY_PATH は必須です');
}

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
