#!/usr/bin/env node
/**
 * Metrology Research Platform — Terminal Presentation
 * Run: npx tsx scripts/metrology-presentation.ts
 * Or: node --loader ts-node/esm scripts/metrology-presentation.ts
 */

import * as readline from "readline";

// ─── ANSI Palette ──────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  blink: "\x1b[5m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
  clear: "\x1b[2J\x1b[H",
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",
};

// ─── Config ────────────────────────────────────────────────────────
const TYPING_DELAY_MS = 12;
const SLIDE_AUTOADVANCE_MS = 0; // 0 = manual; set to e.g. 8000 for kiosk mode
const WIDTH = 78;

// ─── Utils ─────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function center(text: string, w = WIDTH): string {
  const pad = Math.max(0, Math.floor((w - text.length) / 2));
  return " ".repeat(pad) + text;
}

function boxLine(text: string, color = C.cyan): string {
  const inner = text.length > WIDTH - 4 ? text.slice(0, WIDTH - 7) + "..." : text;
  const pad = WIDTH - 4 - inner.length;
  return `${color}│${C.reset} ${inner}${" ".repeat(pad)} ${color}│${C.reset}`;
}

function boxTop(color = C.cyan) {
  return `${color}┌${"─".repeat(WIDTH - 2)}┐${C.reset}`;
}
function boxBottom(color = C.cyan) {
  return `${color}└${"─".repeat(WIDTH - 2)}┘${C.reset}`;
}

function hr(color = C.dim) {
  return color + "─".repeat(WIDTH) + C.reset;
}

function header(title: string) {
  const line = `═══ ${title.toUpperCase()} `;
  return C.bold + C.blue + line + "═".repeat(Math.max(0, WIDTH - line.length)) + C.reset;
}

async function typeWrite(text: string, delay = TYPING_DELAY_MS) {
  for (const ch of text) {
    process.stdout.write(ch);
    await sleep(delay);
  }
}

function waitForEnter(): Promise<void> {
  return new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    const handler = (_str: string, key: readline.Key) => {
      if (key.name === "return" || key.name === "space" || key.name === "right" || key.name === "down") {
        cleanup();
        res();
      }
      if (key.name === "q" || (key.ctrl && key.name === "c")) {
        cleanup();
        process.stdout.write(C.showCursor);
        process.exit(0);
      }
    };

    const cleanup = () => {
      process.stdin.removeListener("keypress", handler);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      rl.close();
    };

    process.stdin.on("keypress", handler);
  });
}

// ─── Slides ────────────────────────────────────────────────────────
interface Slide {
  render(): string[];
}

