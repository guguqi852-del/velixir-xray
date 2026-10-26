// Runtime launcher: builds the Xray config from environment variables and
// runs the Xray binary. No credential is ever stored in this repo.
// Required env vars (set as secrets in the Velixir dashboard):
//   UUID    - VLESS client id
//   WS_PATH - WebSocket path, e.g. /tk-xxxxxx
//   PORT    - set by Velixir; the edge forwards HTTPS here, Xray answers it.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = parseInt(process.env.PORT, 10);
const UUID = process.env.UUID;
const WS_PATH = process.env.WS_PATH;

if (!PORT || !UUID || !WS_PATH) {
  console.error('missing required env: PORT, UUID, WS_PATH');
  process.exit(1);
}

const config = {
  log: { loglevel: 'warning' },
  inbounds: [
    {
      port: PORT,
      listen: '0.0.0.0',
      protocol: 'vless',
      settings: {
        clients: [{ id: UUID, level: 0 }],
        decryption: 'none'
      },
      streamSettings: {
        network: 'ws',
        wsSettings: { path: WS_PATH }
      }
    }
  ],
  outbounds: [{ protocol: 'freedom' }]
};

const configPath = path.join(__dirname, 'config.json');
fs.writeFileSync(configPath, JSON.stringify(config));

const xray = spawn(path.join(__dirname, 'xray-bin', 'xray'), ['run', '-c', configPath], {
  stdio: 'inherit'
});

xray.on('exit', (code, signal) => {
  console.error(`xray exited (code=${code}, signal=${signal})`);
  process.exit(code === null ? 1 : code);
});

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => xray.kill(sig));
}
