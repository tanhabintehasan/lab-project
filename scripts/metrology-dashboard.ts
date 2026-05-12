#!/usr/bin/env node
/**
 * Metrology Research Platform — ASCII Dashboard
 * Run: npx tsx scripts/metrology-dashboard.ts
 */

import * as readline from "readline";

// ─── ANSI Palette ──────────────────────────────────────────────────
const R = "\x1b[0m";
const B = "\x1b[1m";
const D = "\x1b[2m";
const K = "\x1b[30m";
const RED = "\x1b[31m";
const GRN = "\x1b[32m";
const YEL = "\x1b[33m";
const BLU = "\x1b[34m";
const MAG = "\x1b[35m";
const CYN = "\x1b[36m";
const WHT = "\x1b[37m";
const BG_GRN = "\x1b[42m";
const BG_BLU = "\x1b[44m";
const BG_DIM = "\x1b[100m";
const CLR = "\x1b[2J\x1b[H";
const HID = "\x1b[?25l";
const SHW = "\x1b[?25h";

const W = 86;

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function center(t: string, w = W): string {
  const p = Math.max(0, Math.floor((w - t.length) / 2));
  return " ".repeat(p) + t;
}

function padR(t: string, w: number): string {
  return t.length >= w ? t.slice(0, w) : t + " ".repeat(w - t.length);
}

