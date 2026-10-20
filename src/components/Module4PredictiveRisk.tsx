import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Sliders,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { useMedSync } from '../context/MedSyncContext';
import { computeLongitudinalRisk } from '../utils/clinicalAlgorithms';

export const Module4PredictiveRisk: React.FC = () => {
  const { activePatient, pushTriageIncident, setActiveTab } = useMedSync();

  const [daysWindow, setDaysWindow] = useState<30 | 60 | 90>(60);
  const [glucoseDriftMgDl, setGlucoseDriftMgDl] = useState<number>(
    activePatient.defaultDrift.glucoseDriftMgDl
  );
  const [bpVarianceMmHg, setBpVarianceMmHg] = useState<number>(
    activePatient.defaultDrift.bpVarianceMmHg
  );
  const [hrCreepBpm, setHrCreepBpm] = useState<number>(
    activePatient.defaultDrift.hrCreepBpm
  );
  const [escalated, setEscalated] = useState<boolean>(false);

  // Sync default drift when patient changes
  useEffect(() => {
    setGlucoseDriftMgDl(activePatient.defaultDrift.glucoseDriftMgDl);
    setBpVarianceMmHg(activePatient.defaultDrift.bpVarianceMmHg);
    setHrCreepBpm(activePatient.defaultDrift.hrCreepBpm);
    setEscalated(false);
  }, [activePatient.id]);

  const mlResult = useMemo(
    () =>
      computeLongitudinalRisk(
        daysWindow,
        {
          fastingGlucose: activePatient.baselineVitals.glucoseMgDl,
          systolicBp: activePatient.baselineVitals.systolicBp,
          restingHr: activePatient.baselineVitals.hrBpm
        },
        {
          glucoseDriftMgDl,
          bpVarianceMmHg,
          hrCreepBpm
        }
      ),
    [daysWindow, activePatient, glucoseDriftMgDl, bpVarianceMmHg, hrCreepBpm]
  );

  const handleResetDefaults = () => {
    setGlucoseDriftMgDl(activePatient.defaultDrift.glucoseDriftMgDl);
    setBpVarianceMmHg(activePatient.defaultDrift.bpVarianceMmHg);
    setHrCreepBpm(activePatient.defaultDrift.hrCreepBpm);
    setEscalated(false);
  };

  const handleEscalateToTriage = () => {
    pushTriageIncident({
      patientId: activePatient.id,
      patientName: activePatient.name,
      abhaId: activePatient.abhaId,
      sourceModule: 'PREDICTIVE_ML',
      severity: mlResult.riskTier === 'CRITICAL' ? 'CRITICAL' : 'MODERATE',
      title: `${daysWindow}-Day ML Risk Escalation: Pre-Diabetes ${mlResult.preDiabetesProbability}% · HTN ${mlResult.hypertensionRisk}%`,
      metricSummary: `Variance Score ${mlResult.varianceScore} · Glycemic Drift ${
        glucoseDriftMgDl >= 0 ? `+${glucoseDriftMgDl}` : glucoseDriftMgDl
      } mg/dL · BP Var ±${bpVarianceMmHg} mmHg`,
      clinicalAction: mlResult.clinicalRecommendation
    });
    setEscalated(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & 30/60/90 Day Window Switcher */}
      <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>PILLAR 04</span>
              <span aria-hidden="true">·</span>
              <span>SCIKIT-LEARN LONGITUDINAL VARIANCE PIPELINE</span>
              <span aria-hidden="true">·</span>
              <span>PRE-SYMPTOMATIC CHRONIC TRAJECTORY</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mt-1">
              30/60/90-Day Predictive Risk Stratification &amp; Variance Modeling
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Window Switcher */}
            <div
              role="group"
              aria-label="Longitudinal Horizon Window"
              className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#090D16] border border-slate-800"
            >
              {([30, 60, 90] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    setDaysWindow(w);
                    setEscalated(false);
                  }}
                  className={`px-3.5 py-1.5 rounded-md font-mono text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    daysWindow === w
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {w} Days
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleEscalateToTriage}
              disabled={escalated}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                escalated
                  ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 cursor-default'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              <span>
                {escalated ? 'Escalated to Doctor Triage Queue' : 'Escalate to High-Priority Triage'}
              </span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3 Primary ML Output KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Variance Score */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
          <div className="text-xs font-mono text-slate-400 uppercase">
            COMPOSITE LONGITUDINAL VARIANCE SCORE
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              data-testid="ml-variance-score"
              className="text-3xl font-mono font-bold text-slate-100 tabular-nums"
            >
              {mlResult.varianceScore}
            </span>
            <span className="text-xs font-mono text-slate-400">/ 100 (&sigma;&sup2; Index)</span>
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400 tabular-nums">
            Glucose &sigma;&sup2;: {mlResult.glucoseVariance} · Systolic BP &sigma;&sup2;: {mlResult.bpVariance}
          </div>
        </div>

        {/* Pre-Diabetes Probability */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
          <div className="text-xs font-mono text-slate-400 uppercase">
            PRE-DIABETES / DYSGLYCEMIA PROBABILITY
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              data-testid="ml-prediabetes-prob"
              className={`text-3xl font-mono font-bold tabular-nums ${
                mlResult.preDiabetesProbability >= 70
                  ? 'text-red-400'
                  : mlResult.preDiabetesProbability >= 45
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {mlResult.preDiabetesProbability}%
            </span>
            <span className="text-xs font-mono text-slate-400">({daysWindow}-Day Horizon)</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full ${
                mlResult.preDiabetesProbability >= 70
                  ? 'bg-red-500'
                  : mlResult.preDiabetesProbability >= 45
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${mlResult.preDiabetesProbability}%` }}
            />
          </div>
        </div>

        {/* Hypertension Progression Risk */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
          <div className="text-xs font-mono text-slate-400 uppercase">
            HYPERTENSION PROGRESSION RISK
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              data-testid="ml-hypertension-risk"
              className={`text-3xl font-mono font-bold tabular-nums ${
                mlResult.hypertensionRisk >= 70
                  ? 'text-red-400'
                  : mlResult.hypertensionRisk >= 45
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {mlResult.hypertensionRisk}%
            </span>
            <span className="text-xs font-mono text-slate-400">({daysWindow}-Day Horizon)</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full ${
                mlResult.hypertensionRisk >= 70
                  ? 'bg-red-500'
                  : mlResult.hypertensionRisk >= 45
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${mlResult.hypertensionRisk}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Left (Interactive Longitudinal Parameter Sliders), Right (Recharts Longitudinal Area Chart + Clinical Recommendation) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Sliders & Feature Importance */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h3 className="text-base font-semibold text-slate-100">
                  Longitudinal Trend Parameter Controls
                </h3>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-5">
              {/* Slider 1: Fasting Glucose Drift */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="slider-glucose-drift" className="font-medium text-slate-200">
                    Fasting Glucose Drift (&Delta; mg/dL)
                  </label>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">
                    {glucoseDriftMgDl >= 0 ? `+${glucoseDriftMgDl}` : glucoseDriftMgDl} mg/dL
                  </span>
                </div>
                <input
                  id="slider-glucose-drift"
                  type="range"
                  min={-15}
                  max={45}
                  step={1}
                  value={glucoseDriftMgDl}
                  onChange={(e) => {
                    setGlucoseDriftMgDl(Number(e.target.value));
                    setEscalated(false);
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1">
                  <span>-15 mg/dL (Remission)</span>
                  <span>0 (Stable)</span>
                  <span>+45 mg/dL (Severe Drift)</span>
                </div>
              </div>

              {/* Slider 2: Systolic BP Variance */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="slider-bp-variance" className="font-medium text-slate-200">
                    Systolic BP Oscillation Variance (&plusmn; mmHg)
                  </label>
                  <span className="font-mono font-bold text-blue-400 tabular-nums">
                    &plusmn;{bpVarianceMmHg} mmHg
                  </span>
                </div>
                <input
                  id="slider-bp-variance"
                  type="range"
                  min={2}
                  max={28}
                  step={1}
                  value={bpVarianceMmHg}
                  onChange={(e) => {
                    setBpVarianceMmHg(Number(e.target.value));
                    setEscalated(false);
                  }}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1">
                  <span>&plusmn;2 mmHg (Low Var)</span>
                  <span>&plusmn;14 mmHg</span>
                  <span>&plusmn;28 mmHg (Labile HTN)</span>
                </div>
              </div>

              {/* Slider 3: Resting HR Creep */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="slider-hr-creep" className="font-medium text-slate-200">
                    Resting HR Sympathetic Creep (&Delta; BPM)
                  </label>
                  <span className="font-mono font-bold text-red-400 tabular-nums">
                    {hrCreepBpm >= 0 ? `+${hrCreepBpm}` : hrCreepBpm} BPM
                  </span>
                </div>
                <input
                  id="slider-hr-creep"
                  type="range"
                  min={-5}
                  max={22}
                  step={1}
                  value={hrCreepBpm}
                  onChange={(e) => {
                    setHrCreepBpm(Number(e.target.value));
                    setEscalated(false);
                  }}
                  className="w-full accent-red-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1">
                  <span>-5 BPM (Conditioned)</span>
                  <span>0 BPM</span>
                  <span>+22 BPM (Autonomic Stress)</span>
                </div>
              </div>
            </div>

            {/* Scikit-Learn Feature Weights */}
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <div className="text-xs font-mono text-slate-400 uppercase mb-2.5">
                RandomForest / Variance Feature Weights
              </div>
              <div className="space-y-2.5">
                {mlResult.featureImportance.map((feat) => (
                  <div
                    key={feat.feature}
                    className="bg-[#090D16] border border-slate-800/90 rounded-lg p-3 text-xs"
                  >
                    <div className="flex items-center justify-between font-medium text-slate-200">
                      <span>{feat.feature}</span>
                      <span className="font-mono text-blue-400 tabular-nums">
                        Weight: {feat.weightPct}%
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 mt-1">
                      Current Input: {feat.contribution}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Longitudinal Area Chart & Clinical Protocol */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  {daysWindow}-Day Longitudinal Trajectory &amp; Reference Thresholds
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Amber Area: Fasting Glucose (mg/dL) · Blue Curve: Systolic BP (mmHg) · Red Dashed: Clinical Cutoff
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-blue-400 shrink-0" />
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mlResult.series} margin={{ top: 10, right: 16, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradGlucose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradBp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis
                    dataKey="dayLabel"
                    stroke="#64748B"
                    tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  />
                  <YAxis
                    stroke="#64748B"
                    domain={[75, 185]}
                    tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090D16',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono'
                    }}
                  />
                  <ReferenceLine
                    y={135}
                    stroke="#EF4444"
                    strokeDasharray="4 4"
                    label={{ value: 'Stage-1 HTN Cutoff (135 mmHg)', fill: '#FCA5A5', fontSize: 10 }}
                  />
                  <ReferenceLine
                    y={125}
                    stroke="#F59E0B"
                    strokeDasharray="4 4"
                    label={{ value: 'ADA Diabetes Cutoff (125 mg/dL)', fill: '#FDE68A', fontSize: 10 }}
                  />
                  <ReferenceLine
                    y={100}
                    stroke="#10B981"
                    strokeDasharray="3 3"
                    label={{ value: 'Normal Fasting Glucose (100 mg/dL)', fill: '#6EE7B7', fontSize: 10 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="systolicBp"
                    name="Systolic BP (mmHg)"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradBp)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="fastingGlucose"
                    name="Fasting Glucose (mg/dL)"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradGlucose)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Predictive Stratification Clinical Verdict */}
          <div
            className={`rounded-xl p-5 border ${
              mlResult.riskTier === 'CRITICAL'
                ? 'bg-red-950/30 border-red-500/50'
                : mlResult.riskTier === 'MODERATE'
                ? 'bg-amber-950/25 border-amber-500/40'
                : 'bg-emerald-950/25 border-emerald-500/40'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {mlResult.riskTier === 'CRITICAL' ? (
                  <AlertOctagon className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                ) : mlResult.riskTier === 'MODERATE' ? (
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-mono text-xs font-bold uppercase text-slate-100">
                    STRATIFICATION TIER: {mlResult.riskTier} ({daysWindow}-DAY VARIANCE MODEL)
                  </div>
                  <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                    {mlResult.clinicalRecommendation}
                  </p>
                </div>
              </div>

              {escalated && (
                <button
                  type="button"
                  onClick={() => setActiveTab('wearable-ble')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-blue-300 whitespace-nowrap shrink-0"
                >
                  View Triage Queue &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
