const https = require('node:https');
const fs = require('node:fs');
const next = require('next');
const { z } = require('zod');

const EnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3443),
  HOSTNAME: z.string().min(1).default('0.0.0.0'),
  TLS_CERT_PATH: z.string().min(1),
  TLS_KEY_PATH: z.string().min(1),
});

const env = EnvSchema.parse({
  PORT: process.env.PORT,
  HOSTNAME: process.env.HOSTNAME,
  TLS_CERT_PATH: process.env.TLS_CERT_PATH,
  TLS_KEY_PATH: process.env.TLS_KEY_PATH,
});

const port = env.PORT;
const hostname = env.HOSTNAME;
const tlsCertPath = env.TLS_CERT_PATH;
const tlsKeyPath = env.TLS_KEY_PATH;

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
