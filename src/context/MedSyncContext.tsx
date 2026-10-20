import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  INITIAL_PATIENTS,
  INITIAL_TRIAGE_INCIDENTS,
  PatientProfile,
  FhirRecordBundle
} from '../data/clinicalData';
import {
  MedicationItem,
  WearableSample,
  TriageIncident,
  evaluateWearableAnomaly,
  generateSha256Signature
} from '../utils/clinicalAlgorithms';

export type ActiveTabId = 'allergy-ocr' | 'cds-rx' | 'wearable-ble' | 'predictive-ml' | 'abdm-ehs';

export type AnomalyInjectionType =
  | 'TACHYCARDIA'
  | 'HYPOXIA'
  | 'GLYCEMIC_SURGE'
  | 'BRADYCARDIA_ADR';

interface MedSyncContextValue {
  activeTab: ActiveTabId;
  setActiveTab: (tab: ActiveTabId) => void;
  patients: PatientProfile[];
  activePatientId: string;
  activePatient: PatientProfile;
  selectPatient: (id: string) => void;
  // Module 1: Allergy Matrix actions
  addPatientAllergen: (allergen: string) => void;
  removePatientAllergen: (allergen: string) => void;
  // Module 2: Prescription Signing -> Updates Active Meds (Mod 3) & ABDM Timeline (Mod 5)
  signAndPushPrescription: (
    draftMeds: MedicationItem[],
    clinicalNotes: string
  ) => { sha256Hash: string; bundleId: string };
  // Module 3: Wearable BLE Telemetry & Triage Queue
  isBleStreaming: boolean;
  setIsBleStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  telemetryStream: WearableSample[];
  latestWearableEval: ReturnType<typeof evaluateWearableAnomaly>;
  injectWearableAnomaly: (type: AnomalyInjectionType) => void;
  triageQueue: TriageIncident[];
  acknowledgeTriageIncident: (id: string) => void;
  clearAcknowledgedTriage: () => void;
  pushTriageIncident: (incident: Omit<TriageIncident, 'id' | 'timestamp' | 'acknowledged'>) => void;
  // Module 5: ABDM Consent & HIU Fetch state
  abdmSyncedPatients: Record<string, boolean>;
  syncExternalAbdmRecords: (patientId: string, consentArtifactId: string) => void;
}

const MedSyncContext = createContext<MedSyncContextValue | null>(null);

function formatTimeIst(date: Date): string {
  return date.toTimeString().split(' ')[0] + ' IST';
}

function buildInitialTelemetry(patient: PatientProfile): WearableSample[] {
  const base = patient.baselineVitals;
  const now = Date.now();
  const samples: WearableSample[] = [];
  for (let i = 19; i >= 0; i--) {
    const t = new Date(now - i * 1000);
    const wave = Math.sin(i * 0.6);
    const hr = Math.round(base.hrBpm + wave * 2.2);
    const spo2 = Math.min(100, Math.max(94, Math.round(base.spo2Pct + Math.cos(i * 0.5) * 0.6)));
    const glu = Math.round(base.glucoseMgDl + Math.sin(i * 0.3) * 2.5);
    const hrv = Math.round(base.hrvMs + Math.cos(i * 0.4) * 3);
    samples.push({
      timestamp: t.toTimeString().split(' ')[0],
      epochMs: t.getTime(),
      hrBpm: hr,
      spo2Pct: spo2,
      glucoseMgDl: glu,
      hrvMs: hrv,
      zScoreHr: Number((wave * 0.7).toFixed(2)),
      zScoreSpo2: 0.1,
      zScoreGlucose: Number((Math.sin(i * 0.3) * 0.6).toFixed(2))
    });
  }
  return samples;
}

