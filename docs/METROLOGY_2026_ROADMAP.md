# MRP 2026 Client Requirements & Delivery Roadmap

> **Program:** Metrology Research Platform (MRP)  
> **Planning Horizon:** Q2 2026 – Q1 2027  
> **Stakeholders:** Calibration Labs, National Metrology Institutes (NMIs), Industrial QA, Regulatory Bodies  

---

## 1. Strategic Pillars

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   DIGITAL    │  │   PREDICTIVE │  │   TRUSTED    │  │   CONNECTED  │
│   CERTS      │  │   METROLOGY  │  │   TRACEABILITY│  │   ECOSYSTEM  │
│   (DCC)      │  │   (AI/ML)    │  │   (Blockchain)│  │   (IoT/API)  │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│                    UPSTREAM MANUFACTURING                            │
│          Real-Time Decision Support • Closed-Loop Control            │
│          MES/SCADA Integration • SPC • Digital Thread                │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│                     METROLOGY 4.0 PILLARS                            │
│     Digital Twins • Cloud Ecosystems • Machine-Actionable Data       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Requirement Epics

### EPIC-1: Digital Calibration Certificates (DCC) — ISO 17025:2025
**Priority:** 🔴 Critical  
**Timeline:** Q2 2026  

| ID | Requirement | Acceptance Criteria | Owner |
|----|-------------|---------------------|-------|
| DCC-01 | Generate XML DCC per ISO 17025:2025 Annex A | Schema validates against ISO official XSD | Backend |
| DCC-02 | Digital signature with qualified eIDAS / SM2 | Signature verifies offline; hash in cert | Security |
| DCC-03 | QR code for instant verification | QR resolves to `/verify/{id}` in < 200 ms | Frontend |
| DCC-04 | Customer portal: download DCC, PDF fallback | Both formats available; PDF mirrors DCC exactly | Frontend |
| DCC-05 | Batch DCC export for audits | 10 000 certs ZIP in < 60 s | Backend |

### EPIC-2: Predictive Calibration & AI
**Priority:** 🔴 Critical  
**Timeline:** Q2–Q3 2026  

| ID | Requirement | Acceptance Criteria | Owner |
|----|-------------|---------------------|-------|
| AI-01 | Drift prediction model (LSTM) | MAPE < 5 % on historical drift data | Data Science |
| AI-02 | Dynamic interval optimization | Reduce over-calibration by ≥ 15 % | Data Science |
| AI-03 | Anomaly detection on incoming measurements | Flag outliers > 3σ in real time | Backend |
| AI-04 | Natural-language uncertainty assistant | User asks "Why is my uncertainty 0.3 %?"; GPT-4o + RAG answers from SOP | AI/Frontend |

### EPIC-3: Real-Time Uncertainty Engine
**Priority:** 🟠 High  
**Timeline:** Q3 2026  

| ID | Requirement | Acceptance Criteria | Owner |
|----|-------------|---------------------|-------|
| UE-01 | GUM Type A / B budget builder | Drag-and-drop contributors; auto-calculate combined uc | Frontend |
| UE-02 | Monte Carlo simulation (GUM Supp 1) | 10⁶ trials, M=1, results match GUM for linear models | Backend |
| UE-03 | Environmental auto-contribution | IoT temp/RH feeds into budget automatically | IoT |
| UE-04 | Coverage interval visualization | Histogram + PDF overlay in browser | Frontend |

### EPIC-4: Blockchain Notary & Verifiable Credentials
**Priority:** 🟠 High  
**Timeline:** Q3 2026  

| ID | Requirement | Acceptance Criteria | Owner |
|----|-------------|---------------------|-------|
| BC-01 | Anchor DCC hash to L2 (Polygon/Base/Arbitrum) | Tx finality < 5 min; cost < $0.01/cert | Blockchain |
| BC-02 | Verifiable Credential (W3C VC) issuance | JSON-LD VC validates with universal resolver | Backend |
| BC-03 | Revocation registry | Cal cert revoked → on-chain status updated < 1 hr | Blockchain |

### EPIC-5: IoT Sensor Mesh & Edge Metrology
**Priority:** 🟡 Medium  
**Timeline:** Q3–Q4 2026  