function now(): string {
  const d = new Date();
  return d.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function rand(min: number, max: number, dec = 0): string {
  const v = Math.random() * (max - min) + min;
  return v.toFixed(dec);
}

function spark(v: number): string {
  const bars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  const idx = Math.min(bars.length - 1, Math.floor(v * bars.length));
  return bars[idx];
}

function sparkline(len = 12): string {
  let out = "";
  for (let i = 0; i < len; i++) out += spark(Math.random());
  return out;
}

// ─── Dashboard Renderer ────────────────────────────────────────────
function draw() {
  const cpu = rand(18, 42, 0);
  const mem = rand(48, 74, 0);
  const net = rand(0.4, 2.8, 1);
  const uptime = "99.997";
  const alerts = Math.random() > 0.95 ? "1" : "0";
  const alertColor = alerts === "0" ? GRN : RED;
  const ts = now();

  const headerText = `${B}${WHT}METROLOGY RESEARCH PLATFORM${R}  v3.1.0    ${D}[Metrology 4.0]${R}    ${D}${ts}${R}`;
  const headerVisible = `METROLOGY RESEARCH PLATFORM  v3.1.0    [Metrology 4.0]    ${ts}`;
  const headerPad = Math.max(0, W - 4 - headerVisible.length);

  const lines: string[] = [
    CLR + HID,
    "",
    CYN + "╔" + "═".repeat(W - 2) + "╗" + R,
    CYN + "║  " + headerText + " ".repeat(headerPad) + "  ║" + R,
    CYN + "╠" + "═".repeat(W - 2) + "╣" + R,
    "",

    // Row 1
    `${CYN}  ┌─ ${B}${WHT}CORE SYSTEMS${R}${CYN} ─────────────┐  ┌─ ${B}${WHT}INTELLIGENCE LAYER${R}${CYN} ───────────────┐${R}`,
    `${CYN}  │${R}  ${GRN}${B}● ACTIVE${R}  DCC Engine          ${CYN}│  │${R}  ${GRN}${B}● ACTIVE${R}  AI Drift Predictor        ${CYN}│${R}`,
    `${CYN}  │${R}     Certs: ${YEL}12,847${R}  |  <24h TAT    ${CYN}│  │${R}     Models: ${YEL}47${R}   | MAPE: ${YEL}3.2%${R}    ${CYN}│${R}`,
    `${CYN}  │${R}     ${D}QR Verify: 8,921  | L2: 9,421${R}  ${CYN}│  │${R}     ${D}Retrains: 3/wk  | GPU: A100${R}  ${CYN}│${R}`,
    `${CYN}  │${R}  ${GRN}${B}● ACTIVE${R}  Uncertainty MC        ${CYN}│  │${R}  ${GRN}${B}● ACTIVE${R}  Anomaly Detector          ${CYN}│${R}`,
    `${CYN}  │${R}     Trials: ${YEL}1.0M/s${R} | GPU CUDA     ${CYN}│  │${R}     Flags: ${YEL}23${R}    | Latency: ${YEL}12ms${R} ${CYN}│${R}`,
    `${CYN}  │${R}     ${D}Coverage: k=2  | 95.4 % conf${R}  ${CYN}│  │${R}     ${D}Threshold: 3σ  | Auto-hold${R} ${CYN}│${R}`,
    `${CYN}  └────────────────────────────┘  └──────────────────────────────────────┘${R}`,
    "",

    // Row 2
    `${CYN}  ┌─ ${B}${WHT}TRUST & SECURITY${R}${CYN} ──────────┐  ┌─ ${B}${WHT}MANUFACTURING${R}${CYN} ─────────────────────┐${R}`,
    `${CYN}  │${R}  ${GRN}${B}● ACTIVE${R}  Blockchain Notary   ${CYN}│  │${R}  ${GRN}${B}● ACTIVE${R}  Upstream MFG            ${CYN}│${R}`,
    `${CYN}  │${R}     Anchors: ${YEL}9,421${R}  | L2 Base     ${CYN}│  │${R}     Loops: ${YEL}1,204${R}  | FPY: ${YEL}99.4%${R}    ${CYN}│${R}`,
    `${CYN}  │${R}     ${D}Tx finality: 4.2 min  | <$0.01${R} ${CYN}│  │${R}     ${D}Corrections: 892  | Scrap ↓90%${R}${CYN}│${R}`,
    `${CYN}  │${R}  ${GRN}${B}● ACTIVE${R}  Audit & Crypto      ${CYN}│  │${R}  ${GRN}${B}● ACTIVE${R}  SPC Engine              ${CYN}│${R}`,
    `${CYN}  │${R}     Entries: ${YEL}2.4M${R}   | HSM FIPS    ${CYN}│  │${R}     Charts: ${YEL}156${R}   | Rules: ${YEL}WE+Nel${R}  ${CYN}│${R}`,
    `${CYN}  │${R}     ${D}Chain verified: 100%  | ALCOA+${R}  ${CYN}│  │${R}     ${D}OOC events: 4  | OOT: 0${R}     ${CYN}│${R}`,
    `${CYN}  └────────────────────────────┘  └──────────────────────────────────────┘${R}`,
    "",

    // Row 3
    `${CYN}  ┌─ ${B}${WHT}METROLOGY 4.0${R}${CYN} ─────────────┐  ┌─ ${B}${WHT}HYBRID & FIELD${R}${CYN} ────────────────────┐${R}`,
    `${CYN}  │${R}  ${GRN}${B}● ACTIVE${R}  Digital Twins       ${CYN}│  │${R}  ${GRN}${B}● ACTIVE${R}  Field Dispatch          ${CYN}│${R}`,
    `${CYN}  │${R}     Twins: ${YEL}1,024${R}   | Sync: 1 Hz   ${CYN}│  │${R}     Techs: ${YEL}84${R}     | On-site: ${YEL}23${R}   ${CYN}│${R}`,
    `${CYN}  │${R}     ${D}Omniverse: Connected  | PTP sync${R} ${CYN}│  │${R}     ${D}Avg response: 2.3 hr  | GPS OK${R}${CYN}│${R}`,
    `${CYN}  │${R}  ${GRN}${B}● ACTIVE${R}  Semantic Mesh       ${CYN}│  │${R}  ${GRN}${B}● ACTIVE${R}  Lab Queue               ${CYN}│${R}`,
    `${CYN}  │${R}     Records: ${YEL}48K${R}    | SPARQL q/s   ${CYN}│  │${R}     Samples: ${YEL}412${R}   | TAT: ${YEL}18h${R}      ${CYN}│${R}`,
    `${CYN}  │${R}     ${D}AAS subs: 2,048  | JSON-LD${R}   ${CYN}│  │${R}     ${D}Hybrid certs: 56  | DCC sync${R} ${CYN}│${R}`,
    `${CYN}  └────────────────────────────┘  └──────────────────────────────────────┘${R}`,
    "",

    // Row 4
    `${CYN}  ┌─ ${B}${WHT}ADVANCED METROLOGY${R}${CYN} ────────┐  ┌─ ${B}${WHT}SYSTEM HEALTH${R}${CYN} ─────────────────────┐${R}`,
    `${CYN}  │${R}  ${GRN}${B}● ACTIVE${R}  CT Reconstructor    ${CYN}│  │${R}  CPU: ${YEL}${cpu}%${R}  ${sparkline()}        ${CYN}│${R}`,
    `${CYN}  │${R}     Volumes: ${YEL}156${R}    | GPU V100    ${CYN}│  │${R}  MEM: ${YEL}${mem}%${R}  ${sparkline()}        ${CYN}│${R}`,
    `${CYN}  │${R}     ${D}Recon rate: 2048³ / 8 min${R}    ${CYN}│  │${R}  NET: ${YEL}${net} Gbps${R}  ${sparkline()}      ${CYN}│${R}`,
    `${CYN}  │${R}  ${GRN}${B}● ACTIVE${R}  Nano Analyzer       ${CYN}│  │${R}  Uptime: ${GRN}${uptime}%${R}  | RTO: <30s       ${CYN}│${R}`,
    `${CYN}  │${R}     Scans: ${YEL}2,401${R}   | AFM/SEM/WLI ${CYN}│  │${R}  Alerts: ${alertColor}${B}${alerts}${R}      | Last Backup: 04:00 ${CYN}│${R}`,
    `${CYN}  │${R}     ${D}Defect F1: 0.96  | Particles: 12K${R}${CYN}│  │${R}  ${D}All systems nominal  | MRP-CTRL${R}    ${CYN}│${R}`,
    `${CYN}  └────────────────────────────┘  └──────────────────────────────────────┘${R}`,
    "",

    // Footer
    `${CYN}  ╚${"═".repeat(W - 2)}╝${R}`,
    "",
    center(`${D}Press [R] to refresh  |  [Q] to quit  |  MRP-DASHBOARD-2026${R}`),
    "",
  ];

  process.stdout.write(lines.join("\n"));
}

// ─── Main Loop ─────────────────────────────────────────────────────
async function run() {
  process.stdout.write(HID);
  let running = true;

  const refresh = () => {
    draw();
  };

  refresh();

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  process.stdin.on("keypress", (_str: string, key: readline.Key) => {
    if (key.name === "q" || (key.ctrl && key.name === "c")) {
      running = false;
      process.stdout.write(SHW + CLR);
      process.exit(0);
    }
    if (key.name === "r" || key.name === "return" || key.name === "space") {
      refresh();
    }
  });

  // Auto-refresh clock every 5 seconds without full redraw flicker
  while (running) {
    await sleep(5000);
    if (running) refresh();
  }
}

run().catch((err) => {
  process.stdout.write(SHW);
  console.error(err);
  process.exit(1);
});
