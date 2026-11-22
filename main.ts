import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

// THE WORLD TODAY — Sunday 22 November 2026 front page.
// Zero dependencies. Own PNG encoder + own 5x7 bitmap font.
// Output: ONLY MAKEFUN_OUTPUT_DIR/entry.png (fallback /output/entry.png).
// Deterministic: fixed text, fixed layout, zlib level 9, no timestamps.

const W = 1024;
const H = 1024;
const img = new Uint8Array(W * H * 3);
const BLACK: [number, number, number] = [17, 17, 17];
const WHITE: [number, number, number] = [255, 255, 255];
const PAPER: [number, number, number] = [252, 250, 244];
const RED: [number, number, number] = [178, 34, 34];
const BLUE: [number, number, number] = [18, 58, 110];
const GREY: [number, number, number] = [90, 90, 90];
const LGREY: [number, number, number] = [225, 222, 214];
const GOLD: [number, number, number] = [176, 132, 24];

function px(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = c[0]; img[i + 1] = c[1]; img[i + 2] = c[2];
}
function fill(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) px(xx, yy, c);
}
function hline(x: number, y: number, w: number, c: [number, number, number], t = 1): void { fill(x, y, w, t, c); }
function vline(x: number, y: number, h: number, c: [number, number, number], t = 1): void { fill(x, y, t, h, c); }
function box(x: number, y: number, w: number, h: number, c: [number, number, number], t = 2): void {
  hline(x, y, w, c, t); hline(x, y + h - t, w, c, t); vline(x, y, h, c, t); vline(x + w - t, y, h, c, t);
}

// ---- 5x7 bitmap font: 7 rows of 5 cells, '#' = ink ----
const F: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  a: ["00000", "00000", "01110", "00001", "01111", "10001", "01111"],
  b: ["10000", "10000", "11110", "10001", "10001", "10001", "11110"],
  c: ["00000", "00000", "01110", "10000", "10000", "10001", "01110"],
  d: ["00001", "00001", "01111", "10001", "10001", "10001", "01111"],
  e: ["00000", "00000", "01110", "10001", "11111", "10000", "01110"],
  f: ["00110", "01001", "01000", "11110", "01000", "01000", "01000"],
  g: ["00000", "01111", "10001", "10001", "01111", "00001", "01110"],
  h: ["10000", "10000", "11110", "10001", "10001", "10001", "10001"],
  i: ["00100", "00000", "01100", "00100", "00100", "00100", "01110"],
  j: ["00010", "00000", "00110", "00010", "00010", "10010", "01100"],
  k: ["10000", "10000", "10010", "10100", "11000", "10100", "10010"],
  l: ["01100", "00100", "00100", "00100", "00100", "00100", "01110"],
  m: ["00000", "00000", "11010", "10101", "10101", "10101", "10101"],
  n: ["00000", "00000", "11110", "10001", "10001", "10001", "10001"],
  o: ["00000", "00000", "01110", "10001", "10001", "10001", "01110"],
  p: ["00000", "00000", "11110", "10001", "11110", "10000", "10000"],
  q: ["00000", "00000", "01111", "10001", "01111", "00001", "00001"],
  r: ["00000", "00000", "10110", "11001", "10000", "10000", "10000"],
  s: ["00000", "00000", "01111", "10000", "01110", "00001", "11110"],
  t: ["01000", "01000", "11100", "01000", "01000", "01010", "00100"],
  u: ["00000", "00000", "10001", "10001", "10001", "10011", "01101"],
  v: ["00000", "00000", "10001", "10001", "10001", "01010", "00100"],
  w: ["00000", "00000", "10001", "10101", "10101", "10101", "01010"],
  x: ["00000", "00000", "10001", "01010", "00100", "01010", "10001"],
  y: ["00000", "00000", "10001", "10001", "01111", "00001", "01110"],
  z: ["00000", "00000", "11111", "00010", "00100", "01000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  "$": ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
};