| ID | Requirement | Acceptance Criteria | Owner |
|----|-------------|---------------------|-------|
| IOT-01 | OPC-UA & MQTT ingestion | 1 000 sensors per lab; < 1 s latency | IoT |
| IOT-02 | Edge uncertainty computation | Raspberry Pi 5 runs MC on-device; syncs result | Edge |
| IOT-03 | Environmental alarm cascade | Temp excursion → pause active measurements + notify QA | Backend |

### EPIC-6: Inter-Laboratory Comparison (ILC/PT)
**Priority:** 🟡 Medium  **Timeline:** Q4 2026  

| ID | Requirement | Acceptance Criteria | Owner |
|----|-------------|---------------------|-------|
| ILC-01 | Automated PT enrollment | Lab selects scheme; MRP auto-assigns artefact ID | Backend |
| ILC-02 | En-number & z-score evaluation | ISO 13528 compliant; dashboard updates on submission | Backend |
| ILC-03 | Blind duplicate handling | MRP hides participant identity until close-out | Backend |

### EPIC-7: Sustainability & Green Metrology
**Priority:** 🟢 Future  **Timeline:** Q1 2027  

| ID | Requirement | Acceptance Criteria | Owner |
|----|-------------|---------------------|-------|
| GRN-01 | Per-test energy consumption estimate | Based on equipment power + duration; ±10 % accuracy | Backend |
| GRN-02 | Carbon offset integration | Optional offset purchase at checkout | Integrations |
| GRN-03 | Green-lab scorecard | Renewable energy %, waste recycling, digital-first certs | Reporting |

### EPIC-8: Data Integrity & High-Level Cybersecurity
**Priority:** 🔴 Critical  **Timeline:** Q2 2026  

| ID | Requirement | Acceptance Criteria | Owner |
|----|-------------|---------------------|-------|
| SEC-01 | ALCOA+ compliant audit trail engine | Every CRUD action generates tamper-evident entry; chain verified | Security |
| SEC-02 | HSM-backed signing for audit entries | FIPS 140-3 Level 3 HSM; signature verified offline | Security |
| SEC-03 | Trusted timestamping (PTP/GNSS/NMI) | All measurement timestamps ±1 ms; no backdating possible | Platform |
| SEC-04 | Zero-trust identity & micro-segmentation | SPIFFE workload IDs; OT-IT Purdue gateway; no lateral movement | Security |
| SEC-05 | Data encryption at rest + in transit + in use | AES-256-GCM (rest); TLS 1.3 (transit); Confidential Computing (use) | Security |
| SEC-06 | SIEM/SOAR integration with MITRE ATT&CK | Real-time anomaly detection; auto-response playbooks < 5 min | Security |
| SEC-07 | Integrity checkpoints & Merkle verification | Hourly Merkle-root checkpoints; scan anomaly report < 30 s | Backend |
| SEC-08 | CFR 21 Part 11 / Annex 11 evidence packs | Per-record ALCOA+ export; IQ/OQ/PQ documentation complete | Compliance |

### EPIC-9: Metrology 4.0 — Digital Twins, Cloud Ecosystems & Machine-Actionable Data
**Priority:** 🔴 Critical  **Timeline:** Q2–Q4 2026  

| ID | Requirement | Acceptance Criteria | Owner |
|----|-------------|---------------------|-------|
| M40-01 | Digital Twin platform integration | Every accredited asset has live twin; sync latency < 1 s | Digital Twin |
| M40-02 | AAS (Asset Administration Shell) submodel registry | IEC 63278 compliant; export AASX packages | Backend |
| M40-03 | JSON-LD semantic measurement records | All measurements emit @context, @type, qudt annotations; SPARQL queryable | Backend |
| M40-04 | RDF triple store + ontology management | QUDT + IOF + Metrology 4.0 ontologies loaded; inference < 500 ms | Data Science |
| M40-05 | Cloud MaaS multi-tenancy | 100+ tenants; row-level isolation; tenant onboarding < 10 min | Platform |
| M40-06 | Edge-Cloud federation with CRDT sync | Offline edge twins sync to cloud without conflict; RPO < 1 s | Edge |
| M40-07 | Autonomic measurement loops | Policy-guarded autonomous action: sense → semantify → decide → act → verify | AI/Backend |
| M40-08 | Machine-actionable DCC (MA-DCC) | Certificate consumable by CNC/MES without human parsing; ISO 17025:2025 + JSON-LD | Backend |

