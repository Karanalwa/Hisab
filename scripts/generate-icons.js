const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const svg = fs.readFileSync(path.join(__dirname, "../public/logo.svg"));

async function generate() {
  // 192x192
  await sharp(svg, { density: 192 })
    .resize(192, 192)
    .png()
    .toFile(path.join(__dirname, "../public/icon-192.png"));

  // 512x512
  await sharp(svg, { density: 512 })
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, "../public/icon-512.png"));

  // apple-touch-icon 180x180
  await sharp(svg, { density: 180 })
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, "../public/apple-touch-icon.png"));

  // maskable 512x512 with padding (safe zone is 40% of center)
  const base = await sharp(svg, { density: 512 }).resize(512, 512).png().toBuffer();
  await sharp(base)
    .extend({ top: 80, bottom: 80, left: 80, right: 80, background: { r: 14, g: 165, b: 233, alpha: 1 } })
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, "../public/icon-maskable-512.png"));

  console.log("Icons generated successfully!");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
