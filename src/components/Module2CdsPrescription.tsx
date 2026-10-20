import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSignature,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  Plus,
  Trash2,
  Pill,
  Sparkles,
  ExternalLink,
  Lock
} from 'lucide-react';
import { useMedSync } from '../context/MedSyncContext';
import { PRESCRIPTION_DRUG_CATALOG } from '../data/clinicalData';
import {
  MedicationItem,
  evaluatePrescriptionSafety,
  DrugInteractionAlert
} from '../utils/clinicalAlgorithms';

interface ClinicalReasoningOutput {
  summary: string;
  pharmacokineticPathway: string;
  monitoringProtocol: string;
  engineSource: string;
}

export const Module2CdsPrescription: React.FC = () => {
  const {
    activePatient,
    signAndPushPrescription,
    setActiveTab,
    pushTriageIncident
  } = useMedSync();

  // Initialize draft with a realistic clinical test drug so contraindications are immediately visible & interactive
  const [draftMeds, setDraftMeds] = useState<MedicationItem[]>([
    PRESCRIPTION_DRUG_CATALOG[0] // Ibuprofen 400mg (triggers Warfarin + Ibuprofen on Rajesh Sharma)
  ]);

  const [customDrugName, setCustomDrugName] = useState<string>('');
  const [customDosage, setCustomDosage] = useState<string>('500mg');
  const [customFrequency, setCustomFrequency] = useState<string>('BID after meals');
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    'Monitor INR/hemodynamic stability and counsel patient on dietary cofactor restrictions.'
  );

  const [signedReceipt, setSignedReceipt] = useState<{
    sha256Hash: string;
    bundleId: string;
    signedAt: string;
    medCount: number;
  } | null>(null);

  const [reasoning, setReasoning] = useState<ClinicalReasoningOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Reset signed receipt when switching patients
  useEffect(() => {
    setSignedReceipt(null);
    if (activePatient.id === 'pt-rajesh') {
      setDraftMeds([PRESCRIPTION_DRUG_CATALOG[0]]); // Ibuprofen 400mg -> Warfarin interaction
    } else if (activePatient.id === 'pt-priya') {
      setDraftMeds([PRESCRIPTION_DRUG_CATALOG[2]]); // Spironolactone 25mg -> Telmisartan hyperkalemia + Lactose excipient
    } else {
      setDraftMeds([PRESCRIPTION_DRUG_CATALOG[1]]); // Clarithromycin 500mg -> Atorvastatin CYP3A4 interaction
    }
  }, [activePatient.id]);

  const safetyAlerts = useMemo(
    () =>
      evaluatePrescriptionSafety(
        draftMeds,
        activePatient.activeMedications,
        activePatient.allergies
      ),
    [draftMeds, activePatient.activeMedications, activePatient.allergies]
  );

  const criticalAlerts = safetyAlerts.filter((a) => a.severity === 'CRITICAL');
  const moderateAlerts = safetyAlerts.filter((a) => a.severity === 'MODERATE');

  const runClinicalReasoning = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/clinical-reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: activePatient.name,
          primaryDiagnosis: activePatient.primaryDiagnosis,
          allergies: activePatient.allergies,
          activeMedications: activePatient.activeMedications,
          draftMedications: draftMeds,
          detectedAlerts: safetyAlerts
        })
      });
      if (response.ok) {
        const data = await response.json();
        setReasoning(data);
      }
    } catch (_e) {
      // Fallback if network offline
      setReasoning({
        summary:
          criticalAlerts.length > 0
            ? `Critical interaction detected for ${activePatient.name}. Immediate therapeutic substitution advised.`
            : `Regimen evaluated for ${activePatient.name} using deterministic RxNorm rules.`,
        pharmacokineticPathway:
          safetyAlerts[0]?.mechanism || 'Standard hepatic & renal clearance pathway.',
        monitoringProtocol:
          'Verify continuous BLE wearable vitals in Pillar 3 and update ABHA FHIR R4 locker.',
        engineSource: 'RxNorm + OpenFDA Deterministic Clinical Engine'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    runClinicalReasoning();
  }, [draftMeds, activePatient.id]);

  const handleAddCatalogDrug = (drug: MedicationItem) => {
    setSignedReceipt(null);
    if (draftMeds.some((m) => m.id === drug.id || m.name.toLowerCase() === drug.name.toLowerCase())) {
      return;
    }
    setDraftMeds((prev) => [...prev, drug]);
  };

  const handleRemoveDraftDrug = (id: string) => {
    setSignedReceipt(null);
    setDraftMeds((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddCustomDrug = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customDrugName.trim();
    if (!trimmed) return;
    setSignedReceipt(null);
    const customItem: MedicationItem = {
      id: `custom-${Date.now()}`,
      name: `${trimmed} ${customDosage}`.trim(),
      genericName: trimmed,
      dosage: customDosage,
      frequency: customFrequency,
      rxcui: `${Math.floor(100000 + Math.random() * 899999)}`,
      drugClass: 'Custom Physician Order'
    };
    setDraftMeds((prev) => [...prev, customItem]);
    setCustomDrugName('');
  };

  const handleSwapWithSafeAlternative = (alert: DrugInteractionAlert) => {
    if (!alert.safeAlternative) return;
    const alt = alert.safeAlternative;
    setSignedReceipt(null);
    setDraftMeds((prev) => {
      const filtered = prev.filter(
        (m) => m.name.toLowerCase() !== alert.primaryDrug.toLowerCase()
      );
      const newMed: MedicationItem = {
        id: `swap-${alt.rxcui}-${Date.now()}`,
        name: alt.name,
        genericName: alt.genericName,
        dosage: alt.dosage,
        frequency: alt.frequency,
        rxcui: alt.rxcui,
        drugClass: alt.drugClass
      };
      return [...filtered, newMed];
    });
  };

  const handleSignAndPush = () => {
    if (draftMeds.length === 0) return;
    const result = signAndPushPrescription(draftMeds, clinicalNotes);
    setSignedReceipt({
      sha256Hash: result.sha256Hash,
      bundleId: result.bundleId,
      signedAt: new Date().toTimeString().split(' ')[0] + ' IST',
      medCount: draftMeds.length
    });

    if (criticalAlerts.length > 0) {
      pushTriageIncident({
        patientId: activePatient.id,
        patientName: activePatient.name,
        abhaId: activePatient.abhaId,
        sourceModule: 'CDS_RX',
        severity: 'CRITICAL',
        title: `Override Signed with Active Contraindication (${criticalAlerts[0].primaryDrug})`,
        metricSummary: `RxCUI ${criticalAlerts[0].primaryRxcui} · Bundle ${result.bundleId}`,
        clinicalAction: 'Close hemodynamic & laboratory surveillance required within 24 hours.'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Strip */}
      <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>PILLAR 02</span>
              <span aria-hidden="true">·</span>
              <span>NIH RXNORM + OPENFDA DETERMINISTIC ENGINE</span>
              <span aria-hidden="true">·</span>
              <span>GEMINI 3.8 CLINICAL PHARMACOLOGY</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mt-1">
              Clinical Decision Support (CDS) &amp; Pharmacological Safety Engine
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div
              data-testid="cds-overall-severity"
              className={`px-3.5 py-2 rounded-lg border font-mono text-xs font-semibold ${
                criticalAlerts.length > 0
                  ? 'bg-red-950/40 border-red-500/50 text-red-300'
                  : moderateAlerts.length > 0
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {criticalAlerts.length > 0
                ? `✖ ${criticalAlerts.length} CRITICAL CONTRAINDICATION(S)`
                : moderateAlerts.length > 0
                ? `▲ ${moderateAlerts.length} MODERATE INTERACTION(S)`
                : '● REGIMEN VERIFIED SAFE'}
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Left (Active Profile + e-Rx Pad), Right (Real-time Contraindication Engine + Gemini Reasoning + Sign Action) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 5 Cols */}
        <div className="lg:col-span-5 space-y-6">
          {/* Patient Current Active Medications & Known Allergies */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <h3 className="text-base font-semibold text-slate-100">
              Active Baseline Regimen &amp; Allergies
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {activePatient.name} · {activePatient.primaryDiagnosis}
            </p>

            <div className="mt-4">
              <div className="text-xs font-mono text-slate-400 uppercase mb-2">
                Current Active Medications ({activePatient.activeMedications.length})
              </div>
              <div className="space-y-2">
                {activePatient.activeMedications.map((med) => (
                  <div
                    key={med.id}
                    className="bg-[#090D16] border border-slate-800/90 rounded-lg p-3 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-100">{med.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {med.drugClass} · {med.frequency}
                      </div>
                    </div>
                    <span className="font-mono text-xs text-blue-400 shrink-0 tabular-nums">
                      RxCUI: {med.rxcui}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="text-xs font-mono text-slate-400 uppercase mb-1.5">
                Known Food &amp; Excipient Allergies
              </div>
              <div className="text-xs text-red-300 font-medium">
                {activePatient.allergies.join(' · ') || 'None Recorded'}
              </div>
            </div>
          </div>

          {/* Interactive e-Prescription Pad */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <h3 className="text-base font-semibold text-slate-100">
              Interactive e-Prescription Pad
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select from NIH RxNorm formulary or add a custom drug order to test real-time CDS checks
            </p>

            {/* Quick Formulary Catalog */}
            <div className="mt-3">
              <div className="text-xs font-mono text-slate-400 mb-2">
                1-Click Formulary Catalog:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESCRIPTION_DRUG_CATALOG.map((item) => {
                  const inDraft = draftMeds.some(
                    (d) => d.name.toLowerCase() === item.name.toLowerCase()
                  );
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddCatalogDrug(item)}
                      disabled={inDraft}
                      className={`text-left p-2.5 rounded-lg border text-xs transition-colors ${
                        inDraft
                          ? 'bg-blue-950/25 border-blue-500/40 text-blue-300 cursor-default'
                          : 'bg-[#090D16] border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="font-semibold truncate">{item.name}</div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                        RxCUI {item.rxcui} · {inDraft ? 'Added' : '+ Add to Rx'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Drug Order Form */}
            <form
              onSubmit={handleAddCustomDrug}
              className="mt-4 pt-4 border-t border-slate-800/80 space-y-3"
            >
              <div className="text-xs font-mono text-slate-400">
                Or Draft Custom Medication Order:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label htmlFor="rx-custom-name" className="sr-only">
                    Custom Drug Name
                  </label>
                  <input
                    id="rx-custom-name"
                    type="text"
                    value={customDrugName}
                    onChange={(e) => setCustomDrugName(e.target.value)}
                    placeholder="Drug (e.g. Ibuprofen)"
                    className="w-full bg-[#090D16] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="rx-custom-dose" className="sr-only">
                    Dosage
                  </label>
                  <input
                    id="rx-custom-dose"
                    type="text"
                    value={customDosage}
                    onChange={(e) => setCustomDosage(e.target.value)}
                    placeholder="Dosage (e.g. 400mg)"
                    className="w-full bg-[#090D16] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="rx-custom-freq" className="sr-only">
                    Frequency
                  </label>
                  <input
                    id="rx-custom-freq"
                    type="text"
                    value={customFrequency}
                    onChange={(e) => setCustomFrequency(e.target.value)}
                    placeholder="Frequency (e.g. TID)"
                    className="w-full bg-[#090D16] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Medication to Draft Rx</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: 7 Cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Draft Prescription List */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Draft e-Prescription Pad ({draftMeds.length} Medication{draftMeds.length === 1 ? '' : 's'})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pending cryptographic SHA-256 signature &amp; ABHA Locker push
                </p>
              </div>
              <span className="font-mono text-xs text-slate-400">FHIR R4 MedicationRequest</span>
            </div>

            {draftMeds.length === 0 ? (
              <div className="bg-[#090D16] border border-slate-800/80 rounded-lg p-6 text-center">
                <Pill className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  No medications in draft pad. Select a drug from the formulary on the left to evaluate contraindications.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {draftMeds.map((med) => (
                  <div
                    key={med.id}
                    className="bg-[#090D16] border border-slate-800 rounded-lg p-3.5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-100">{med.name}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="font-mono text-xs text-blue-400 tabular-nums">
                          RxCUI: {med.rxcui}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {med.drugClass} · Sig: {med.dosage} ({med.frequency})
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDraftDrug(med.id)}
                      aria-label={`Remove ${med.name} from draft`}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real-Time Contraindications & 1-Click Safe Alternative Swap */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Drug-Drug, Drug-Food &amp; Excipient Contraindication Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deterministic NIH RxNorm + OpenFDA cross-check against active meds &amp; food allergies
                </p>
              </div>
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                {safetyAlerts.length} Alert{safetyAlerts.length === 1 ? '' : 's'}
              </span>
            </div>

            {safetyAlerts.length === 0 ? (
              <div className="bg-emerald-950/25 border border-emerald-500/40 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-mono font-bold text-emerald-300 uppercase">
                    SAFE — ZERO CONTRAINDICATIONS DETECTED
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Drafted medications show no CYP450, hemostatic, renal potassium, or excipient conflicts with {activePatient.name}&apos;s profile.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {safetyAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    data-testid={`cds-alert-${alert.id}`}
                    className={`rounded-xl p-4 border ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-950/30 border-red-500/50'
                        : 'bg-amber-950/25 border-amber-500/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {alert.severity === 'CRITICAL' ? (
                          <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span
                          className={`font-mono text-xs font-bold uppercase ${
                            alert.severity === 'CRITICAL' ? 'text-red-300' : 'text-amber-300'
                          }`}
                        >
                          {alert.severity} · {alert.type.replace('_', '-')}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="font-mono text-xs text-slate-300 tabular-nums">
                          RxCUI {alert.primaryRxcui}
                          {alert.interactorRxcui ? ` × RxCUI ${alert.interactorRxcui}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="text-sm font-semibold text-slate-100">
                        {alert.primaryDrug} &times; {alert.interactorName}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        <span className="font-semibold text-slate-200">Mechanism:</span>{' '}
                        {alert.mechanism}
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        <span className="font-semibold text-slate-200">Clinical Impact:</span>{' '}
                        {alert.clinicalImpact}
                      </p>
                    </div>

                    {alert.safeAlternative && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs">
                          <span className="font-mono text-emerald-400 font-semibold">
                            Recommended Safe Alternative:{' '}
                          </span>
                          <span className="text-slate-100 font-semibold">
                            {alert.safeAlternative.name} (RxCUI: {alert.safeAlternative.rxcui})
                          </span>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {alert.safeAlternative.rationale}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSwapWithSafeAlternative(alert)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Swap with Safe Clinical Alternative</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gemini Clinical Pharmacology Reasoning Panel */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <h3 className="text-base font-semibold text-slate-100">
                  Generative Clinical Pharmacology Synthesis
                </h3>
              </div>
              <button
                type="button"
                onClick={runClinicalReasoning}
                disabled={isAnalyzing}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                {isAnalyzing ? 'Synthesizing...' : 'Re-Run Synthesis'}
              </button>
            </div>

            {reasoning && (
              <div className="bg-[#090D16] border border-slate-800 rounded-lg p-4 space-y-2.5 text-xs">
                <div className="font-mono text-[11px] text-blue-400">
                  ENGINE: {reasoning.engineSource}
                </div>
                <p className="text-slate-200 leading-relaxed">{reasoning.summary}</p>
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="font-mono text-[11px] text-slate-400 uppercase">
                      Pharmacokinetic Pathway
                    </div>
                    <p className="text-slate-300 mt-0.5">{reasoning.pharmacokineticPathway}</p>
                  </div>
                  <div>
                    <div className="font-mono text-[11px] text-slate-400 uppercase">
                      Recommended Telemetry &amp; Lab Protocol
                    </div>
                    <p className="text-slate-300 mt-0.5">{reasoning.monitoringProtocol}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Digital Signature & ABHA Locker Push */}
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <label
                htmlFor="clinical-rx-notes"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Physician Clinical Directive &amp; Dispensing Notes:
              </label>
              <input
                id="clinical-rx-notes"
                type="text"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full bg-[#090D16] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 mb-4 focus:outline-none focus:border-blue-500"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Signs FHIR R4 Bundle with SHA-256 &amp; syncs with Wearable ADR + ABDM Locker</span>
                </div>

                <button
                  type="button"
                  onClick={handleSignAndPush}
                  disabled={draftMeds.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <FileSignature className="w-4 h-4" />
                  <span>Digitally Sign &amp; Push to ABHA Locker</span>
                </button>
              </div>

              {signedReceipt && (
                <div
                  data-testid="signed-rx-receipt"
                  className="mt-4 bg-emerald-950/30 border border-emerald-500/50 rounded-xl p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>FHIR R4 PRESCRIPTION SIGNED &amp; PUSHED TO ABHA LOCKER</span>
                    </div>
                    <span className="font-mono text-xs text-slate-300 tabular-nums">
                      {signedReceipt.bundleId} · {signedReceipt.signedAt}
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-[11px] text-slate-300 break-all bg-[#090D16] p-2.5 rounded-lg border border-slate-800">
                    SHA-256 SIGNATURE: {signedReceipt.sha256Hash}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-300">
                      Added {signedReceipt.medCount} medication(s) to Active Regimen (Pillar 3 ADR) &amp; ABDM 360 Timeline (Pillar 5).
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('abdm-ehs')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 whitespace-nowrap shrink-0"
                    >
                      <span>View in ABDM 360 Timeline</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