### EPIC-10: Hybrid Delivery — Centralized Lab + Field Services
**Priority:** 🟠 High  **Timeline:** Q2–Q3 2026  

| ID | Requirement | Acceptance Criteria | Owner |
|----|-------------|---------------------|-------|
| HYD-01 | Unified lab + field scheduling portal | Customer can request either mode; sees ETA and technician profile | Frontend |
| HYD-02 | AI dispatch engine | Skill match 100 %; route optimization reduces travel ≥ 20 % | AI/Backend |
| HYD-03 | Mobile field app (offline-first) | Full SOP cache; CRDT sync; works 8 hr without connectivity | Mobile |
| HYD-04 | Portable equipment manifest + checkout | Kit validation before dispatch; expired standard auto-blocked | Backend |
| HYD-05 | Sample custody chain with condition monitoring | Bluetooth T/RH logger; blockchain-anchored handoff QR scans | IoT |
| HYD-06 | Environmental compensation in field | Auto-apply temp/pressure corrections to portable measurement uncertainty | Backend |
| HYD-07 | Unified hybrid DCC (lab + field in one cert) | Single DCC with Section A (field) + Section B (lab); one QR verify | Backend |
| HYD-08 | Technician certification tracking | Expiry alerts 30 days before; auto-remove from dispatch pool | Compliance |

### EPIC-11: Advanced Metrology — CT Scanning & Nanotechnology
**Priority:** 🟠 High  **Timeline:** Q3–Q4 2026  

| ID | Requirement | Acceptance Criteria | Owner |
|----|-------------|---------------------|-------|
| ADV-01 | CT volumetric reconstruction pipeline | FDK + SART GPU reconstruction; 2048³ voxels in < 10 min | Backend |
| ADV-02 | AI defect classification (3D CNN) | > 95 % F1-score on pores, cracks, inclusions; < 5 min inference | AI |
| ADV-03 | Porosity analysis per VDI/VDE 2630 | Total porosity ±0.1 %; pore size distribution validated | Backend |
| ADV-04 | CAD comparison + GD&T on internal features | Deviation map ±1 voxel; GD&T report auto-generated | Backend |
| ADV-05 | SEM/AFM particle metrology | Automated segmentation; size/shape/aspect ratio catalog; > 98 % recall | AI |
| ADV-06 | Nanoindentation analysis (Oliver-Pharr) | H/E/creep per ASTM E2903; uncertainty budget auto-generated | Backend |
| ADV-07 | Surface roughness ISO 25178 | Sa, Sq, Sz, Sdr from AFM/WLI; filter compliance verified | Backend |
| ADV-08 | Volumetric digital twin | As-manufactured + as-inspected + predictive degradation model | Digital Twin |

### EPIC-12: Upstream Manufacturing Decision Support
**Priority:** 🔴 Critical  **Timeline:** Q2–Q3 2026  

| ID | Requirement | Acceptance Criteria | Owner |
|----|-------------|---------------------|-------|
| MFG-01 | MES bidirectional adapter (SAP ME / Opcenter / Custom) | Work order sync < 5 s; result upload acknowledged | Integrations |
| MFG-02 | OPC-UA / MQTT inline data ingestion | 500 machines / factory; p99 latency < 100 ms | IoT |
| MFG-03 | Real-time SPC engine (Western Electric + Nelson rules) | Rule violation detection < 50 ms per characteristic | Backend |
| MFG-04 | Closed-loop machine correction | CNC offset updated automatically; FPY improvement ≥ 3 pp | Manufacturing |
| MFG-05 | Digital thread per serial number | Full genealogy: material lot → machine → operator → measurement → certificate | Backend |
| MFG-06 | NDT integration (ultrasonic / eddy current / vision) | Defect classification confidence > 95 %; auto-sort routing | AI/IoT |
| MFG-07 | Predictive quality dashboard | Trend-to-OOT warning ≥ 30 min before out-of-tolerance | AI/Frontend |

---

## 3. Milestone Schedule

```
2026
Q2          Q3          Q4          Q1 2027
│           │           │           │
├─ DCC MVP ─┤           │           │
├─ AI Drift v1 ────────┤           │
│           ├─ Uncertainty Engine ─┤
│           ├─ Blockchain Notary ──┤
│           │           ├─ IoT Mesh ───────┤
│           ├─ Data Integrity & Security ──┤
│           ├─ Metrology 4.0 Platform ─────┤
│           ├─ Hybrid Delivery ────────────┤
│           │           ├─ Advanced Tech ──┤
│           ├─ Upstream MFG Decision ──────┤
│           │           ├─ ILC Automation ─┤
│           │           │           ├─ Sustainability ─┤
```

