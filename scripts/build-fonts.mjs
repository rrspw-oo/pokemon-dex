import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "src/assets/fonts");
const CACHE_DIR = resolve(ROOT, "node_modules/.cache/fonts");

const SOURCES = {
  cubic: "https://raw.githubusercontent.com/ACh-K/Cubic-11/main/fonts/web/Cubic_11.woff2",
  pressStart: "https://raw.githubusercontent.com/google/fonts/main/ofl/pressstart2p/PressStart2P-Regular.ttf",
};

async function download(url) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const file = join(CACHE_DIR, url.split("/").pop());
  if (!existsSync(file)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed: ${url}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return readFileSync(file);
}

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "assets" ? [] : sourceFiles(path);
    return /\.(jsx?|json)$/.test(name) ? [path] : [];
  });
}

const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("");

async function main() {
  const text = sourceFiles(resolve(ROOT, "src"))
    .map((f) => readFileSync(f, "utf8"))
    .join("");
  const nonAscii = [...new Set(Array.from(text).filter((ch) => ch.charCodeAt(0) > 126))].join("");

  mkdirSync(OUT_DIR, { recursive: true });

  const cubic = await subsetFont(await download(SOURCES.cubic), ascii + nonAscii, { targetFormat: "woff2" });
  writeFileSync(join(OUT_DIR, "Cubic11-subset.woff2"), cubic);

  const pressStart = await subsetFont(await download(SOURCES.pressStart), ascii + "é", { targetFormat: "woff2" });
  writeFileSync(join(OUT_DIR, "PressStart2P-subset.woff2"), pressStart);

  console.log(`glyphs ${ascii.length + nonAscii.length}, Cubic11 ${cubic.length} bytes, PressStart2P ${pressStart.length} bytes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
