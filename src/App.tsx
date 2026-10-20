import React from 'react';
import {
  ScanLine,
  FileSignature,
  Activity,
  TrendingUp,
  Shield,
  UserCheck,
  Bell
} from 'lucide-react';
import { MedSyncProvider, useMedSync, ActiveTabId } from './context/MedSyncContext';
import { Module1AllergyScanner } from './components/Module1AllergyScanner';
import { Module2CdsPrescription } from './components/Module2CdsPrescription';
import { Module3WearableTelemetry } from './components/Module3WearableTelemetry';
import { Module4PredictiveRisk } from './components/Module4PredictiveRisk';
import { Module5AbdmInteroperability } from './components/Module5AbdmInteroperability';

const PILLAR_TABS: {
  id: ActiveTabId;
  shortNav: string;
  fullTitle: string;
  pillarTag: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'allergy-ocr',
    shortNav: 'Allergy OCR',
    fullTitle: 'PILLAR 1 — Offline Allergy Scanner',
    pillarTag: 'Edge OCR + Levenshtein',
    icon: ScanLine
  },
  {
    id: 'cds-rx',
    shortNav: 'CDS & e-Rx',
    fullTitle: 'PILLAR 2 — Clinical Decision Support',
    pillarTag: 'RxNorm + Gemini Rx',
    icon: FileSignature
  },
  {
    id: 'wearable-ble',
    shortNav: 'Wearable BLE',
    fullTitle: 'PILLAR 3 — Live Wearable Telemetry',
    pillarTag: '1Hz Z-Score + ADR',
    icon: Activity
  },
  {
    id: 'predictive-ml',
    shortNav: 'Variance ML',
    fullTitle: 'PILLAR 4 — 30/60/90d Risk ML',
    pillarTag: 'Scikit-Learn Variance',
    icon: TrendingUp
  },
  {
    id: 'abdm-ehs',
    shortNav: 'ABDM 360',
    fullTitle: 'PILLAR 5 — National Health Stack',
    pillarTag: 'ABHA + FHIR R4',
    icon: Shield
  }
];

const MedSyncPortalShell: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    patients,
    activePatientId,
    activePatient,
    selectPatient,
    telemetryStream,
    triageQueue
  } = useMedSync();

  const latestTick = telemetryStream[telemetryStream.length - 1] || activePatient.baselineVitals;
  const unacknowledgedCount = triageQueue.filter((t) => !t.acknowledged).length;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col">
      {/* Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (5 Concise Nav Links) — Zone 3 (Active Patient Selector) */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#090D16]/95 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('allergy-ocr');
          }}
          className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
        >
          MedSync
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Primary Clinical Modules"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400"
        >
          {PILLAR_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  isActive
                    ? 'text-slate-100 border-blue-500 font-semibold'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                {tab.shortNav}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action Control (Active Patient Selector Dropdown) */}
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="global-patient-selector" className="sr-only">
            Select Active Patient Profile
          </label>
          <UserCheck className="w-4 h-4 text-blue-400 hidden sm:block shrink-0" />
          <select
            id="global-patient-selector"
            aria-label="Active Patient Selector"
            value={activePatientId}
            onChange={(e) => selectPatient(e.target.value)}
            className="bg-[#111827] border border-slate-700/90 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500 max-w-[260px] sm:max-w-none truncate"
          >
            {patients.map((pt) => (
              <option key={pt.id} value={pt.id}>
                {pt.name} — ABHA: {pt.abhaId}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Clinical Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 space-y-6">
        {/* Telemetry Ribbon & Patient Precision Context Strip */}
        <section
          aria-label="System Telemetry and Patient Summary"
          className="bg-[#111827] border border-slate-800/80 rounded-xl p-4 sm:p-5 space-y-4"
        >
          {/* Top Metadata Line: Build With Bharat 2.0 + Live System Status Telemetry */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 pb-3.5 border-b border-slate-800/80 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-2 text-slate-300">
              <span className="font-semibold text-blue-400">BUILD WITH भारत 2.0</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Team Robust (JECRC Jaipur)</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">Doctor &amp; Patient Precision Portal</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-slate-300 tabular-nums">
              <span className="text-emerald-400">Edge OCR: ONNX Ready (&lt;142ms)</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-blue-400">CDS Engine: RxNorm + Gemini Active</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-emerald-400">Wearable BLE: Connected</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-blue-400">ABDM Gateway: HIP/HIU Online</span>
            </div>
          </div>

          {/* Patient Clinical Context Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-bold text-slate-100">
                  {activePatient.name}
                </h1>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  {activePatient.age}y / {activePatient.gender} · Blood {activePatient.bloodGroup} · ABHA:{' '}
                  <span className="text-slate-200">{activePatient.abhaId}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {activePatient.primaryDiagnosis} · Allergies:{' '}
                <span className="text-red-300 font-medium">
                  {activePatient.allergies.join(', ') || 'None'}
                </span>
              </p>
            </div>

            {/* Live Mini Vitals & Triage Alert Counter */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums">
              <div className="bg-[#090D16] border border-slate-800 rounded-lg px-3 py-2">
                <span className="text-slate-400">HR: </span>
                <span className="text-slate-100 font-semibold">{latestTick.hrBpm} BPM</span>
                <span aria-hidden="true" className="text-slate-600 mx-2">·</span>
                <span className="text-slate-400">SpO2: </span>
                <span className="text-slate-100 font-semibold">{latestTick.spo2Pct}%</span>
                <span aria-hidden="true" className="text-slate-600 mx-2">·</span>
                <span className="text-slate-400">CGM: </span>
                <span className="text-slate-100 font-semibold">{latestTick.glucoseMgDl} mg/dL</span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('wearable-ble')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border font-mono text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  unacknowledgedCount > 0
                    ? 'bg-red-950/40 border-red-500/50 text-red-300 hover:bg-red-950/60'
                    : 'bg-[#090D16] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Bell className="w-3.5 h-3.5 text-red-400" />
                <span>Triage Queue: {unacknowledgedCount} Active</span>
              </button>
            </div>
          </div>

          {/* 5 Interactive Pillar Tab Selector */}
          <div
            role="tablist"
            aria-label="MedSync 5 Clinical Pillars"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-2"
          >
            {PILLAR_TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 text-slate-100'
                      : 'bg-[#090D16] border-slate-800/90 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isSelected ? 'text-blue-400' : 'text-slate-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{tab.fullTitle}</div>
                    <div className="text-[11px] font-mono text-slate-400 truncate">
                      {tab.pillarTag}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Active Pillar Viewport */}
        <section aria-live="polite">
          {activeTab === 'allergy-ocr' && <Module1AllergyScanner />}
          {activeTab === 'cds-rx' && <Module2CdsPrescription />}
          {activeTab === 'wearable-ble' && <Module3WearableTelemetry />}
          {activeTab === 'predictive-ml' && <Module4PredictiveRisk />}
          {activeTab === 'abdm-ehs' && <Module5AbdmInteroperability />}
        </section>
      </main>

      {/* Quiet Clinical Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 mt-12 text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            MedSync Precision Care Platform · Built by Team Robust, JECRC Jaipur
          </div>
          <div className="font-mono">
            HL7 FHIR R4 (NRCeS India) · DISHA &amp; DPDP Act 2023 Compliant
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <MedSyncProvider>
      <MedSyncPortalShell />
    </MedSyncProvider>
  );
}