---

## 4. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| NMI rejection of DCC format | Medium | High | Early engagement with PTB/NIST pilots; schema pre-certification |
| AI model bias in drift prediction | Medium | High | Human-in-the-loop approval; override always available |
| Blockchain L2 discontinuation | Low | High | Multi-chain anchoring; abstract notary interface |
| IoT sensor security compromise | Medium | Critical | Network segmentation; mutual TLS; firmware signing |
| Regulatory change (ISO 17025 rev) | High | Medium | Modular certificate builder; config-driven clause mapping |
| MES vendor lock-in | Medium | High | Abstract adapter layer; no proprietary logic in core |
| Semantic interoperability failure | Medium | High | Adopt QUDT + IOF standards; avoid vendor-specific ontologies |
| Digital twin drift (virtual vs physical) | Medium | High | PTP time sync; kalman-filtered state estimation |
| Cloud tenancy isolation breach | Low | Critical | Prisma RLS + PostgreSQL row security policies + annual pen-test |
| Audit log tampering | Low | Critical | Chained-hash + HSM signature; append-only WORM storage |
| Trusted time source failure | Low | High | Multi-source PTP + GNSS + NMI clock; holdover oscillator |
| Insider threat (privileged user) | Medium | High | Segregation of duties; JIT elevation; behavior analytics |

---

## 5. Success Metrics (KPIs)

| KPI | Baseline (2024) | 2026 Target | Measurement |
|-----|-----------------|-------------|-------------|
| Certificate turnaround | 5 days | < 24 h | Mean time from test-complete to signed DCC |
| Calibration interval efficiency | 100 % fixed | 85 % dynamic | % of intervals set by AI vs fixed |
| Customer verification rate | 0 % | 30 % | % of certs verified via QR/on-chain |
| ILC administrative overhead | 40 hr/round | < 4 hr/round | Time from scheme launch to report issuance |
| Platform uptime | 99.9 % | 99.99 % | Excluding planned maintenance |
| Scrap cost avoidance | $0 | > $1 M / yr | Sum of prevented late rejections × unit cost |
| First-pass yield (FPY) | 94 % | > 99 % | Good parts / total parts at first operation |
| Measurement-to-action latency | 4 hr (lab) | < 100 ms | Inline sensor → closed-loop correction command |
| Serial-level traceability | 0 % | 100 % | % of production volume with full digital thread |
| Machine-actionable data ratio | 0 % | 100 % | % of measurements emitted as JSON-LD / AAS vs human PDF |
| Digital twin coverage | 0 % | 100 % | % of accredited assets with live synchronized twin |
| Cloud tenant onboarding time | 2 weeks | < 10 min | Self-service provisioning + schema migration |
| Autonomic loop closed-latency | — | < 5 s | Sense → semantify → decide → act → verify cycle |
| Audit trail completeness | 60 % | 100 % | % of CRUD actions with ALCOA+ compliant entry |
| Integrity checkpoint frequency | Daily | Hourly | Merkle-root verification scans |
| Security incident response time | 24 hr | < 5 min | Mean time from detection to auto-containment |
| Penetration test findings | 10+ | 0 critical | Annual third-party pen-test + continuous red-team |
| Customer NPS (hybrid) | +25 | +65 | Quarterly survey; lab-only vs hybrid cohort |
| Emergency response time | 48–72 hr | < 4 hr | Time from request to technician on-site |
| Technician utilization | 55 % | 85 % | Billable hours / total hours |
| Sample transport damage | 3 % | < 0.2 % | Condition-monitored shipments vs total |
| Defect detection limit | > 50 µm | > 1 µm (CT) | Smallest reliably detected internal defect |
| Nano roughness resolution | — | 0.1 nm (AFM) | AFM vertical resolution on calibration grating |
| New revenue from advanced tech | $0 | > $2M/yr | CT + nano service line revenue |
| Internal feature inspection | Destructive only | 100 % NDT | % of parts inspected non-destructively via CT |

---

*Roadmap Owner:* Senior Systems Architect  
*Next Revision:* 2026-07-01
