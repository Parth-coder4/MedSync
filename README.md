# MedSync — AI-Powered Precision Care, Wearable Telemetry & Allergy Intelligence

[![FHIR R4](https://img.shields.io/badge/HL7%20FHIR-R4%20(NRCeS%20India)-blueviolet?style=for-the-badge)](https://nrces.in/)
[![RxNorm](https://img.shields.io/badge/CDS%20Engine-NIH%20RxNorm%20%2B%20Gemini-orange?style=for-the-badge)](https://www.nlm.nih.gov/research/umls/rxnorm/)
[![Compliance](https://img.shields.io/badge/Compliance-DISHA%20%7C%20DPDP%20Act%202023-teal?style=for-the-badge)](https://abdm.gov.in/)

> **MedSync** is a unified, clinical-grade precision medicine and bio-telemetry web platform. It bridges offline edge intelligence with national health interoperability to prevent adverse drug reactions (ADRs), catch pre-symptomatic chronic illness, and enforce cryptographic EHR provenance across the Ayushman Bharat Digital Mission (ABDM) ecosystem.

---

## 🌟 Executive Summary & Problem Space

1. **Undetected Excipient Allergies & FMCG Mislabeling:** Millions of patients with IgE or celiac sensitivities ingest harmful hidden allergens (Tartrazine E102, Soya Lecithin INS 322, Arachis Oil, Gluten, Sulfites) due to noisy OCR packaging or complex excipient nomenclature.
2. **Polypharmacy & Drug Interactions:** Critical drug-drug and drug-food contraindications (e.g., Warfarin + Ibuprofen GI bleeding, Atorvastatin + Clarithromycin rhabdomyolysis, Beta-Blocker bradycardia) are frequently missed during rapid prescription drafting.
3. **Disconnected Wearable Telemetry:** Consumer smartwatches stream vital signs in silos without clinical context or automated pharmacovigilance cross-checking against active medication regimens.
4. **Delayed Chronic Disease Diagnosis:** Glycemic drift and blood pressure oscillations often develop 4–12 weeks prior to overt clinical symptoms, escaping standard periodic checkups.
5. **EHR Silos:** Fragmented patient medical records across hospitals in India lack seamless, consent-driven FHIR R4 exchange.

**MedSync resolves these challenges across 5 interconnected architectural pillars sharing real-time clinical state.**

---

## 🏛️ The 5 Core Architectural Pillars

### 1. PILLAR 1: Instant Offline Allergy Scanner (Edge OCR + Levenshtein Engine)
- **Zero-Network Deep Learning Simulation:** RapidOCR (ONNX Runtime INT8) simulation coupled with a native JavaScript implementation of **Levenshtein Distance** and `thefuzz` token/partial similarity matching.
- **Dynamic Patient Allergy Matrix:** Live editor allows clinicians and patients to add, remove, and test custom allergens with real-time re-indexing.
- **Distorted FMCG & Medicine Blister Presets:** 4 realistic Indian packaging presets with optical noise and glyph substitutions (`Hydr0genated Arachis (Peanut) 0il`, `S0ya Lecith1n (INS 322)`, `Paracetam0l 500mg + Tartraz1ne Yellow (INS 102)`, `S0dium Metabisulf1te (E220)`) plus live camera simulation.
- **Token-by-Token Match Matrix:** Monospace audit trail showing raw tokens, normalized strings, fuzzy similarity percentages (e.g., `89% match`), and instant **RED DANGER / AMBER CAUTION / GREEN SAFE** clinical badges.
- **Local AI Dietitian Panel:** Automatically recommends 3 verified, FSSAI-compliant, allergen-free Indian whole food and OTC excipient alternatives whenever an allergen is flagged.
- **Telemetry Metric:** Deterministic CPU execution speed badge (`<142ms | 0 Network Bytes Used`).

### 2. PILLAR 2: Clinical Decision Support (CDS) & Pharmacological Safety Engine
- **Dual-Layer Deterministic + Generative Reasoning:** Combines authoritative **NIH RxNorm** and **OpenFDA** interaction rules with server-side **Gemini 3.8 Flash Clinical Reasoning** (`/api/clinical-reasoning` with zero-latency deterministic fallback).
- **Multi-Vector Safety Checking:**
  - **Drug-Drug Interactions (DDI):** Detects severe events like Warfarin + Ibuprofen (GI hemorrhage), Atorvastatin + Clarithromycin (CYP3A4 inhibition / rhabdomyolysis), Spironolactone + ACE/ARBs (hyperkalemia), and Beta-Blockers + CCBs (AV block).
  - **Drug-Food Interactions (DFI):** Flags dietary co-factors including Vitamin K-rich leafy greens (Palak/Methi surges against Warfarin) and Grapefruit furanocoumarins against Atorvastatin.
  - **Drug-Allergy Interactions (DAI):** Cross-references active allergies against tablet excipients (e.g., Tartrazine yellow dye coatings, Lactose monohydrate fillers).
- **1-Click "Swap with Safe Clinical Alternative":** Replaces contraindicated medications with verified, bioequivalent alternatives (e.g., swapping Ibuprofen for Paracetamol Dye-Free, or Clarithromycin for Azithromycin) in a single click.
- **Cryptographic SHA-256 e-Prescription Signing:** Digitally signs prescriptions with an SHA-256 digest, automatically updating the patient's active regimen for wearable surveillance and publishing the FHIR R4 bundle to the ABDM 360 Timeline.

### 3. PILLAR 3: Real-Time Wearable Telemetry & Bio-Telemetry ADR Engine
- **Live Continuous Ingestion:** Simulates Bluetooth Low Energy (BLE GATT `0x180D` Heart Rate, `0x1822` Pulse Oximeter, `0x1808` Continuous Glucose) and Google Health Connect streams at 1-second tick intervals.
- **Rolling Z-Score Anomaly Engine:** Computes real-time standard score statistics ($Z = \frac{x - \mu}{\sigma}$) over sliding temporal windows to detect acute deviations.
- **Physiological Crisis Simulator:** 4 interactive anomaly injection buttons:
  1. *Resting Tachycardia Spike (>125 BPM)* — flags paroxysmal SVT / AFib risk.
  2. *Nocturnal Hypoxia Drop (SpO2 < 89%)* — flags acute hypoxic desaturation.
  3. *Post-Meal Glycemic Surge (210 mg/dL)* — flags acute CGM dysregulation.
  4. *Beta-Blocker Bradycardia ADR (<48 BPM)* — cross-references active beta-blocker prescriptions (e.g., Metoprolol, Propranolol) to diagnose drug-induced bradycardia.
- **High-Priority Doctor Triage Queue:** Blinking clinical alert banner and incident log with real-time acknowledgment workflows.

### 4. PILLAR 4: 30/60/90-Day Predictive Risk Stratification (Variance ML)
- **Time-Series Variance Modeling:** Simulates a Scikit-Learn longitudinal pipeline across **30-Day**, **60-Day**, and **90-Day** observational horizons.
- **Interactive Physiological Parameter Controls:**
  - Fasting Glycemic Drift ($\Delta\text{mg/dL}$, $-15$ to $+45\text{ mg/dL}$)
  - Systolic Blood Pressure Oscillation Variance ($\pm\text{mmHg}$, $2$ to $28\text{ mmHg}$)
  - Resting Heart Rate Sympathetic Creep ($\Delta\text{BPM}$, $-5$ to $+22\text{ BPM}$)
- **Longitudinal Visual Analytics:** Multi-layer Recharts area chart with clinical cutoffs (ADA Diabetes cutoff at $125\text{ mg/dL}$, Pre-Diabetes at $100\text{ mg/dL}$, and Stage-1 HTN at $135\text{ mmHg}$).
- **Calculated Outcomes:** Real-time **Composite Variance Score ($\sigma^2$)**, **Pre-Diabetes Probability (%)**, and **Hypertension Progression Risk (%)** with 1-click escalation to the Doctor Triage Queue.

### 5. PILLAR 5: National Health Stack (ABDM & ABHA 360 Interoperability)
- **Ayushman Bharat Digital Mission (HIP/HIU) Compliance:** Implements the consent-driven EHR exchange workflow.
- **Interactive Consent Flow:**
  - Doctor drafts consent artifact request (Purpose of Use: Care Management / Emergency Triage, date bounds, and Health Information Types: Prescription, DiagnosticReport, DischargeSummary).
  - Triggers a simulated **ABHA Mobile OTP & Biometric Consent Modal** with patient approval simulation.
  - Animate the **HIU Gateway Fetch** retrieving federated records from external nodes (*AIIMS New Delhi*, *SMS Medical College & Hospital Jaipur*, *Fortis Escorts*).
- **Unified 360-Degree Longitudinal EHR Timeline:** Combines historical hospital discharges, diagnostic lab panels, external HIU records, and newly signed Module 2 digital e-prescriptions.
- **FHIR R4 & Security Inspector:** In-depth viewer for HL7 FHIR R4 JSON bundles (NRCeS India profile), AES-256-GCM / ECDH Curve25519 encryption metadata, and DISHA / DPDP Act 2023 compliance verification.

---

## 💻 Tech Stack & Architecture

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19 (Hooks: `useState`, `useEffect`, `useMemo`, `useRef`, `useContext`) |
| **Language & Bundler** | TypeScript 5+, Vite 8+, Tailwind CSS v4 |
| **Data Visualization** | Recharts 3+ (`LineChart`, `AreaChart`, `ResponsiveContainer`, `ReferenceLine`, `Tooltip`) |
| **Typography & Design** | Clinical Dark Mode (`#090D16`), Plus Jakarta Sans, JetBrains Mono, Noto Sans Devanagari |
| **Full-Stack Runtime** | Express 4, Node.js 22+ (native `node:test` runner), `tsx` loader |
| **AI & Pharmacogenomics**| `@google/genai` (Gemini 3.8 Flash), NIH RxNorm, OpenFDA, FSSAI Excipient Database |
| **Health Informatics** | HL7 FHIR R4, NRCeS India Profiles, ABDM Gateway API v0.5 Standards |

---

## 📁 Repository Structure

```
├── .env.example                     # Environment configuration template
├── index.html                       # HTML5 entry point with Plus Jakarta Sans & JetBrains Mono
├── metadata.json                    # Applet metadata & major server-side Gemini capabilities
├── package.json                     # Full-stack dependencies & run scripts
├── server.ts                        # Express server with Vite middleware & /api/clinical-reasoning
├── tsconfig.json                    # Strict TypeScript configuration
├── vite.config.ts                   # Vite configuration with Tailwind CSS plugin
├── src/
│   ├── main.tsx                     # React 19 DOM bootstrap
│   ├── index.css                    # Tailwind CSS v4 imports & clinical typography rules
│   ├── App.tsx                      # Top Telemetry Header, Tab Navigation & Shell
│   ├── context/
│   │   └── MedSyncContext.tsx       # Centralized React state provider (Patients, BLE, Triage, ABDM)
│   ├── data/
│   │   └── clinicalData.ts          # Pre-loaded ABHA patient profiles, presets, RxNorm catalog
│   ├── utils/
│   │   ├── clinicalAlgorithms.ts    # Pure Levenshtein, Z-Score, CDS safety & ML risk algorithms
│   │   └── clinicalAlgorithms.test.ts # Native Node.js 22+ test suite (node:test)
│   └── components/
│       ├── Module1AllergyScanner.tsx       # Pillar 1: Offline Edge OCR & Fuzzy Matcher
│       ├── Module2CdsPrescription.tsx      # Pillar 2: CDS Pharmacological Safety Engine
│       ├── Module3WearableTelemetry.tsx     # Pillar 3: BLE Wearable Oscilloscope & ADR Triage
│       ├── Module4PredictiveRisk.tsx       # Pillar 4: 30/60/90-Day Longitudinal ML
│       └── Module5AbdmInteroperability.tsx  # Pillar 5: ABDM HIU Consent & ABHA 360 Timeline
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v20.0.0` or higher (Recommended: Node.js `v22+` with native TypeScript test execution)
- **Package Manager**: `npm` or `bun`

### 1. Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### 2. Environment Setup (Optional for Gemini AI)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Gemini API key (optional — if omitted or empty, the built-in deterministic clinical reasoning fallback automatically activates with full fidelity):
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

### 3. Run Development Server
Start the unified full-stack server (runs Express and Vite on port 3000):
```bash
npm run dev
```
Open your browser at:
```
http://localhost:3000
```

### 4. Run Unit Test Suite
Execute the pure algorithmic test suite using Node's built-in test runner:
```bash
npm run test
```
*Tests verify edit distance math, noisy OCR allergen detection, Warfarin + Ibuprofen contraindication logic, rolling Z-score beta-blocker bradycardia ADR identification, longitudinal variance calculation, and SHA-256 digital signature generation.*

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🧪 Interactive Walkthroughs & Test Journeys

### Journey 1: Testing the Offline Allergy Scanner (Pillar 1)
1. Select patient **Rajesh Sharma** from the top right patient selector (has documented *Peanuts, Tartrazine E102, Soy Lecithin* allergies).
2. Choose the **Curved Pouch: Masala Bhujia & Nut Mix** label preset.
3. Observe the immediate **RED DANGER** verdict, sub-140ms execution badge, and the Token-by-Token matrix highlighting:
   - `Hydr0genated Arachis (Peanut) 0il` $\rightarrow$ Matched `Peanuts` (`100% similarity`)
   - `S0ya Lecith1n (INS 322)` $\rightarrow$ Matched `Soy Lecithin` (`96% similarity`)
   - `Tartraz1ne Yellow (E102)` $\rightarrow$ Matched `Tartrazine E102` (`91% similarity`)
4. Review the **Local AI Dietitian Panel** at the bottom for verified Indian alternatives (e.g., Cold-Pressed Sunflower Oil, Roasted Makhana, Dolo-650 dye-free paracetamol).
5. Remove an allergen or add a custom one (e.g. `Gluten`) and watch the matrix re-calculate instantly.

### Journey 2: Pharmacological CDS & Safe Alternative Swap (Pillars 2 $\rightarrow$ 3 $\rightarrow$ 5)
1. Switch to **Pillar 2 (CDS & e-Rx)**.
2. Observe the drafted `Ibuprofen 400mg` triggering a **CRITICAL Drug-Drug Contraindication** against Rajesh's active `Warfarin 5mg` (GI Hemorrhage risk).
3. Click the green **"Swap with Safe Clinical Alternative"** button.
4. Ibuprofen is instantly swapped for `Paracetamol 500mg (Dye-Free)`; the critical alert clears and the status switches to **REGIMEN VERIFIED SAFE**.
5. Click **"Digitally Sign & Push to ABHA Locker"**. A 64-character SHA-256 signature is generated and the signed medication is pushed directly to Pillar 5's ABDM Timeline.

### Journey 3: BLE Wearable Telemetry & ADR Detection (Pillar 3)
1. Switch to **Pillar 3 (Wearable BLE)**.
2. Watch the live 1-second multi-trace oscilloscope tracking Heart Rate, $\text{SpO}_2$, Continuous Glucose, and HRV.
3. Click **"Simulate Beta-Blocker Bradycardia ADR (<48 BPM)"**.
4. Heart rate drops to $\approx 44\text{ BPM}$ ($Z < -3.0$). The engine detects Rajesh's active prescription for `Metoprolol Succinate XL 50mg` and escalates **`Drug-Induced Sinus Bradycardia ADR`** into the Doctor Triage Queue.

### Journey 4: 30/60/90-Day Longitudinal Risk Modeling (Pillar 4)
1. Switch to **Pillar 4 (Variance ML)**.
2. Toggle between **30 Days**, **60 Days**, and **90 Days** windows.
3. Adjust the **Fasting Glucose Drift** slider to $+35\text{ mg/dL}$ and **Systolic BP Oscillation Variance** slider to $\pm 22\text{ mmHg}$.
4. Watch the Area Chart adjust its trajectory curves and calculate updated **Pre-Diabetes Probability** and **Hypertension Progression Risk**.
5. Click **"Escalate to High-Priority Triage"** to transmit the predictive trajectory to the global emergency queue.

### Journey 5: ABDM HIU Consent & FHIR 360 Timeline (Pillar 5)
1. Switch to **Pillar 5 (ABDM 360)**.
2. Under the HIU Consent Request Builder, click **"Trigger ABDM Patient Consent & Pull External EHR"**.
3. In the simulated mobile app modal, enter the biometric token and click **"Approve Consent (Patient App View)"**.
4. Observe the animated HIU Gateway fetch pulling encrypted records from **AIIMS New Delhi** and **Fortis Escorts Jaipur**.
5. Click any record in the unified timeline to inspect the cryptographic SHA-256 hash, AES-256 cipher suite, and the underlying **HL7 FHIR R4 JSON Bundle**.

---

## 🔒 Security, Compliance & Data Governance

- **DPDP Act 2023 Compliant:** Patient consent artifacts specify purpose limitation (`CAREMGT`), data retention periods, and granular health information types (`HI Types`).
- **DISHA & NRCeS India Ready:** Clinical records conform to standard HL7 FHIR R4 structure definitions for `PrescriptionRecord`, `DiagnosticReportLab`, and `DischargeSummaryRecord`.
- **Zero Raw Data Transmission in OCR:** Edge allergy string matching executes 100% in-browser without sending patient ingredient scans across the network.
- **Cryptographic Provenance:** Every digital prescription signed on the portal is sealed with an SHA-256 digital signature hash.

---

## 👥 Standards & Specifications
- **Institutions & Standards:** National Health Authority (NHA), Ayushman Bharat Digital Mission (ABDM), HL7 International, National Library of Medicine (NIH RxNorm), Food Safety and Standards Authority of India (FSSAI).

---

## 📄 License
This project is licensed under the **Apache-2.0 License**.
