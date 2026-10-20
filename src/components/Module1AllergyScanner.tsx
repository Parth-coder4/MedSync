import React, { useState, useMemo } from 'react';
import {
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Plus,
  X,
  Cpu,
  Utensils,
  Camera,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { useMedSync } from '../context/MedSyncContext';
import { OCR_LABEL_PRESETS } from '../data/clinicalData';
import { scanIngredientsAgainstAllergies, ALLERGEN_KNOWLEDGE_BASE } from '../utils/clinicalAlgorithms';

export const Module1AllergyScanner: React.FC = () => {
  const {
    activePatient,
    addPatientAllergen,
    removePatientAllergen,
    pushTriageIncident
  } = useMedSync();

  const [selectedPresetId, setSelectedPresetId] = useState<string>(OCR_LABEL_PRESETS[0].id);
  const [ocrText, setOcrText] = useState<string>(OCR_LABEL_PRESETS[0].rawOcrText);
  const [newAllergenInput, setNewAllergenInput] = useState<string>('');
  const [cameraScanCount, setCameraScanCount] = useState<number>(0);
  const [loggedToTriage, setLoggedToTriage] = useState<boolean>(false);

  const activePreset = useMemo(
    () => OCR_LABEL_PRESETS.find((p) => p.id === selectedPresetId) || OCR_LABEL_PRESETS[0],
    [selectedPresetId]
  );

  const scanReport = useMemo(
    () => scanIngredientsAgainstAllergies(ocrText, activePatient.allergies),
    [ocrText, activePatient.allergies]
  );

  const handleSelectPreset = (presetId: string) => {
    const found = OCR_LABEL_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setSelectedPresetId(presetId);
    setOcrText(found.rawOcrText);
    setLoggedToTriage(false);
  };

  const handleAddAllergen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllergenInput.trim()) return;
    addPatientAllergen(newAllergenInput.trim());
    setNewAllergenInput('');
  };

  const handleSimulateCameraCapture = () => {
    const nextIdx = (cameraScanCount + 1) % OCR_LABEL_PRESETS.length;
    const preset = OCR_LABEL_PRESETS[nextIdx];
    setCameraScanCount((c) => c + 1);
    setSelectedPresetId(preset.id);
    setOcrText(preset.rawOcrText);
    setLoggedToTriage(false);
  };

  const handleFlagToTriage = () => {
    if (scanReport.overallStatus === 'SAFE') return;
    pushTriageIncident({
      patientId: activePatient.id,
      patientName: activePatient.name,
      abhaId: activePatient.abhaId,
      sourceModule: 'ALLERGY_OCR',
      severity: scanReport.overallStatus === 'DANGER' ? 'CRITICAL' : 'MODERATE',
      title: `Allergen Exposure Risk Blocked: ${scanReport.flaggedAllergens.join(', ')}`,
      metricSummary: `Max Levenshtein Fuzzy Match ${scanReport.maxSimilarity}% · Edge Latency ${scanReport.executionTimeMs}ms`,
      clinicalAction: `Patient advised to avoid scanned product (${activePreset.title}) and switch to verified allergen-free alternatives.`
    });
    setLoggedToTriage(true);
  };

  const quickAddCandidates = Object.keys(ALLERGEN_KNOWLEDGE_BASE).filter(
    (alg) => !activePatient.allergies.some((a) => a.toLowerCase() === alg.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Module Header & Verdict Banner */}
      <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>PILLAR 01</span>
              <span aria-hidden="true">·</span>
              <span>ON-DEVICE RAPIDOCR (ONNX INT8)</span>
              <span aria-hidden="true">·</span>
              <span>LEVENSHTEIN FUZZY STRING MATCHER</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mt-1">
              Instant Offline Allergy Scanner & Excipient Intelligence
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#090D16] border border-slate-800 font-mono text-xs text-slate-300 tabular-nums">
              <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{scanReport.executionTimeMs}ms</span>
              <span aria-hidden="true" className="text-slate-600">|</span>
              <span className="text-emerald-400">0 Network Bytes Used</span>
            </div>

            {scanReport.overallStatus !== 'SAFE' && (
              <button
                type="button"
                onClick={handleFlagToTriage}
                disabled={loggedToTriage}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  loggedToTriage
                    ? 'bg-slate-800 text-slate-400 cursor-default'
                    : 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                }`}
              >
                {loggedToTriage ? 'Logged to Clinical Triage' : 'Log Exposure Alert to Triage'}
              </button>
            )}
          </div>
        </div>

        {/* Immediate Clinical Verdict Banner */}
        <div
          data-testid="allergy-verdict-banner"
          className={`mt-5 rounded-xl p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            scanReport.overallStatus === 'DANGER'
              ? 'bg-red-950/35 border-red-500/50 text-red-100'
              : scanReport.overallStatus === 'WARNING'
              ? 'bg-amber-950/35 border-amber-500/50 text-amber-100'
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
          }`}
        >
          <div className="flex items-start gap-3.5">
            {scanReport.overallStatus === 'DANGER' ? (
              <ShieldAlert className="w-7 h-7 text-red-400 shrink-0 mt-0.5" />
            ) : scanReport.overallStatus === 'WARNING' ? (
              <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-bold tracking-wider uppercase">
                  {scanReport.overallStatus === 'DANGER'
                    ? 'RED DANGER — CONTRAINDICATED ALLERGEN DETECTED'
                    : scanReport.overallStatus === 'WARNING'
                    ? 'AMBER CAUTION — MODERATE LEXICAL EXCIPIENT PROXIMITY'
                    : 'GREEN SAFE — ZERO ALLERGEN MATCHES FOR PATIENT'}
                </span>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span className="font-mono text-xs tabular-nums">
                  Peak Similarity: {scanReport.maxSimilarity}%
                </span>
              </div>
              <p className="text-sm mt-1 text-slate-200">
                {scanReport.overallStatus === 'DANGER'
                  ? `Flagged ${scanReport.flaggedAllergens.join(', ')} against ${activePatient.name}'s IgE / Celiac Allergy Matrix across ${scanReport.tokens.length} tokenized ingredients.`
                  : scanReport.overallStatus === 'WARNING'
                  ? `Potential lexical match detected. Verify botanical/chemical origin before administration to ${activePatient.name}.`
                  : `All ${scanReport.tokens.length} ingredient tokens cleared against ${activePatient.name}'s allergy matrix (${activePatient.allergies.join(', ') || 'No active allergies'}).`}
              </p>
            </div>
          </div>

          <div className="font-mono text-right shrink-0">
            <div className="text-xs text-slate-400">ACTIVE PATIENT ABHA</div>
            <div className="text-sm font-semibold text-slate-100 tabular-nums">{activePatient.abhaId}</div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Left Controls (Allergy Matrix + OCR Input), Right Output (Token Breakdown + AI Dietitian) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          {/* Patient Allergy Matrix Editor */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Patient Allergy Matrix Editor
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Active profile for {activePatient.name} · Real-time Levenshtein re-indexing
                </p>
              </div>
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                {activePatient.allergies.length} Active
              </span>
            </div>

            {/* Active Allergen Interactive Removable Buttons */}
            <div className="flex flex-wrap gap-2 my-3" role="list" aria-label="Active Patient Allergens">
              {activePatient.allergies.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">
                  No known allergens registered. Add an allergen below to test real-time scanning.
                </p>
              ) : (
                activePatient.allergies.map((allergen) => {
                  const isTriggered = scanReport.flaggedAllergens.includes(allergen);
                  return (
                    <div
                      key={allergen}
                      role="listitem"
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isTriggered
                          ? 'bg-red-500/20 border-red-500/50 text-red-200'
                          : 'bg-[#090D16] border-slate-700/80 text-slate-200'
                      }`}
                    >
                      <span>{allergen}</span>
                      <button
                        type="button"
                        onClick={() => removePatientAllergen(allergen)}
                        aria-label={`Remove allergen ${allergen}`}
                        className="text-slate-400 hover:text-red-400 transition-colors p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Custom Allergen Form */}
            <form onSubmit={handleAddAllergen} className="flex gap-2 mt-4">
              <label htmlFor="custom-allergen-input" className="sr-only">
                Add custom allergen
              </label>
              <input
                id="custom-allergen-input"
                type="text"
                value={newAllergenInput}
                onChange={(e) => setNewAllergenInput(e.target.value)}
                placeholder="Add allergen (e.g., Gluten, Sulfites, Casein)..."
                className="flex-1 bg-[#090D16] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Allergen</span>
              </button>
            </form>

            {/* Quick-Add Clinical Allergens */}
            {quickAddCandidates.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="text-xs text-slate-400 mb-2">Quick-add standard allergens:</div>
                <div className="flex flex-wrap gap-1.5">
                  {quickAddCandidates.map((cand) => (
                    <button
                      key={cand}
                      type="button"
                      onClick={() => addPatientAllergen(cand)}
                      className="px-2.5 py-1 rounded-md bg-[#090D16] hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors whitespace-nowrap shrink-0"
                    >
                      + {cand}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Curved FMCG Label Presets + Live OCR Input */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Curved Label Presets & Live OCR Input
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a distorted Indian FMCG / OTC blister preset or type raw ingredients
                </p>
              </div>
              <button
                type="button"
                onClick={handleSimulateCameraCapture}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                <span>Simulate Camera Scan</span>
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {OCR_LABEL_PRESETS.map((preset) => {
                const isSelected = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-blue-950/30 border-blue-500/60 text-slate-100'
                        : 'bg-[#090D16] border-slate-800/90 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-100">{preset.title}</span>
                      <span className="text-[11px] font-mono text-blue-400 shrink-0">
                        {preset.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{preset.ocrDistortionNote}</div>
                  </button>
                );
              })}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="raw-ocr-textarea"
                  className="text-xs font-medium text-slate-300"
                >
                  Raw ONNX RapidOCR Ingredient Stream (Editable):
                </label>
                <button
                  type="button"
                  onClick={() => setOcrText(activePreset.rawOcrText)}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Preset</span>
                </button>
              </div>
              <textarea
                id="raw-ocr-textarea"
                rows={4}
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder="Paste or type comma-separated ingredients with OCR noise..."
                className="w-full bg-[#090D16] border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-100 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right Column: 7 cols (Token-by-Token Levenshtein Matrix + Local AI Dietitian Panel) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Token-by-Token Fuzzy Match Breakdown */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Token-by-Token Levenshtein Fuzzy Match Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evaluating edit distance & substring similarity against {activePatient.name}&apos;s allergy synonyms
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400 tabular-nums">
                Threshold: &ge;72% Danger · 58–71% Warning
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                    <th className="py-2.5 pr-3">Raw OCR Token</th>
                    <th className="py-2.5 px-3">Matched Allergen / Synonym</th>
                    <th className="py-2.5 px-3 text-right">Levenshtein Score</th>
                    <th className="py-2.5 pl-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {scanReport.tokens.map((tok, index) => (
                    <tr
                      key={`${tok.rawToken}-${index}`}
                      className={
                        tok.status === 'DANGER'
                          ? 'bg-red-950/20'
                          : tok.status === 'WARNING'
                          ? 'bg-amber-950/15'
                          : ''
                      }
                    >
                      <td className="py-3 pr-3 align-top">
                        <div className="font-mono font-medium text-slate-100">{tok.rawToken}</div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                          norm: &quot;{tok.normalizedToken}&quot;
                        </div>
                      </td>
                      <td className="py-3 px-3 align-top">
                        {tok.matchedAllergen ? (
                          <div>
                            <div className="font-semibold text-slate-100">
                              {tok.matchedAllergen}{' '}
                              <span className="font-mono text-xs text-slate-400">
                                (&rarr; &quot;{tok.matchedTerm}&quot;)
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{tok.explanation}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">No allergen match in matrix</span>
                        )}
                      </td>
                      <td className="py-3 px-3 align-top text-right font-mono tabular-nums">
                        <div className="inline-flex flex-col items-end">
                          <span
                            className={`text-sm font-bold ${
                              tok.status === 'DANGER'
                                ? 'text-red-400'
                                : tok.status === 'WARNING'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {tok.similarityScore}%
                          </span>
                          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full ${
                                tok.status === 'DANGER'
                                  ? 'bg-red-500'
                                  : tok.status === 'WARNING'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${tok.similarityScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pl-3 align-top text-right font-mono whitespace-nowrap">
                        {tok.status === 'DANGER' ? (
                          <span className="text-red-400 font-semibold whitespace-nowrap">✖ DANGER</span>
                        ) : tok.status === 'WARNING' ? (
                          <span className="text-amber-400 font-semibold whitespace-nowrap">▲ CAUTION</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold whitespace-nowrap">● SAFE</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Local AI Dietitian Panel */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Utensils className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    Local AI Clinical Dietitian & OTC Excipient Substitutes
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {scanReport.flaggedAllergens.length > 0
                      ? `3 verified Indian clinical/FMCG alternatives free of ${scanReport.flaggedAllergens.join(', ')}`
                      : `Scanned item is safe for ${activePatient.name}. Showing preventive metabolic nutrition recommendations.`}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs text-emerald-400">FSSAI / IP Verified</span>
            </div>

            {scanReport.dietitianAlternatives.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {scanReport.dietitianAlternatives.map((alt, idx) => (
                  <div
                    key={alt.name}
                    className="bg-[#090D16] border border-slate-800/90 rounded-lg p-3.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 mb-1">
                        <span>ALT 0{idx + 1}</span>
                        <span>SAFE SWAP</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                        {alt.name}
                      </h4>
                      <div className="text-xs text-blue-400 mt-1">{alt.brandOrCategory}</div>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        {alt.clinicalBenefit}
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                      {alt.safetyNote}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#090D16] border border-slate-800/80 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  No allergen substitutions required for this label. All ingredients comply with{' '}
                  <span className="font-semibold text-slate-100">{activePatient.name}</span>&apos;s
                  recorded allergy profile ({activePatient.allergies.join(', ') || 'None'}).
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