const slides: Slide[] = [
  // ── Slide 0: Title ─────────────────────────────────────────────
  {
    render: () => [
      "",
      C.cyan +
        center("    __  ___      __  ____                  __           ") +
        C.reset,
      C.cyan +
        center("   /  |/  /___ _/ /_/ __ \___  ____  _____/ /_____  _____") +
        C.reset,
      C.cyan +
        center("  / /|_/ / __ `/ __/ /_/ / _ \/ __ \/ ___/ //_/ _ \/ ___/") +
        C.reset,
      C.cyan +
        center(" / /  / / /_/ / /_/ _, _/  __/ /_/ / /__/ ,< /  __/ /    ") +
        C.reset,
      C.cyan +
        center("/_/  /_/\__,_/\__/_/ |_|\___/ .___/\___/_/|_|\___/_/     ") +
        C.reset,
      C.cyan +
        center("                           /_/                           ") +
        C.reset,
      "",
      center(`${C.bold}${C.white}METROLOGY RESEARCH PLATFORM${C.reset}`),
      center(`${C.dim}Version 3.1.0  •  Metrology 4.0 Architecture${C.reset}`),
      "",
      center(`${C.yellow}▸ ${C.reset}Digital Calibration Certificates  ${C.yellow}▸ ${C.reset}AI Predictive Metrology`),
      center(`${C.yellow}▸ ${C.reset}Real-Time Uncertainty Engine      ${C.yellow}▸ ${C.reset}Blockchain Traceability`),
      center(`${C.yellow}▸ ${C.reset}Upstream Manufacturing Decision Support`),
      center(`${C.yellow}▸ ${C.reset}Digital Twins  •  Cloud Ecosystems  •  Machine-Actionable Data`),
      "",
      center(`${C.dim}Press [Enter] or [Space] to begin  •  [Q] to quit${C.reset}`),
      "",
    ],
  },

  // ── Slide 1: The Shift ─────────────────────────────────────────
  {
    render: () => [
      "",
      header("The 2026 Shift"),
      "",
      boxTop(C.yellow),
      boxLine(`${C.bold}From:${C.reset} Laboratory Testing Marketplace`, C.yellow),
      boxLine(`${C.bold}To:${C.reset}   Calibration-Grade Measurement Ecosystem`, C.yellow),
      boxBottom(C.yellow),
      "",
      `  ${C.bold}${C.cyan}Legacy Gaps → 2026 Responses${C.reset}`,
      "",
      `  ${C.red}✗${C.reset}  PDF-only reports                ${C.green}→${C.reset}  ISO 17025:2025 DCC (XML + digital signature)`,
      `  ${C.red}✗${C.reset}  Fixed annual calibration        ${C.green}→${C.reset}  AI drift prediction (LSTM / XGBoost)`,
      `  ${C.red}✗${C.reset}  Static GUM spreadsheets         ${C.green}→${C.reset}  Real-time Monte-Carlo uncertainty`,
      `  ${C.red}✗${C.reset}  Manual env data entry           ${C.green}→${C.reset}  IoT MQTT/OPC-UA auto-ingestion`,
      `  ${C.red}✗${C.reset}  Email-based ILC round-robins    ${C.green}→${C.reset}  Automated PT enrollment + z-scores`,
      `  ${C.red}✗${C.reset}  Classical NIST traceability     ${C.green}→${C.reset}  Quantum-ready + blockchain anchors`,
      `  ${C.red}✗${C.reset}  End-of-line pass/fail only      ${C.green}→${C.reset}  Real-time upstream decision support + closed-loop control`,
      `  ${C.red}✗${C.reset}  Document-centric human reports  ${C.green}→${C.reset}  Machine-actionable JSON-LD + AAS submodels`,
      `  ${C.red}✗${C.reset}  Siloed on-prem islands          ${C.green}→${C.reset}  Cloud-native MaaS + edge-cloud federation`,
      `  ${C.red}✗${C.reset}  Ad-hoc logs, no tamper evidence ${C.green}→${C.reset}  ALCOA+ audit trails + cryptographic integrity`,
      `  ${C.red}✗${C.reset}  Standard HTTPS only             ${C.green}→${C.reset}  Zero-trust defense-in-depth + SIEM/SOAR`,
      `  ${C.red}✗${C.reset}  Lab-only or field-only silos    ${C.green}→${C.reset}  Unified hybrid delivery: centralized + on-site`,
      `  ${C.red}✗${C.reset}  CMM + calipers only             ${C.green}→${C.reset}  X-ray CT volumetry + SEM/AFM nanoscale + AI`,
      "",
      center(`${C.dim}Slide 1 / 14${C.reset}`),
      "",
    ],
  },

  // ── Slide 2: Metrology 4.0 Paradigm ────────────────────────────
  {
    render: () => [
      "",
      header("Metrology 4.0 — The Paradigm Shift"),
      "",
      boxTop(C.magenta),
      boxLine(`${C.bold}From:${C.reset} Document-centric, human-readable inspection`, C.magenta),
      boxLine(`${C.bold}To:${C.reset}   Autonomous, machine-actionable measurement loops`, C.magenta),
      boxBottom(C.magenta),
      "",
      `  ${C.bold}${C.cyan}Three Pillars${C.reset}`,
      "",
      `  ${C.yellow}①${C.reset}  ${C.bold}Digital Twins${C.reset}`,
      `       Living virtual replicas: geometry + behavior + uncertainty + prediction`,
      `       Synced via PTP-aligned OPC-UA; queryable via GraphQL / Omniverse`,
      "",
      `  ${C.yellow}②${C.reset}  ${C.bold}Cloud Ecosystems${C.reset}`,
      `       Multi-tenant MaaS + private cloud + edge-cloud federation`,
      `       CRDT sync for conflict-free measurement histories`,
      "",
      `  ${C.yellow}③${C.reset}  ${C.bold}Machine-Actionable Data${C.reset}`,
      `       JSON-LD + RDF semantic annotations; AAS submodels; SPARQL graphs`,
      `       Self-describing data that machines interpret without human reading`,
      "",
      center(`${C.dim}Slide 2 / 14${C.reset}`),
      "",
    ],
  },

  // ── Slide 3: Data Integrity & Cybersecurity ───────────────────
  {
    render: () => [
      "",
      header("Data Integrity & Cybersecurity"),
      "",
      `  ${C.bold}${C.cyan}ALCOA+ Compliant  •  Zero-Trust  •  Defense-in-Depth${C.reset}`,
      "",
      `  ${C.yellow}①${C.reset}  ${C.bold}Attributable${C.reset}   Every action tagged with user, session, IP, device`,
      `  ${C.yellow}②${C.reset}  ${C.bold}Legible${C.reset}      JSON-LD semantic records; human + machine readable`,
      `  ${C.yellow}③${C.reset}  ${C.bold}Contemporaneous${C.reset}  PTP/GNSS trusted timestamps; no backdating`,
      `  ${C.yellow}④${C.reset}  ${C.bold}Original${C.reset}     Raw sensor payloads in immutable WORM / IPFS`,
      `  ${C.yellow}⑤${C.reset}  ${C.bold}Accurate${C.reset}     AI anomaly detection + validation rules + review`,
      "",
      boxTop(C.red),
      boxLine(`${C.bold}Security Layers:${C.reset}`, C.red),
      boxLine(`Perimeter   WAF / DDoS / Geo-fencing`, C.red),
      boxLine(`Network     Micro-segmentation • OT-IT Purdue gateway`, C.red),
      boxLine(`Identity    SPIFFE/SPIRE • Zero-trust • JIT elevation`, C.red),
      boxLine(`Data        AES-256-GCM (rest) • TLS 1.3 (transit) • Confidential Computing`, C.red),
      boxLine(`Monitoring  SIEM/SOAR • MITRE ATT&CK • Auto-response < 5 min`, C.red),
      boxBottom(C.red),
      "",
      `  ${C.dim}Standards: CFR 21 Part 11  •  EU Annex 11  •  IEC 62443-3-3  •  NIST CSF L3${C.reset}`,
      "",
      center(`${C.dim}Slide 3 / 14${C.reset}`),
      "",
    ],
  },

  // ── Slide 4: Advanced Metrology — CT & Nanotechnology ──────────
  {
    render: () => [
      "",
      header("Advanced Metrology — CT & Nano"),
      "",
      `  ${C.bold}${C.cyan}Non-Destructive 3D  •  Nanoscale Precision  •  AI Defect Detection${C.reset}`,
      "",
      `  ${C.yellow}▸${C.reset}  ${C.bold}X-ray CT${C.reset}          GPU FDK/SART reconstruction  •  Internal geometry`,
      `  ${C.yellow}▸${C.reset}  ${C.bold}Porosity Analysis${C.reset}   AI-classified voids/cracks  •  3D defect mapping`,
      `  ${C.yellow}▸${C.reset}  ${C.bold}SEM / AFM${C.reset}         Particle metrology  •  Surface roughness ISO 25178`,
      `  ${C.yellow}▸${C.reset}  ${C.bold}Nanoindenter${C.reset}      Hardness / modulus / creep per ASTM E2903`,
      "",
      boxTop(C.magenta),
      boxLine(`${C.bold}AI Analysis Pipeline${C.reset}`, C.magenta),
      boxLine(`CT Sinogram   → GPU Reconstructor → 3D CNN Defects → Porosity Map`, C.magenta),
      boxLine(`SEM Image     → U-Net Segmentation → Particle Catalog → Material Class`, C.magenta),
      boxLine(`AFM Scan      → Surface Profiler   → ISO 25178 Roughness → Tip-Wear Correct`, C.magenta),
      boxBottom(C.magenta),
      "",
      `  ${C.dim}Standards: VDI/VDE 2630  •  ISO 15530  •  ASTM E2903  •  ISO 25178${C.reset}`,
      "",
      center(`${C.dim}Slide 4 / 14${C.reset}`),
      "",
    ],
  },

  // ── Slide 5: Hybrid Delivery — Lab + Field Services ────────────
  {
    render: () => [
      "",
      header("Hybrid Delivery — Lab + Field"),
      "",
      `  ${C.bold}${C.cyan}Unified Scheduling  •  AI Dispatch  •  Offline-First Mobile${C.reset}`,
      "",
      `  ${C.green}◉${C.reset}  Centralized lab analysis  —  primary standards, highest precision`,
      `  ${C.green}◉${C.reset}  On-site field services    —  portable kit, < 4 hr response`,
      `  ${C.green}◉${C.reset}  AI dispatch engine        —  skill match + route opt + equipment check`,
      `  ${C.green}◉${C.reset}  Mobile field app          —  offline CRDT sync, GPS, digital sign`,
      `  ${C.green}◉${C.reset}  Unified hybrid DCC        —  Section A (field) + Section B (lab)`,
      "",
      boxTop(C.green),
      boxLine(`${C.bold}Field App Capabilities:${C.reset}`, C.green),
      boxLine(`• Full SOP cache + calibration procedures offline`, C.green),
      boxLine(`• Bluetooth T/RH/pressure auto-compensation`, C.green),
      boxLine(`• QR sample custody: pickup → handoff → lab receipt`, C.green),
      boxLine(`• Biometric + PKI digital signature on field DCC`, C.green),
      boxBottom(C.green),
      "",
      `  ${C.dim}Impact: NPS +65  •  Utilization 85 %  •  Emergency < 4 hr  •  Transport damage < 0.2 %${C.reset}`,
      "",
      center(`${C.dim}Slide 5 / 14${C.reset}`),
      "",
    ],
  },

  // ── Slide 6: Upstream Manufacturing Decision Support ──────────
  {
    render: () => [
      "",
      header("Upstream Manufacturing Integration"),
      "",
      `  ${C.bold}${C.cyan}From EOL Gatekeeper → Real-Time Process Partner${C.reset}`,
      "",
      `  ${C.green}◉${C.reset}  MES/SCADA bidirectional sync  —  SAP ME, Opcenter, Ignition`,
      `  ${C.green}◉${C.reset}  Inline metrology: CMM probe, machine vision, laser, NDT`,
      `  ${C.green}◉${C.reset}  Real-time SPC engine  —  Western Electric + Nelson rules`,
      `  ${C.green}◉${C.reset}  Closed-loop control  —  CNC offset updated < 100 ms`,
      `  ${C.green}◉${C.reset}  Digital thread per serial number: lot → machine → cert`,
      "",
      boxTop(C.yellow),
      boxLine(`${C.bold}Closed-Loop Flow:${C.reset}`, C.yellow),
      boxLine(`1. Inline sensor measures part on-machine`, C.yellow),
      boxLine(`2. Edge gateway normalizes + timestamps (PTP)`, C.yellow),
      boxLine(`3. SPC engine detects trend-to-OOT in < 50 ms`, C.yellow),
      boxLine(`4. MRP issues correction command to CNC macro`, C.yellow),
      boxLine(`5. Next part manufactured to adjusted nominal`, C.yellow),
      boxBottom(C.yellow),
      "",
      `  ${C.dim}Business Impact: Scrap ↓ 90 %  •  Rework ↓ < 0.5 %  •  FPY ↑ > 99 %${C.reset}`,
      "",
      center(`${C.dim}Slide 6 / 14${C.reset}`),
      "",
    ],
  },

  // ── Slide 6: Digital Calibration Certificates ──────────────────
  {
    render: () => [
      "",
      header("Digital Calibration Certificates"),
      "",
      `  ${C.bold}${C.cyan}ISO/IEC 17025:2025 Compliant DCC${C.reset}`,
      "",
      `  ${C.yellow}◆${C.reset}  XML schema validated against ISO official XSD`,
      `  ${C.yellow}◆${C.reset}  Digital signatures: eIDAS qualified / SM2 (CN)`,
      `  ${C.yellow}◆${C.reset}  QR-code instant verification  (< 200 ms)`,
      `  ${C.yellow}◆${C.reset}  PDF fallback mirrors DCC exactly`,
      `  ${C.yellow}◆${C.reset}  Batch audit export: 10 000 certs / ZIP in < 60 s`,
      "",
      boxTop(C.green),
      boxLine(`${C.bold}Customer Journey:${C.reset}`, C.green),
      boxLine(`1. Test completes → auto-generate DCC XML`, C.green),
      boxLine(`2. HSM signs certificate + stores SHA-256 hash`, C.green),
      boxLine(`3. Blockchain notary anchors hash to L2`, C.green),
      boxLine(`4. Customer scans QR → verifies signature + chain`, C.green),
      boxBottom(C.green),
      "",
      center(`${C.dim}Slide 2 / 14${C.reset}`),
      "",
    ],
  },

  // ── Slide 4: AI & Predictive Metrology ─────────────────────────
  {
    render: () => [
      "",
      header("AI & Predictive Metrology"),
      "",
      `  ${C.bold}${C.cyan}From Scheduled → Predictive Calibration${C.reset}`,
      "",
      `  ${C.yellow}▸${C.reset}  ${C.bold}Drift Prediction${C.reset}        LSTM ensemble  •  MAPE < 5 %`,
      `  ${C.yellow}▸${C.reset}  ${C.bold}Dynamic Intervals${C.reset}       Reduce over-calibration ≥ 15 %`,
      `  ${C.yellow}▸${C.reset}  ${C.bold}Anomaly Detection${C.reset}       Real-time > 3σ flagging`,
      `  ${C.yellow}▸${C.reset}  ${C.bold}Uncertainty Assistant${C.reset}   GPT-4o + RAG on SOPs / GUM`,
      "",
      boxTop(C.magenta),
      boxLine(`Model Inputs:`, C.magenta),
      boxLine(`  • Historical drift vectors per equipment family`, C.magenta),
      boxLine(`  • Environmental stress (T, RH, vibration)`, C.magenta),
      boxLine(`  • Usage intensity & operator skill index`, C.magenta),
      boxLine(`  • Last adjustment magnitude & reference standard stability`, C.magenta),
      boxBottom(C.magenta),
      "",
      center(`${C.dim}Slide 7 / 14${C.reset}`),
      "",
    ],
  },

  // ── Slide 5: Real-Time Uncertainty Engine ──────────────────────
  {
    render: () => [
      "",
      header("Real-Time Uncertainty Engine"),
      "",
      `  ${C.bold}${C.cyan}GUM + Monte Carlo in the Browser${C.reset}`,
      "",
      `  ${C.green}✓${C.reset}  Type A / B budget builder  —  drag-and-drop contributors`,
      `  ${C.green}✓${C.reset}  Sensitivity coefficients auto-calculated from model`,
      `  ${C.green}✓${C.reset}  Monte Carlo: 10⁶ trials in < 2 s  (GPU accelerated)`,
      `  ${C.green}✓${C.reset}  Environmental auto-contribution from IoT feeds`,
      `  ${C.green}✓${C.reset}  Interactive PDF + coverage interval histogram`,
      "",
      boxTop(C.cyan),
      boxLine(`Example Budget Breakdown`, C.cyan),
      boxLine(`  Repeatability (Type A)      u = 0.0012  ν = 9`, C.cyan),
      boxLine(`  Resolution (Type B, rect)   u = 0.00029  ν = ∞`, C.cyan),
      boxLine(`  Temp coefficient (Type B)   u = 0.0008   ν = 50`, C.cyan),
      boxLine(`  ─────────────────────────────────────────────`, C.cyan),
      boxLine(`  Combined uc                 u = 0.00153`, C.cyan),
      boxLine(`  Expanded U (k=2)            U = 0.00306  (95.4 %)`, C.cyan),
      boxBottom(C.cyan),
      "",
      center(`${C.dim}Slide 8 / 14${C.reset}`),
      "",
    ],
  },

  // ── Slide 6: Blockchain Traceability ───────────────────────────
  {
    render: () => [
      "",
      header("Blockchain Notary & Traceability"),
      "",
      `  ${C.bold}${C.cyan}Immutable Calibration Provenance${C.reset}`,
      "",
      `  ${C.yellow}⛓${C.reset}  Anchor DCC SHA-256 to Ethereum L2  (Base / Polygon)`,
      `  ${C.yellow}⛓${C.reset}  Tx finality < 5 min  •  Cost < $0.01 per certificate`,
      `  ${C.yellow}⛓${C.reset}  W3C Verifiable Credentials (JSON-LD) for portability`,
      `  ${C.yellow}⛓${C.reset}  Revocation registry updated on-chain within 1 hr`,
      "",
      boxTop(C.yellow),
      boxLine(`Post-Quantum Cryptography (PQC) Ready`, C.yellow),
      boxLine(`Hybrid signatures: ECDSA + CRYSTALS-Dilithium`, C.yellow),
      boxLine(`Future-proof against NIST PQC standards 2025-2026`, C.yellow),
      boxBottom(C.yellow),
      "",
      `  ${C.dim}This ensures non-repudiation for 10+ year audit windows.${C.reset}`,
      "",
      center(`${C.dim}Slide 9 / 14${C.reset}`),
      "",
    ],
  },

  // ── Slide 7: IoT Sensor Mesh ───────────────────────────────────
  {
    render: () => [
      "",
      header("IoT Sensor Mesh & Edge Metrology"),
      "",
      `  ${C.bold}${C.cyan}The Lab is Everywhere${C.reset}`,
      "",
      `  ${C.green}◉${C.reset}  OPC-UA & MQTT ingestion  —  1 000 sensors / lab`,
      `  ${C.green}◉${C.reset}  Sub-second telemetry latency via Redis Streams`,
      `  ${C.green}◉${C.reset}  Edge uncertainty on Raspberry Pi 5 (ONNX Runtime)`,
      `  ${C.green}◉${C.reset}  Environmental alarm cascade: excursion → auto-pause`,
      "",
      boxTop(C.blue),
      boxLine(`Sensor Types Supported`, C.blue),
      boxLine(`  • Temperature (Pt100, thermocouple, RTD)`, C.blue),
      boxLine(`  • Humidity (capacitive, chilled-mirror)`, C.blue),
      boxLine(`  • Vibration / acceleration (MEMS, piezo)`, C.blue),
      boxLine(`  • Pressure (absolute, differential, vacuum)`, C.blue),
      boxLine(`  • Electrical (DC/AC, resistance, capacitance)`, C.blue),
      boxBottom(C.blue),
      "",
      center(`${C.dim}Slide 10 / 14${C.reset}`),
      "",
    ],
  },

  // ── Slide 8: Compliance Architecture ───────────────────────────
  {
    render: () => [
      "",
      header("Compliance & Security Architecture"),
      "",
      `  ${C.bold}${C.cyan}Zero-Trust for Measurement Data${C.reset}`,
      "",
      `  ${C.yellow}🔒${C.reset}  mTLS between all internal microservices`,
      `  ${C.yellow}🔒${C.reset}  HSM-backed signing keys (FIPS 140-3 Level 3)`,
      `  ${C.yellow}🔒${C.reset}  Field-level AES-256-GCM encryption for customer data`,
      `  ${C.yellow}🔒${C.reset}  Append-only audit logs in Parquet + blockchain anchor`,
      "",
      boxTop(C.red),
      boxLine(`Standards Matrix`, C.red),
      boxLine(`ISO/IEC 17025:2025    DCC, audit trail, ILC automation`, C.red),
      boxLine(`ILAC P14              Uncertainty budgets per certificate`, C.red),
      boxLine(`NIST HB 143           State weights & measures API flags`, C.red),
      boxLine(`IEC 62443-3-3         OT cybersecurity / network segmentation`, C.red),
      boxLine(`GDPR / PIPL           Row-level policies + data residency`, C.red),
      boxBottom(C.red),
      "",
      center(`${C.dim}Slide 11 / 14${C.reset}`),
      "",
    ],
  },

  // ── Slide 9: Roadmap ───────────────────────────────────────────
  {
    render: () => [
      "",
      header("2026 Delivery Roadmap"),
      "",
      `  ${C.bold}Q2 2026${C.reset}  ${C.green}▓▓▓▓▓▓▓▓░░${C.reset}  Digital Calibration Certificates (DCC) MVP`,
      `  ${C.bold}Q2${C.reset}       ${C.green}▓▓▓▓▓▓▓▓░░${C.reset}  Data Integrity & Cybersecurity`,
      `  ${C.bold}Q2${C.reset}       ${C.green}▓▓▓▓▓▓▓▓░░${C.reset}  Upstream MFG Decision Support`,
      `  ${C.bold}Q2-Q3${C.reset}    ${C.green}▓▓▓▓▓▓▓░░░${C.reset}  Hybrid Delivery — Lab + Field`,
      `  ${C.bold}Q3-Q4${C.reset}    ${C.yellow}▓▓▓▓▓░░░░░${C.reset}  Advanced Metrology — CT & Nano`,
      `  ${C.bold}Q2-Q4${C.reset}    ${C.green}▓▓▓▓▓▓▓░░░${C.reset}  Metrology 4.0 Platform (Twins, Cloud, Semantic)`,
      `  ${C.bold}Q2-Q3${C.reset}    ${C.green}▓▓▓▓▓▓▓░░░${C.reset}  AI Drift Prediction v1`,
      `  ${C.bold}Q3${C.reset}       ${C.yellow}▓▓▓▓▓░░░░░${C.reset}  Real-Time Uncertainty Engine`,
      `  ${C.bold}Q3${C.reset}       ${C.yellow}▓▓▓▓▓░░░░░${C.reset}  Blockchain Notary Integration`,
      `  ${C.bold}Q3-Q4${C.reset}    ${C.yellow}▓▓▓░░░░░░░${C.reset}  IoT Sensor Mesh & Edge Compute`,
      `  ${C.bold}Q4${C.reset}       ${C.yellow}▓▓▓░░░░░░░${C.reset}  ILC / Proficiency Test Automation`,
      `  ${C.bold}Q1 2027${C.reset}  ${C.dim}░░░░░░░░░░${C.reset}  Sustainability & Green Metrology`,
      "",
      boxTop(C.green),
      boxLine(`2026 KPI Targets`, C.green),
      boxLine(`Certificate turnaround   < 24 h   (baseline: 5 days)`, C.green),
      boxLine(`Dynamic intervals        85 %     (baseline: 0 %)`, C.green),
      boxLine(`On-chain verification    30 %     (baseline: 0 %)`, C.green),
      boxLine(`Platform uptime                99.99 %   (baseline: 99.9 %)`, C.green),
      boxLine(`First-pass yield (FPY)         > 99 %    (baseline: 94 %)`, C.green),
      boxLine(`Scrap cost avoidance           > $1M/yr  (baseline: $0)`, C.green),
      boxLine(`Machine-actionable data ratio  100 %     (baseline: 0 %)`, C.green),
      boxLine(`Digital twin coverage          100 %     (baseline: 0 %)`, C.green),
      boxLine(`Audit trail completeness       100 %     (baseline: 60 %)`, C.green),
      boxLine(`Security incident response     < 5 min   (baseline: 24 hr)`, C.green),
      boxLine(`Emergency response time        < 4 hr    (baseline: 48–72 hr)`, C.green),
      boxLine(`Customer NPS (hybrid)          +65       (baseline: +25)`, C.green),
      boxLine(`New revenue from advanced tech   > $2M/yr  (baseline: $0)`, C.green),
      boxLine(`Defect detection limit           > 1 µm    (baseline: > 50 µm)`, C.green),
      boxBottom(C.green),
      "",
      center(`${C.dim}Slide 12 / 14${C.reset}`),
      "",
    ],
  },

  // ── Slide 10: Closing ───────────────────────────────────────────
  {
    render: () => [
      "",
      C.cyan +
        center("    __  ___      __  ____                  __           ") +
        C.reset,
      C.cyan +
        center("   /  |/  /___ _/ /_/ __ \___  ____  _____/ /_____  _____") +
        C.reset,
      C.cyan +
        center("  / /|_/ / __ `/ __/ /_/ / _ \/ __ \/ ___/ //_/ _ \/ ___/") +
        C.reset,
      C.cyan +
        center(" / /  / / /_/ / /_/ _, _/  __/ /_/ / /__/ ,< /  __/ /    ") +
        C.reset,
      C.cyan +
        center("/_/  /_/\__,_/\__/_/ |_|\___/ .___/\___/_/|_|\___/_/     ") +
        C.reset,
      C.cyan +
        center("                           /_/                           ") +
        C.reset,
      "",
      center(`${C.bold}${C.white}Thank You${C.reset}`),
      "",
      center(`Metrology Research Platform  v3.1.0  •  Metrology 4.0 Ready`),
      center(`Architecture Documentation:  docs/METROLOGY_PLATFORM_OVERVIEW.md`),
      center(`Roadmap:                     docs/METROLOGY_2026_ROADMAP.md`),
      "",
      center(`${C.dim}Senior Systems Architect & Metrology Specialist  •  2026${C.reset}`),
      "",
      center(`${C.yellow}Press [Q] or [Ctrl+C] to exit${C.reset}`),
      "",
    ],
  },
];

// ─── Engine ────────────────────────────────────────────────────────
async function runPresentation() {
  process.stdout.write(C.hideCursor);

  let idx = 0;
  while (idx < slides.length) {
    process.stdout.write(C.clear);
    const lines = slides[idx].render();
    const content = lines.join("\n");
    await typeWrite(content, TYPING_DELAY_MS);

    if (SLIDE_AUTOADVANCE_MS > 0 && idx < slides.length - 1) {
      await sleep(SLIDE_AUTOADVANCE_MS);
      idx++;
    } else {
      await waitForEnter();
      idx++;
    }
  }

  process.stdout.write(C.showCursor);
  process.exit(0);
}

runPresentation().catch((err) => {
  process.stdout.write(C.showCursor);
  console.error(err);
  process.exit(1);
});
