// Rendu image par image de animation.html, puis encodage MP4 H.264 silencieux.
// Usage : node render.js [--out video.mp4] [--fps 30] [--workers 4] [--preview 3,16,30]
const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const FPS = +opt("fps", 30);
const WORKERS = +opt("workers", 4);
const OUT = path.resolve(opt("out", "conscience-et-compulsivite.mp4"));
const PREVIEW = opt("preview", null);
const ROOT = __dirname;
const FRAMES = path.resolve(opt("frames-dir", path.join(ROOT, "frames")));

const types = { ".html": "text/html", ".woff2": "font/woff2", ".js": "text/javascript", ".json": "application/json", ".jpg": "image/jpeg" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}/animation.html?render`;
  const browser = await chromium.launch();
  fs.mkdirSync(FRAMES, { recursive: true });

  const open = async () => {
    const page = await browser.newPage({ viewport: { width: 400, height: 700 } });
    await page.goto(url);
    await page.evaluate(() => window.ready);
    return page;
  };
  const grab = (page, t) => page.evaluate(async t => { await window.prepare(t); window.renderFrame(t); return document.getElementById("c").toDataURL("image/png"); }, t);
  const save = (file, data) => fs.writeFileSync(file, Buffer.from(data.split(",")[1], "base64"));

  if (PREVIEW) {
    const page = await open();
    for (const s of PREVIEW.split(",")) save(path.join(FRAMES, `preview-${s}.png`), await grab(page, +s));
    await browser.close(); server.close(); return;
  }

  const duration = await (await open()).evaluate(() => window.DURATION);
  const total = Math.round(duration * FPS);
  let next = 0, done = 0;
  const work = async () => {
    const page = await open();
    while (next < total) {
      const i = next++;
      save(path.join(FRAMES, String(i).padStart(5, "0") + ".png"), await grab(page, i / FPS));
      if (++done % 150 === 0) console.log(`${done}/${total} images`);
    }
  };
  await Promise.all(Array.from({ length: WORKERS }, work));
  await browser.close(); server.close();

  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(FRAMES, "%05d.png"),
    "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
    "-an", "-movflags", "+faststart", OUT], { stdio: "inherit" });
  console.log("MP4 :", OUT);
})().catch(e => { console.error(e); process.exit(1); });
