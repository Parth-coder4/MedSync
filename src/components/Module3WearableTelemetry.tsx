import React from 'react';
import {
  Activity,
  Bluetooth,
  Play,
  Pause,
  AlertOctagon,
  CheckCircle2,
  Zap,
  HeartPulse,
  Droplets,
  Wind,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { useMedSync, AnomalyInjectionType } from '../context/MedSyncContext';

export const Module3WearableTelemetry: React.FC = () => {
  const {
    activePatient,
    isBleStreaming,
    setIsBleStreaming,
    telemetryStream,
    latestWearableEval,
    injectWearableAnomaly,
    triageQueue,
    acknowledgeTriageIncident,
    clearAcknowledgedTriage
  } = useMedSync();

  const latestSample = telemetryStream[telemetryStream.length - 1] || {
    timestamp: '11:36:00',
    hrBpm: activePatient.baselineVitals.hrBpm,
    spo2Pct: activePatient.baselineVitals.spo2Pct,
    glucoseMgDl: activePatient.baselineVitals.glucoseMgDl,
    hrvMs: activePatient.baselineVitals.hrvMs,
    zScoreHr: 0,
    zScoreSpo2: 0,
    zScoreGlucose: 0
  };

  const anomalyButtons: {
    type: AnomalyInjectionType;
    label: string;
    subtext: string;
    tone: string;
  }[] = [
    {
      type: 'TACHYCARDIA',
      label: 'Simulate Resting Tachycardia Spike (>125 BPM)',
      subtext: 'BLE GATT 0x180D · Triggers Z > +3.0 SVT/AFib Triage',
      tone: 'border-red-500/40 hover:bg-red-950/30 text-red-200'
    },
    {
      type: 'HYPOXIA',
      label: 'Simulate Nocturnal Hypoxia Drop (SpO2 < 89%)',
      subtext: 'BLE GATT 0x1822 · Triggers Desaturation Alert',
      tone: 'border-red-500/40 hover:bg-red-950/30 text-red-200'
    },
    {
      type: 'GLYCEMIC_SURGE',
      label: 'Simulate Post-Meal Glycemic Surge (210 mg/dL)',
      subtext: 'BLE GATT 0x1808 · Triggers CGM Hyperglycemic Alert',
      tone: 'border-amber-500/40 hover:bg-amber-950/30 text-amber-200'
    },
    {
      type: 'BRADYCARDIA_ADR',
      label: 'Simulate Beta-Blocker Bradycardia ADR (<48 BPM)',
      subtext: 'Cross-Checks Active Beta-Blocker Rx for Drug-Induced ADR',
      tone: 'border-red-500/40 hover:bg-red-950/30 text-red-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Live BLE GATT Controls */}
      <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>PILLAR 03</span>
              <span aria-hidden="true">·</span>
              <span>BLE GATT 0x180D / 0x1822 / 0x1808</span>
              <span aria-hidden="true">·</span>
              <span>ROLLING Z-SCORE ANOMALY &amp; ADR ENGINE</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mt-1">
              Real-Time Wearable Bio-Telemetry &amp; Pharmacovigilance ADR Engine
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#090D16] border border-slate-800 font-mono text-xs text-slate-300">
              <Bluetooth className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Health Connect Stream: {isBleStreaming ? '1Hz LIVE' : 'PAUSED'}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsBleStreaming((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isBleStreaming
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isBleStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause 1s Telemetry Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume 1s Telemetry Stream</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Clinical Anomaly Alert Banner */}
        <div
          data-testid="wearable-status-banner"
          className={`mt-5 rounded-xl p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            latestWearableEval.isAnomaly
              ? latestWearableEval.severity === 'CRITICAL'
                ? 'bg-red-950/40 border-red-500/60 text-red-100'
                : 'bg-amber-950/35 border-amber-500/50 text-amber-100'
              : 'bg-emerald-950/25 border-emerald-500/40 text-emerald-100'
          }`}
        >
          <div className="flex items-start gap-3">
            {latestWearableEval.isAnomaly ? (
              <AlertOctagon className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-mono text-xs font-bold uppercase">
                {latestWearableEval.title}
              </div>
              <p className="text-xs text-slate-200 mt-1">
                <span className="font-semibold">Clinical Directive:</span>{' '}
                {latestWearableEval.clinicalAction}
              </p>
              {latestWearableEval.relatedMedication && (
                <div className="mt-1.5 font-mono text-xs text-red-300">
                  Pharmacovigilance ADR Correlation: {latestWearableEval.relatedMedication}
                </div>
              )}
            </div>
          </div>
          <div className="font-mono text-xs text-right shrink-0 tabular-nums">
            <div className="text-slate-400">SLIDING Z-SCORE FORMULA</div>
            <div className="text-slate-200 mt-0.5">Z = (x - &mu;) / &sigma;</div>
          </div>
        </div>
      </div>

      {/* 4 Real-Time Vitals Readout Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Heart Rate */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>HEART RATE (0x180D)</span>
            <HeartPulse className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              data-testid="metric-hr-bpm"
              className={`text-3xl font-mono font-bold tabular-nums ${
                latestSample.hrBpm >= 120 || latestSample.hrBpm <= 50
                  ? 'text-red-400'
                  : 'text-slate-100'
              }`}
            >
              {latestSample.hrBpm}
            </span>
            <span className="text-xs font-mono text-slate-400">BPM</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-slate-400">Baseline: {activePatient.baselineVitals.hrBpm} BPM</span>
            <span
              className={
                Math.abs(latestSample.zScoreHr) >= 2.2 ? 'text-red-400 font-semibold' : 'text-emerald-400'
              }
            >
              Z = {latestSample.zScoreHr >= 0 ? `+${latestSample.zScoreHr}` : latestSample.zScoreHr}
            </span>
          </div>
        </div>

        {/* SpO2 */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>BLOOD OXYGEN (0x1822)</span>
            <Wind className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              data-testid="metric-spo2-pct"
              className={`text-3xl font-mono font-bold tabular-nums ${
                latestSample.spo2Pct < 90 ? 'text-red-400' : 'text-slate-100'
              }`}
            >
              {latestSample.spo2Pct}
            </span>
            <span className="text-xs font-mono text-slate-400">% SpO2</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-slate-400">Baseline: {activePatient.baselineVitals.spo2Pct}%</span>
            <span
              className={
                latestSample.spo2Pct < 90 ? 'text-red-400 font-semibold' : 'text-emerald-400'
              }
            >
              Z = {latestSample.zScoreSpo2 >= 0 ? `+${latestSample.zScoreSpo2}` : latestSample.zScoreSpo2}
            </span>
          </div>
        </div>

        {/* Continuous Glucose */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>CGM GLUCOSE (0x1808)</span>
            <Droplets className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              data-testid="metric-glucose-mgdl"
              className={`text-3xl font-mono font-bold tabular-nums ${
                latestSample.glucoseMgDl >= 190 ? 'text-amber-400' : 'text-slate-100'
              }`}
            >
              {latestSample.glucoseMgDl}
            </span>
            <span className="text-xs font-mono text-slate-400">mg/dL</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-slate-400">Baseline: {activePatient.baselineVitals.glucoseMgDl} mg/dL</span>
            <span
              className={
                Math.abs(latestSample.zScoreGlucose) >= 2.2
                  ? 'text-amber-400 font-semibold'
                  : 'text-emerald-400'
              }
            >
              Z = {latestSample.zScoreGlucose >= 0 ? `+${latestSample.zScoreGlucose}` : latestSample.zScoreGlucose}
            </span>
          </div>
        </div>

        {/* HRV */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>AUTONOMIC HRV (RMSSD)</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-slate-100 tabular-nums">
              {latestSample.hrvMs}
            </span>
            <span className="text-xs font-mono text-slate-400">ms</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-slate-400">Baseline: {activePatient.baselineVitals.hrvMs} ms</span>
            <span className="text-blue-400">Vagal Tone Nominal</span>
          </div>
        </div>
      </div>

      {/* Main Split: Oscilloscope Telemetry Chart + Anomaly Injection Simulator & Triage Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Live Multi-Trace Oscilloscope Chart + Simulator Buttons */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Multi-Trace Bio-Telemetry Oscilloscope (24s Sliding Window)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Red: Heart Rate (BPM) · Blue: SpO2 (%) · Amber: Continuous Glucose (mg/dL)
                </p>
              </div>
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                Last Tick: {latestSample.timestamp}
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryStream} margin={{ top: 10, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#64748B"
                    tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  />
                  <YAxis
                    stroke="#64748B"
                    domain={[35, 230]}
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
                    y={125}
                    stroke="#EF4444"
                    strokeDasharray="4 4"
                    label={{ value: 'Tachycardia 125 BPM', fill: '#FCA5A5', fontSize: 10 }}
                  />
                  <ReferenceLine
                    y={50}
                    stroke="#EF4444"
                    strokeDasharray="4 4"
                    label={{ value: 'Bradycardia 50 BPM', fill: '#FCA5A5', fontSize: 10 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hrBpm"
                    name="Heart Rate (BPM)"
                    stroke="#EF4444"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="spo2Pct"
                    name="SpO2 (%)"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="glucoseMgDl"
                    name="CGM Glucose (mg/dL)"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Anomaly Injection Simulator Controls */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Physiological Anomaly &amp; ADR Injection Simulator
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Trigger synthetic physiological crises to test Z-score detection and active prescription cross-checking
                </p>
              </div>
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {anomalyButtons.map((btn) => (
                <button
                  key={btn.type}
                  type="button"
                  onClick={() => injectWearableAnomaly(btn.type)}
                  className={`text-left p-3.5 rounded-xl bg-[#090D16] border transition-colors ${btn.tone}`}
                >
                  <div className="text-xs font-semibold">{btn.label}</div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">{btn.subtext}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: High-Priority Doctor Triage Queue */}
        <div className="lg:col-span-5">
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  High-Priority Doctor Triage Queue
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Auto-populated from BLE Z-score anomalies, ADR checks &amp; ML escalations
                </p>
              </div>
              {triageQueue.some((t) => t.acknowledged) && (
                <button
                  type="button"
                  onClick={clearAcknowledgedTriage}
                  className="text-xs font-mono text-slate-400 hover:text-slate-200"
                >
                  Clear Ack&apos;d
                </button>
              )}
            </div>

            <div
              data-testid="triage-incident-list"
              className="space-y-3 max-h-[500px] overflow-y-auto pr-1"
            >
              {triageQueue.length === 0 ? (
                <div className="bg-[#090D16] border border-slate-800 rounded-lg p-6 text-center text-xs text-slate-400">
                  No active triage alerts. Click any Anomaly Simulator button on the left to test real-time incident escalation.
                </div>
              ) : (
                triageQueue.map((inc) => (
                  <div
                    key={inc.id}
                    className={`rounded-xl p-3.5 border transition-colors ${
                      inc.acknowledged
                        ? 'bg-[#090D16]/60 border-slate-800/60 opacity-65'
                        : inc.severity === 'CRITICAL'
                        ? 'bg-red-950/30 border-red-500/50'
                        : 'bg-amber-950/25 border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                      <span
                        className={
                          inc.severity === 'CRITICAL'
                            ? 'text-red-300 font-bold'
                            : 'text-amber-300 font-bold'
                        }
                      >
                        {inc.severity} · {inc.sourceModule}
                      </span>
                      <span className="text-slate-400 tabular-nums">{inc.timestamp}</span>
                    </div>

                    <div className="text-xs font-semibold text-slate-100 mt-1">{inc.title}</div>
                    <div className="text-[11px] font-mono text-slate-300 mt-1 tabular-nums">
                      Patient: {inc.patientName} · {inc.metricSummary}
                    </div>

                    {inc.relatedMedication && (
                      <div className="mt-1.5 text-[11px] font-mono text-red-300 bg-red-950/40 px-2 py-1 rounded border border-red-500/30">
                        Active Rx Match: {inc.relatedMedication}
                      </div>
                    )}

                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {inc.clinicalAction}
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                        ABHA: {inc.abhaId}
                      </span>
                      <button
                        type="button"
                        onClick={() => acknowledgeTriageIncident(inc.id)}
                        disabled={inc.acknowledged}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          inc.acknowledged
                            ? 'bg-slate-800 text-emerald-400 cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{inc.acknowledged ? 'Acknowledged' : 'Acknowledge Triage'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