function charW(s: number): number { return 6 * s; }
function textW(t: string, s: number): number { return t.length * charW(s) - s; }
function drawChar(ch: string, x: number, y: number, s: number, c: [number, number, number]): void {
  const g = F[ch] ?? F["?"];
  for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) {
    if (g[r][col] === "1") fill(x + col * s, y + r * s, s, s, c);
  }
}
function drawText(t: string, x: number, y: number, s: number, c: [number, number, number]): void {
  for (let i = 0; i < t.length; i++) drawChar(t[i], x + i * charW(s), y, s, c);
}
function drawCentered(t: string, cx: number, y: number, s: number, c: [number, number, number]): void {
  drawText(t, cx - Math.floor(textW(t, s) / 2), y, s, c);
}
function wrap(t: string, maxW: number, s: number): string[] {
  const words = t.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (textW(test, s) <= maxW) cur = test;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}
function para(t: string, x: number, y: number, maxW: number, s: number, c: [number, number, number], lh?: number): number {
  const lines = wrap(t, maxW, s);
  const step = lh ?? Math.floor(7 * s * 1.55);
  lines.forEach((ln, i) => drawText(ln, x, y + i * step, s, c));
  return y + lines.length * step;
}

// ---- CRC32 + PNG ----
const CRC_T = new Uint32Array(256);
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC_T[n] = c >>> 0; }
function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(img.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- PAGE ----
fill(0, 0, W, H, PAPER);
box(14, 14, W - 28, H - 28, BLACK, 3);

// Masthead
drawCentered("THE WORLD TODAY", 512, 34, 7, BLACK);
drawCentered("SUNDAY, 22 NOVEMBER 2026  -  WORLD NEWS IN ONE PAGE  -  SIX STORIES THAT MATTER", 512, 96, 2, RED);
hline(28, 124, 968, BLACK, 3);
hline(28, 130, 968, BLACK, 1);

// Kicker + lead headline
drawText("LEAD - MIDDLE EAST", 28, 144, 2, RED);
let y = 168;
y = para("IRAN STRIKES US BASES", 28, y, 620, 4, BLACK, 38);
y = para("IN GULF AS TENSIONS SOAR", 28, y - 6, 620, 4, BLACK, 38);
y += 8;
y = para("Iran says its Revolutionary Guard hit two US Patriot radar sites and struck American assets in Bahrain and Kuwait. Bahrain reports an Iranian attack on a civilian industrial site, with a fire and damage but no casualties.", 28, y, 600, 2, BLACK);
y += 6;
drawText("Tehran: Hormuz can reopen on reasonable terms.", 28, y, 2, BLUE);

// Gulf graphic, right of lead
const gx = 660, gy = 144, gw = 336, gh = 252;
fill(gx, gy, gw, gh, WHITE);
box(gx, gy, gw, gh, BLUE, 2);
drawCentered("THE GULF, 22 NOV", 828, gy + 10, 2, BLUE);
hline(gx + 12, gy + 34, gw - 24, BLUE, 1);
drawText("IRAN", gx + 18, gy + 48, 2, RED);
drawText("fires missiles", gx + 90, gy + 48, 2, BLACK);
drawText("BAHRAIN", gx + 18, gy + 82, 2, BLACK);
drawText("industrial site hit", gx + 110, gy + 82, 2, BLACK);
drawText("KUWAIT", gx + 18, gy + 116, 2, BLACK);
drawText("US air base struck", gx + 110, gy + 116, 2, BLACK);
drawText("HORMUZ", gx + 18, gy + 150, 2, BLACK);
drawText("tanker hit a mine", gx + 110, gy + 150, 2, BLACK);
hline(gx + 12, gy + 182, gw - 24, LGREY, 1);
para("Patriot radars hit; Bahrain intercepts the rest.", gx + 18, gy + 192, gw - 36, 2, GREY);

hline(28, 412, 968, BLACK, 2);

// Middle row: EU-Indonesia | Israel
const my = 428;
drawText("TRADE - EUROPE", 28, my, 2, RED);
para("EU AND INDONESIA SIGN", 28, my + 26, 460, 3, BLACK, 28);
para("LANDMARK TRADE DEAL", 28, my + 54, 460, 3, BLACK, 28);
para("After ten years of talks, Brussels and Jakarta sign a deal scrapping 98.5 percent of tariffs. It is the EU's biggest pact with South-East Asia's largest economy.", 28, my + 92, 460, 2, BLACK);

vline(512, my, 190, LGREY, 2);
drawText("POLITICS - ISRAEL", 536, my, 2, RED);
para("EISENKOT TAPPED TO", 536, my + 26, 460, 3, BLACK, 28);
para("FORM NEXT GOVERNMENT", 536, my + 54, 460, 3, BLACK, 28);
para("President Herzog asks former army chief Gadi Eisenkot to try to form Israel's next government, bypassing Prime Minister Netanyahu. Eisenkot opens coalition talks with Likud.", 536, my + 92, 460, 2, BLACK);

hline(28, 632, 968, BLACK, 2);

// Bottom row: three columns
const by = 648;
const colW = 306;
// Peru
drawText("DISASTER - PERU", 28, by, 2, RED);
para("6.7 QUAKE HITS", 28, by + 26, colW, 3, BLACK, 28);
para("PERU'S ANDES", 28, by + 54, colW, 3, BLACK, 28);
para("A magnitude 6.7 earthquake shakes Peru's Andes. No damage or casualties are reported at once. A separate 4.1 quake strikes Myanmar.", 28, by + 92, colW, 2, BLACK);
// Markets (chart)
const mx = 359;
vline(mx - 12, by, 240, LGREY, 2);
drawText("MARKETS - STOCKS", mx, by, 2, RED);
para("CHIP STOCKS FALL", mx, by + 26, colW, 3, BLACK, 28);
para("BITCOIN 2-YR LOW", mx, by + 54, colW, 3, BLACK, 28);
// bar chart: three bars falling
const cx0 = mx, cy0 = by + 150, ch = 62;
fill(cx0, cy0 - 52, 52, 52, RED);
fill(cx0 + 72, cy0 - 38, 52, 38, RED);
fill(cx0 + 144, cy0 - 58, 52, 58, BLUE);
hline(cx0, cy0, 220, BLACK, 2);
drawText("CHIP -10%", cx0, cy0 + 8, 1, BLACK);
drawText("TSMC DOWN", cx0 + 66, cy0 + 8, 1, BLACK);
drawText("BTC LOW", cx0 + 146, cy0 + 8, 1, BLACK);
para("US stocks fall. Taiwan bans short sales from 23 Nov.", mx, by + 174, colW, 2, BLACK);
// Sport
const sx = 690;
vline(sx - 12, by, 240, LGREY, 2);
drawText("SPORT - TENNIS", sx, by, 2, RED);
para("ALCARAZ v ZVEREV", sx, by + 26, colW, 3, BLACK, 28);
para("ATP FINALS TITLE", sx, by + 54, colW, 3, BLACK, 28);
para("Carlos Alcaraz faces world No. 1 Alexander Zverev for the ATP Finals title after a comeback win over Ben Shelton.", sx, by + 92, colW, 2, BLACK);
drawText("France reach Nations final", sx, by + 92 + 108, 2, BLUE);
drawText("vs South Africa.", sx, by + 92 + 126, 2, BLUE);

// Briefs strip
hline(28, 898, 968, BLACK, 2);
drawText("IN BRIEF", 28, 906, 2, RED);
para("COP31 climate talks deadlocked over fossil fuels. UN talks on autonomous weapons fall short. Hong Kong Election Committee voting begins.", 28, 928, 968, 2, GREY);

// Footer
hline(28, 980, 968, BLACK, 1);
drawText("Sources: reports dated 22 November 2026. All stories checked against live news on the day. The World Today, Sunday 22 November 2026.", 28, 990, 1, GREY);

// ---- WRITE (output dir only, never the repo dir) ----
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(outDir + "/entry.png", encodePNG());