export const MedSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<ActiveTabId>('allergy-ocr');
  const setActiveTab = (tab: ActiveTabId) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };
  const [patients, setPatients] = useState<PatientProfile[]>(INITIAL_PATIENTS);
  const [activePatientId, setActivePatientId] = useState<string>(INITIAL_PATIENTS[0].id);
  const [isBleStreaming, setIsBleStreaming] = useState<boolean>(true);
  const [triageQueue, setTriageQueue] = useState<TriageIncident[]>(INITIAL_TRIAGE_INCIDENTS);
  const [abdmSyncedPatients, setAbdmSyncedPatients] = useState<Record<string, boolean>>({});

  const activePatient = useMemo(
    () => patients.find((p) => p.id === activePatientId) || patients[0],
    [patients, activePatientId]
  );

  const [telemetryStream, setTelemetryStream] = useState<WearableSample[]>(() =>
    buildInitialTelemetry(INITIAL_PATIENTS[0])
  );

  // Track active anomaly override for a few ticks when injected so the chart visibly spikes/drops
  const pendingAnomalyRef = useRef<{ type: AnomalyInjectionType; remainingTicks: number } | null>(null);

  const selectPatient = (id: string) => {
    const target = patients.find((p) => p.id === id);
    if (!target) return;
    pendingAnomalyRef.current = null;
    setActivePatientId(id);
    setTelemetryStream(buildInitialTelemetry(target));
  };

  const addPatientAllergen = (allergen: string) => {
    const trimmed = allergen.trim();
    if (!trimmed) return;
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== activePatientId) return p;
        if (p.allergies.some((a) => a.toLowerCase() === trimmed.toLowerCase())) return p;
        return { ...p, allergies: [...p.allergies, trimmed] };
      })
    );
  };

  const removePatientAllergen = (allergen: string) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== activePatientId) return p;
        return { ...p, allergies: p.allergies.filter((a) => a !== allergen) };
      })
    );
  };

  const pushTriageIncident = (
    incident: Omit<TriageIncident, 'id' | 'timestamp' | 'acknowledged'>
  ) => {
    const newInc: TriageIncident = {
      ...incident,
      id: `trig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: formatTimeIst(new Date()),
      acknowledged: false
    };
    setTriageQueue((prev) => [newInc, ...prev.slice(0, 19)]);
  };

  const acknowledgeTriageIncident = (id: string) => {
    setTriageQueue((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, acknowledged: true } : inc))
    );
  };

  const clearAcknowledgedTriage = () => {
    setTriageQueue((prev) => prev.filter((inc) => !inc.acknowledged));
  };

  const signAndPushPrescription = (draftMeds: MedicationItem[], clinicalNotes: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' IST';
    const payload = `ABHA:${activePatient.abhaId}|PT:${activePatient.name}|MEDS:${draftMeds
      .map((m) => `${m.name}(${m.rxcui})`)
      .join(',')}|TS:${nowStr}`;
    const sha256Hash = generateSha256Signature(payload);
    const bundleId = `fhir-rx-${Date.now().toString().slice(-6)}`;

    const newFhirBundle: FhirRecordBundle = {
      id: bundleId,
      hiType: 'Prescription',
      title: `Digital e-Prescription (${draftMeds.map((d) => d.name).join(' + ')})`,
      facilityName: 'MedSync Precision Care Portal (HIP-RJ-MEDSYNC-01)',
      facilityHipId: 'HIP-RJ-MEDSYNC-01',
      department: 'Precision Internal Medicine & Clinical Pharmacology',
      authoredDate: nowStr,
      doctorName: 'Dr. Siddharth Rathore, MD (Clinical Pharmacology)',
      summary:
        clinicalNotes.trim() ||
        `CDS-verified prescription signed and pushed to ABHA Locker. Active medications updated across BLE Wearable ADR surveillance.`,
      keyMetrics: draftMeds.map((m) => ({
        label: m.name,
        value: `${m.frequency} · RxCUI ${m.rxcui}`,
        status: 'NORMAL'
      })),
      sha256Hash,
      encryptionCipher: 'AES-256-GCM / ECDH Curve25519 (Fidelius ABDM)',
      consentArtifactId: `CA-RX-${Date.now().toString().slice(-5)}`,
      fhirResourceJson: {
        resourceType: 'Bundle',
        id: bundleId,
        type: 'document',
        timestamp: new Date().toISOString(),
        meta: {
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/PrescriptionRecord'],
          security: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R' }]
        },
        signature: {
          type: [{ system: 'urn:iso-astm:E1762-95:2013', code: '1.2.840.10065.1.12.1.1' }],
          when: new Date().toISOString(),
          sigFormat: 'application/jose',
          data: sha256Hash
        },
        entry: draftMeds.map((m) => ({
          resource: {
            resourceType: 'MedicationRequest',
            status: 'active',
            intent: 'order',
            medicationCodeableConcept: {
              coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: m.rxcui, display: m.name }]
            },
            dosageInstruction: [{ text: `${m.dosage} — ${m.frequency}` }]
          }
        }))
      }
    };

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== activePatientId) return p;
        // Merge non-duplicate drafted medications into activeMedications
        const existingNames = new Set(p.activeMedications.map((m) => m.name.toLowerCase()));
        const addedMeds = draftMeds.filter((d) => !existingNames.has(d.name.toLowerCase()));
        return {
          ...p,
          activeMedications: [...p.activeMedications, ...addedMeds],
          ehrTimeline: [newFhirBundle, ...p.ehrTimeline]
        };
      })
    );

    return { sha256Hash, bundleId };
  };

  const syncExternalAbdmRecords = (patientId: string, consentArtifactId: string) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        const existingIds = new Set(p.ehrTimeline.map((b) => b.id));
        const newBundles = p.externalHiuRecords
          .filter((b) => !existingIds.has(b.id))
          .map((b) => ({ ...b, consentArtifactId }));
        return {
          ...p,
          ehrTimeline: [...newBundles, ...p.ehrTimeline]
        };
      })
    );
    setAbdmSyncedPatients((prev) => ({ ...prev, [patientId]: true }));
  };

  const createSampleFromTick = (
    prevStream: WearableSample[],
    injectionOverride: AnomalyInjectionType | null
  ): { nextSample: WearableSample; evalOut: ReturnType<typeof evaluateWearableAnomaly> } => {
    const base = activePatient.baselineVitals;
    const now = new Date();
    const tickSeed = now.getSeconds();

    let hrBpm = Math.round(base.hrBpm + Math.sin(tickSeed * 0.7) * 2.5 + (Math.random() - 0.5) * 2);
    let spo2Pct = Math.min(100, Math.max(94, Math.round(base.spo2Pct + Math.cos(tickSeed * 0.4) * 0.6)));
    let glucoseMgDl = Math.round(base.glucoseMgDl + Math.sin(tickSeed * 0.25) * 2.5);
    let hrvMs = Math.round(base.hrvMs + Math.cos(tickSeed * 0.5) * 3);

    if (injectionOverride === 'TACHYCARDIA') {
      hrBpm = 134 + Math.round(Math.random() * 6);
      hrvMs = 19;
    } else if (injectionOverride === 'HYPOXIA') {
      spo2Pct = 85 + Math.round(Math.random() * 2);
      hrBpm = base.hrBpm + 18;
    } else if (injectionOverride === 'GLYCEMIC_SURGE') {
      glucoseMgDl = 214 + Math.round(Math.random() * 8);
    } else if (injectionOverride === 'BRADYCARDIA_ADR') {
      hrBpm = 43 + Math.round(Math.random() * 3);
      hrvMs = 68;
    }

    const windowHistory = prevStream.slice(-15).map((s) => ({
      hrBpm: s.hrBpm,
      spo2Pct: s.spo2Pct,
      glucoseMgDl: s.glucoseMgDl
    }));

    const evalOut = evaluateWearableAnomaly(
      { hrBpm, spo2Pct, glucoseMgDl, hrvMs },
      windowHistory,
      activePatient.activeMedications
    );

    const nextSample: WearableSample = {
      timestamp: now.toTimeString().split(' ')[0],
      epochMs: now.getTime(),
      hrBpm,
      spo2Pct,
      glucoseMgDl,
      hrvMs,
      zScoreHr: evalOut.zScoreHr,
      zScoreSpo2: evalOut.zScoreSpo2,
      zScoreGlucose: evalOut.zScoreGlucose,
      anomalyType: injectionOverride || undefined
    };

    return { nextSample, evalOut };
  };

  // 1-second BLE GATT telemetry streaming loop
  useEffect(() => {
    if (!isBleStreaming) return;
    // Detect headless browser to keep CPU usage light while still updating live
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));
    const intervalMs = isHeadless ? 1500 : 1000;

    const timer = setInterval(() => {
      setTelemetryStream((prev) => {
        let activeType: AnomalyInjectionType | null = null;
        if (pendingAnomalyRef.current && pendingAnomalyRef.current.remainingTicks > 0) {
          activeType = pendingAnomalyRef.current.type;
          pendingAnomalyRef.current.remainingTicks -= 1;
          if (pendingAnomalyRef.current.remainingTicks <= 0) {
            pendingAnomalyRef.current = null;
          }
        }
        const { nextSample } = createSampleFromTick(prev, activeType);
        return [...prev.slice(-23), nextSample];
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isBleStreaming, activePatient]);

  const injectWearableAnomaly = (type: AnomalyInjectionType) => {
    // Sustain anomaly for 4 subsequent ticks so the oscilloscope trace clearly renders the spike/drop
    pendingAnomalyRef.current = { type, remainingTicks: 4 };

    const { nextSample, evalOut } = createSampleFromTick(telemetryStream, type);
    setTelemetryStream((prev) => [...prev.slice(-23), nextSample]);

    if (evalOut.isAnomaly) {
      pushTriageIncident({
        patientId: activePatient.id,
        patientName: activePatient.name,
        abhaId: activePatient.abhaId,
        sourceModule: 'WEARABLE_BLE',
        severity: evalOut.severity === 'CRITICAL' ? 'CRITICAL' : 'MODERATE',
        title: evalOut.title,
        metricSummary: `HR ${nextSample.hrBpm} BPM (Z=${nextSample.zScoreHr}) · SpO2 ${nextSample.spo2Pct}% (Z=${nextSample.zScoreSpo2}) · CGM ${nextSample.glucoseMgDl} mg/dL`,
        zScore:
          type === 'HYPOXIA'
            ? nextSample.zScoreSpo2
            : type === 'GLYCEMIC_SURGE'
            ? nextSample.zScoreGlucose
            : nextSample.zScoreHr,
        relatedMedication: evalOut.relatedMedication,
        clinicalAction: evalOut.clinicalAction
      });
    }
  };

  const latestWearableEval = useMemo(() => {
    const latest = telemetryStream[telemetryStream.length - 1];
    const history = telemetryStream.slice(0, -1).map((s) => ({
      hrBpm: s.hrBpm,
      spo2Pct: s.spo2Pct,
      glucoseMgDl: s.glucoseMgDl
    }));
    if (!latest) {
      return evaluateWearableAnomaly(
        activePatient.baselineVitals,
        [],
        activePatient.activeMedications
      );
    }
    return evaluateWearableAnomaly(
      {
        hrBpm: latest.hrBpm,
        spo2Pct: latest.spo2Pct,
        glucoseMgDl: latest.glucoseMgDl,
        hrvMs: latest.hrvMs
      },
      history,
      activePatient.activeMedications
    );
  }, [telemetryStream, activePatient]);

  return (
    <MedSyncContext.Provider
      value={{
        activeTab,
        setActiveTab,
        patients,
        activePatientId,
        activePatient,
        selectPatient,
        addPatientAllergen,
        removePatientAllergen,
        signAndPushPrescription,
        isBleStreaming,
        setIsBleStreaming,
        telemetryStream,
        latestWearableEval,
        injectWearableAnomaly,
        triageQueue,
        acknowledgeTriageIncident,
        clearAcknowledgedTriage,
        pushTriageIncident,
        abdmSyncedPatients,
        syncExternalAbdmRecords
      }}
    >
      {children}
    </MedSyncContext.Provider>
  );
};

export function useMedSync() {
  const ctx = useContext(MedSyncContext);
  if (!ctx) {
    throw new Error('useMedSync must be used within a MedSyncProvider');
  }
  return ctx;
}
