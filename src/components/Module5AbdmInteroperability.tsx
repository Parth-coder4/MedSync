import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  Lock,
  Smartphone,
  Building2,
  FileCode2,
  CheckCircle2,
  RefreshCw,
  Fingerprint,
  FileText,
  KeyRound,
  X
} from 'lucide-react';
import { useMedSync } from '../context/MedSyncContext';
import { FhirRecordBundle } from '../data/clinicalData';

export const Module5AbdmInteroperability: React.FC = () => {
  const {
    activePatient,
    abdmSyncedPatients,
    syncExternalAbdmRecords
  } = useMedSync();

  const [purpose, setPurpose] = useState<string>('CAREMGT — Care Management');
  const [dateFrom, setDateFrom] = useState<string>('2026-01-01');
  const [dateTo, setDateTo] = useState<string>('2026-10-19');
  const [hiTypes, setHiTypes] = useState<{
    Prescription: boolean;
    DiagnosticReport: boolean;
    DischargeSummary: boolean;
  }>({
    Prescription: true,
    DiagnosticReport: true,
    DischargeSummary: true
  });

  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('849201');
  const [isFetchingHiu, setIsFetchingHiu] = useState<boolean>(false);
  const [fetchProgressStep, setFetchProgressStep] = useState<string>('');
  const [filterHiType, setFilterHiType] = useState<string>('ALL');

  const isPatientSynced = Boolean(abdmSyncedPatients[activePatient.id]);

  const filteredTimeline = useMemo(() => {
    return activePatient.ehrTimeline.filter((item) => {
      if (filterHiType === 'ALL') return true;
      return item.hiType === filterHiType;
    });
  }, [activePatient.ehrTimeline, filterHiType]);

  const [selectedBundleId, setSelectedBundleId] = useState<string>(
    activePatient.ehrTimeline[0]?.id || ''
  );

  useEffect(() => {
    if (activePatient.ehrTimeline.length > 0) {
      setSelectedBundleId(activePatient.ehrTimeline[0].id);
    }
  }, [activePatient.id, activePatient.ehrTimeline.length]);

  const selectedBundle: FhirRecordBundle | undefined = useMemo(
    () =>
      activePatient.ehrTimeline.find((b) => b.id === selectedBundleId) ||
      activePatient.ehrTimeline[0],
    [activePatient.ehrTimeline, selectedBundleId]
  );

  const handleRequestConsent = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConsentModal(true);
  };

  const handleApproveConsent = () => {
    setShowConsentModal(false);
    setIsFetchingHiu(true);
    setFetchProgressStep('Handshaking with ABDM Gateway (v0.5/consent-requests/on-init)...');

    const consentArtifactId = `CA-ABDM-${Date.now().toString().slice(-6)}`;

    setTimeout(() => {
      setFetchProgressStep(
        'Decrypting Fidelius ECDH Curve25519 bundles from AIIMS New Delhi & Fortis Escorts HIP nodes...'
      );
    }, 350);

    setTimeout(() => {
      syncExternalAbdmRecords(activePatient.id, consentArtifactId);
      setIsFetchingHiu(false);
      setFetchProgressStep('');
    }, 750);
  };

  return (
    <div className="space-y-6">
      {/* Top ABDM Architecture Header */}
      <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>PILLAR 05</span>
              <span aria-hidden="true">·</span>
              <span>AYUSHMAN BHARAT DIGITAL MISSION (ABDM)</span>
              <span aria-hidden="true">·</span>
              <span>HL7 FHIR R4 (NRCeS INDIA PROFILE)</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mt-1">
              National Health Stack (HIP / HIU Consent Engine &amp; ABHA 360 Timeline)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="px-3 py-2 rounded-lg bg-[#090D16] border border-slate-800 text-slate-200 tabular-nums">
              ABHA ID: <span className="text-blue-400 font-semibold">{activePatient.abhaId}</span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-[#090D16] border border-slate-800 text-emerald-400">
              DPDP Act 2023 &amp; DISHA Compliant
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Left (Step-by-Step ABDM Consent Flow + FHIR Inspector), Right (360-Degree Longitudinal EHR Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols */}
        <div className="lg:col-span-5 space-y-6">
          {/* Step-by-Step Interactive ABDM Consent Request Builder */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  1. HIU Consent Artifact Request Builder
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Request federated EHR bundles from external national HIP hospitals
                </p>
              </div>
              <Shield className="w-5 h-5 text-blue-400 shrink-0" />
            </div>

            <form onSubmit={handleRequestConsent} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  Target Patient ABHA Address &amp; ID
                </label>
                <div className="bg-[#090D16] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 tabular-nums">
                  {activePatient.abhaAddress} ({activePatient.abhaId})
                </div>
              </div>

              <div>
                <label
                  htmlFor="abdm-purpose-select"
                  className="block text-xs font-mono text-slate-400 uppercase mb-1"
                >
                  Purpose of Use (ABDM Consent Schema)
                </label>
                <select
                  id="abdm-purpose-select"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-[#090D16] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="CAREMGT — Care Management">CAREMGT — Care Management</option>
                  <option value="BTG — Break the Glass Emergency">
                    BTG — Break the Glass Emergency
                  </option>
                  <option value="PUBHLTH — Public Health Surveillance">
                    PUBHLTH — Public Health Surveillance
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="abdm-date-from"
                    className="block text-xs font-mono text-slate-400 uppercase mb-1"
                  >
                    From Date
                  </label>
                  <input
                    id="abdm-date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-[#090D16] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="abdm-date-to"
                    className="block text-xs font-mono text-slate-400 uppercase mb-1"
                  >
                    To Date
                  </label>
                  <input
                    id="abdm-date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-[#090D16] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs font-mono text-slate-400 uppercase mb-2">
                  Health Information (HI) Types Requested
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['Prescription', 'DiagnosticReport', 'DischargeSummary'] as const).map(
                    (type) => (
                      <label
                        key={type}
                        className="flex items-center gap-2 bg-[#090D16] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={hiTypes[type]}
                          onChange={(e) =>
                            setHiTypes((prev) => ({ ...prev, [type]: e.target.checked }))
                          }
                          className="accent-blue-500"
                        />
                        <span className="truncate">{type}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isFetchingHiu}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                <span>
                  {isPatientSynced
                    ? 'Re-Trigger ABDM Patient Consent & HIU Sync'
                    : 'Trigger ABDM Patient Consent & Pull External EHR'}
                </span>
              </button>
            </form>

            {isFetchingHiu && (
              <div className="mt-4 bg-blue-950/30 border border-blue-500/40 rounded-lg p-3.5 flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                <div className="text-xs font-mono text-blue-200">{fetchProgressStep}</div>
              </div>
            )}

            {isPatientSynced && !isFetchingHiu && (
              <div
                data-testid="abdm-sync-complete-banner"
                className="mt-4 bg-emerald-950/30 border border-emerald-500/40 rounded-lg p-3.5 flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-200">
                  External HIP records from <span className="font-semibold">AIIMS New Delhi</span> &amp;{' '}
                  <span className="font-semibold">Fortis Escorts</span> decrypted and merged into 360 Timeline.
                </div>
              </div>
            )}
          </div>

          {/* AES-256 / DISHA / DPDP Act 2023 Compliance & FHIR R4 Metadata Inspector */}
          {selectedBundle && (
            <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-base font-semibold text-slate-100">
                    FHIR R4 &amp; Cryptographic Compliance Inspector
                  </h3>
                </div>
                <span className="font-mono text-xs text-emerald-400">VERIFIED</span>
              </div>

              <div className="space-y-2.5 text-xs font-mono bg-[#090D16] border border-slate-800 rounded-lg p-3.5">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">BUNDLE ID:</span>
                  <span className="text-slate-100">{selectedBundle.id}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">HIP NODE ID:</span>
                  <span className="text-blue-400">{selectedBundle.facilityHipId}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">CONSENT ARTIFACT:</span>
                  <span className="text-emerald-400">{selectedBundle.consentArtifactId}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">CIPHER SUITE:</span>
                  <span className="text-slate-200 text-right">{selectedBundle.encryptionCipher}</span>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-slate-400 mb-1">SHA-256 INTEGRITY DIGEST:</div>
                  <div className="text-[11px] text-slate-300 break-all">
                    {selectedBundle.sha256Hash}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs font-mono text-slate-400 mb-1.5">
                  HL7 FHIR R4 Bundle Payload (NRCeS India Profile):
                </div>
                <pre className="bg-[#090D16] border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-52">
                  {JSON.stringify(selectedBundle.fhirResourceJson, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Right 7 Cols: Unified 360-Degree Longitudinal EHR Timeline */}
        <div className="lg:col-span-7">
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Unified 360-Degree Longitudinal EHR Timeline ({filteredTimeline.length} Bundles)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Includes local hospital panels, federated HIU records &amp; newly signed Module 2 e-Prescriptions
                </p>
              </div>

              {/* HI Type Segmented Filter */}
              <div className="inline-flex items-center gap-1 bg-[#090D16] p-1 rounded-lg border border-slate-800 shrink-0">
                {(
                  [
                    { id: 'ALL', label: 'All' },
                    { id: 'Prescription', label: 'Prescription' },
                    { id: 'DiagnosticReport', label: 'Diagnostics' },
                    { id: 'DischargeSummary', label: 'Discharge' }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterHiType(tab.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      filterHiType === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div data-testid="abdm-timeline-list" className="space-y-4">
              {filteredTimeline.map((bundle) => {
                const isSelected = selectedBundle?.id === bundle.id;
                return (
                  <div
                    key={bundle.id}
                    className={`rounded-xl p-4 border transition-colors ${
                      isSelected
                        ? 'bg-[#090D16] border-blue-500/60'
                        : 'bg-[#090D16]/70 border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-blue-400 font-semibold uppercase">
                          {bundle.hiType}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-slate-300 tabular-nums">{bundle.authoredDate}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-emerald-400">{bundle.facilityHipId}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedBundleId(bundle.id)}
                        className="inline-flex items-center gap-1 text-xs font-mono text-blue-400 hover:text-blue-300 self-start sm:self-auto"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'Inspecting FHIR R4' : 'Inspect FHIR R4'}</span>
                      </button>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-100 mt-1.5">{bundle.title}</h4>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{bundle.facilityName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{bundle.doctorName}</span>
                    </div>

                    <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                      {bundle.summary}
                    </p>

                    {/* Structured Key Clinical Metrics */}
                    {bundle.keyMetrics.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {bundle.keyMetrics.map((m) => (
                          <div
                            key={m.label}
                            className="bg-[#111827] border border-slate-800/80 rounded-lg px-3 py-2"
                          >
                            <div className="text-[11px] text-slate-400 truncate">{m.label}</div>
                            <div
                              className={`text-xs font-mono font-semibold mt-0.5 tabular-nums ${
                                m.status === 'CRITICAL'
                                  ? 'text-red-400'
                                  : m.status === 'WARNING'
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {m.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span className="truncate">
                        SHA-256: {bundle.sha256Hash.slice(0, 24)}...
                      </span>
                      <span className="text-emerald-400 shrink-0 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        AES-256 Verified
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Mobile OTP & Biometric Consent Artifact Modal */}
      {showConsentModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="abdm-consent-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <h3
                  id="abdm-consent-modal-title"
                  className="text-base font-semibold text-slate-100"
                >
                  ABHA Patient App — Consent Artifact Pin
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                aria-label="Close Consent Modal"
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="bg-[#090D16] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">HIU Requester:</span>
                  <span className="font-semibold text-slate-100">MedSync Precision Portal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient ABHA:</span>
                  <span className="font-mono text-blue-400">{activePatient.abhaId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Purpose:</span>
                  <span className="text-slate-200">{purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">External HIP Nodes:</span>
                  <span className="text-emerald-400">AIIMS Delhi · Fortis · SMS Jaipur</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="abdm-otp-input"
                  className="block text-xs font-mono text-slate-400 uppercase mb-1"
                >
                  ABHA Mobile OTP &amp; Biometric Token
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      id="abdm-otp-input"
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full bg-[#090D16] border border-slate-800 rounded-lg pl-9 pr-3 py-2 font-mono text-sm tracking-widest text-slate-100"
                    />
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 font-mono text-xs">
                    <Fingerprint className="w-4 h-4" />
                    <span>Bio Ready</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
              >
                Deny Request
              </button>
              <button
                type="button"
                onClick={handleApproveConsent}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Consent (Patient App View)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
