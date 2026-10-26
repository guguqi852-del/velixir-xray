// Build-time step (runs on `npm install`): fetch the Xray core binary and
// bake it into the release image. Nothing is downloaded at runtime, because
// Velixir free-plan disk is scratch space that disappears when the app sleeps.
const fs = require('fs');
const path = require('path');
const https = require('https');
const extract = require('extract-zip');

const ZIP_URL = 'https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip';
const DEST_DIR = path.join(__dirname, 'xray-bin');
const ZIP_PATH = path.join(__dirname, 'xray.zip');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'velixir-xray-install' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        download(res.headers.location, dest).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`download failed: HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      try { fs.unlinkSync(dest); } catch (_) {}
      reject(err);
    });
  });
}

(async () => {
  if (fs.existsSync(path.join(DEST_DIR, 'xray'))) {
    console.log('xray binary already present, skipping download');
    return;
  }
  console.log(`downloading ${ZIP_URL}`);
  await download(ZIP_URL, ZIP_PATH);
  fs.mkdirSync(DEST_DIR, { recursive: true });
  await extract(ZIP_PATH, { dir: DEST_DIR });
  fs.unlinkSync(ZIP_PATH);
  fs.chmodSync(path.join(DEST_DIR, 'xray'), 0o755);
  console.log('xray installed to xray-bin/');
})();
