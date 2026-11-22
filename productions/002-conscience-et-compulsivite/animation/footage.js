// Récupère les plans de nature sur Pexels (licence Pexels : usage libre, sans attribution obligatoire),
// les étalonne et les découpe en images JPEG pour animation.html.
// Usage : PEXELS_API_KEY=... node footage.js
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const KEY = process.env.PEXELS_API_KEY;
if (!KEY) { console.log("Pas de PEXELS_API_KEY : rendu sans plans de nature."); process.exit(0); }
const ROOT = path.join(__dirname, "footage");
const FPS = 30;

// Une scène = un plan. start/end en secondes dans la vidéo finale (marge incluse pour les fondus).
const SCENES = [
  { id: "oiseaux", start: 5.8, end: 15.8, queries: ["starling murmuration", "flock of birds sky", "birds flying sunset"] },
  { id: "tourbillon", start: 15.0, end: 24.8, queries: ["water whirlpool", "swirling water", "water vortex"] },
  { id: "vagues", start: 23.8, end: 32.2, queries: ["stormy sea waves", "rough ocean waves", "crashing waves"] },
  { id: "brume", start: 43.0, end: 49.6, queries: ["misty lake sunrise", "fog lake morning", "sunrise mist forest"] },
  { id: "lac", start: 48.2, end: 57.4, queries: ["calm lake reflection", "still water reflection mountains", "forest sunlight rays"] },
  { id: "ocean", start: 56.3, end: 69.0, queries: ["ocean horizon sunrise", "calm sea sunrise", "sea horizon golden hour"] },
];

async function search(q) {
  const u = `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&orientation=portrait&per_page=20`;
  const r = await fetch(u, { headers: { Authorization: KEY } });
  if (!r.ok) throw new Error(`Pexels ${r.status} pour « ${q} »`);
  return (await r.json()).videos || [];
}

function pickFile(v) {
  return (v.video_files || [])
    .filter(f => f.file_type === "video/mp4" && f.height > f.width && f.height >= 1280)
    .sort((a, b) => Math.abs(a.height - 1920) - Math.abs(b.height - 1920))[0];
}

(async () => {
  fs.mkdirSync(ROOT, { recursive: true });
  const used = new Set(), manifest = [];
  for (const s of SCENES) {
    const need = s.end - s.start;
    let chosen = null;
    for (const q of s.queries) {
      const vids = await search(q);
      // plans assez longs d'abord, puis les autres (bouclés)
      const ranked = vids.filter(v => !used.has(v.id) && pickFile(v)).sort((a, b) => (b.duration >= need) - (a.duration >= need));
      if (ranked.length) { chosen = { v: ranked[0], q }; break; }
    }
    if (!chosen) { console.log(`Aucun plan pour ${s.id}, scène laissée en motion design.`); continue; }
    const { v, q } = chosen; used.add(v.id);
    const f = pickFile(v);
    const src = path.join(ROOT, `${s.id}-source.mp4`);
    const buf = Buffer.from(await (await fetch(f.link)).arrayBuffer());
    fs.writeFileSync(src, buf);
    const dir = path.join(ROOT, s.id);
    fs.mkdirSync(dir, { recursive: true });
    // recadrage 9:16, léger panoramique vertical lent, étalonnage doux (désaturé, ombres bleutées)
    const vf = [
      "scale=1188:2112:force_original_aspect_ratio=increase", "crop=1188:2112",
      `crop=1080:1920:x='(in_w-out_w)/2+sin(t/5)*18':y='(in_h-out_h)*(0.15+0.7*t/${need.toFixed(2)})'`,
      `fps=${FPS}`, "eq=brightness=-0.05:contrast=1.04:saturation=0.82",
      "colorbalance=bs=0.08:gs=0.02:rs=-0.04:bm=0.03:rh=0.05:gh=0.02",
    ].join(",");
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-stream_loop", "-1", "-i", src, "-t", need.toFixed(2), "-vf", vf, "-q:v", "3", path.join(dir, "%05d.jpg")]);
    const frames = fs.readdirSync(dir).filter(n => n.endsWith(".jpg")).length;
    manifest.push({ id: s.id, start: s.start, end: s.end, frames });
    console.log(`${s.id} : vidéo Pexels ${v.id} (${v.user.name}), ${frames} images`);
    s.credit = { scene: s.id, requete: q, pexels_id: v.id, url: v.url, auteur: v.user.name, auteur_url: v.user.url, licence: "Pexels License (https://www.pexels.com/license/)" };
  }
  fs.writeFileSync(path.join(ROOT, "manifest.json"), JSON.stringify(manifest, null, 2));
  fs.mkdirSync(path.join(__dirname, "..", "export"), { recursive: true });
  fs.writeFileSync(path.join(__dirname, "..", "export", "credits-pexels.json"), JSON.stringify(SCENES.filter(s => s.credit).map(s => s.credit), null, 2));
})().catch(e => { console.error(e); process.exit(1); });
