import { MedicationItem, TriageIncident } from '../utils/clinicalAlgorithms';

export interface FhirRecordBundle {
  id: string;
  hiType: 'Prescription' | 'DiagnosticReport' | 'DischargeSummary';
  title: string;
  facilityName: string;
  facilityHipId: string;
  department: string;
  authoredDate: string;
  doctorName: string;
  summary: string;
  keyMetrics: { label: string; value: string; status: 'NORMAL' | 'WARNING' | 'CRITICAL' }[];
  sha256Hash: string;
  encryptionCipher: string;
  consentArtifactId: string;
  fhirResourceJson: Record<string, unknown>;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  bloodGroup: string;
  abhaId: string;
  abhaAddress: string;
  location: string;
  primaryDiagnosis: string;
  allergies: string[];
  activeMedications: MedicationItem[];
  baselineVitals: {
    hrBpm: number;
    spo2Pct: number;
    glucoseMgDl: number;
    hrvMs: number;
    systolicBp: number;
    diastolicBp: number;
  };
  defaultDrift: {
    glucoseDriftMgDl: number;
    bpVarianceMmHg: number;
    hrCreepBpm: number;
  };
  ehrTimeline: FhirRecordBundle[];
  externalHiuRecords: FhirRecordBundle[];
}

export interface OcrLabelPreset {
  id: string;
  title: string;
  category: 'FMCG Snack' | 'OTC Pharmaceutical' | 'Confectionery' | 'Packaged Dairy/Bakery';
  ocrDistortionNote: string;
  rawOcrText: string;
}

export const OCR_LABEL_PRESETS: OcrLabelPreset[] = [
  {
    id: 'preset-namkeen',
    title: 'Curved Pouch: Masala Bhujia & Nut Mix (FMCG)',
    category: 'FMCG Snack',
    ocrDistortionNote: 'Curved foil reflection · 0/O and 1/I glyph substitution',
    rawOcrText: 'Chickpea Flour (Besan), Hydr0genated Arachis (Peanut) 0il, Tepary Bean Flour, S0ya Lecith1n (INS 322), Iodised Salt, Red Chilli Powder, Tartraz1ne Yellow (E102)'
  },
  {
    id: 'preset-otc-tablet',
    title: 'Blister Strip: Cold & Flu Film-Coated Tablet',
    category: 'OTC Pharmaceutical',
    ocrDistortionNote: 'Metallic emboss glare · Excipient & azo-dye micro-print',
    rawOcrText: 'Paracetam0l IP 500mg, Phenylephrine HCl 10mg, Anhydr0us Lact0se Monohydrate, Maize Starch, Tartraz1ne Yellow (INS 102), Titanium Dioxide'
  },
  {
    id: 'preset-protein-bar',
    title: 'Wrapper: Choco-Malt Energy Granola Bar',
    category: 'Confectionery',
    ocrDistortionNote: 'Crinkled seam warp · Multi-allergen emulsifier tokens',
    rawOcrText: 'Rolled Oats, Malted Barley Extract (Gluten), Dark Cocoa Solids, S0ya Lecith1n (INS 322), Whey Protein Isolate (Milk Solids), Roasted Groundnut Paste'
  },
  {
    id: 'preset-dryfruit-drink',
    title: 'Bottle Label: Spiced Dry-Fruit Badam Thandai Mix',
    category: 'Packaged Dairy/Bakery',
    ocrDistortionNote: 'Cylindrical bottle curvature · Sulfite & dairy codes',
    rawOcrText: 'Sk1mmed M1lk Powder (Lact0se), Cane Sugar, Golden Raisins treated with S0dium Metabisulf1te (E220), Cardamom, Saffron Extracts, Refined Wheat Semolina (Suji)'
  }
];

export const PRESCRIPTION_DRUG_CATALOG: MedicationItem[] = [
  {
    id: 'cat-ibuprofen',
    name: 'Ibuprofen 400mg',
    genericName: 'Ibuprofen',
    dosage: '400mg',
    frequency: 'TID after meals',
    rxcui: '5640',
    drugClass: 'Non-Steroidal Anti-Inflammatory Drug (NSAID)',
    excipients: ['Microcrystalline Cellulose', 'Croscarmellose Sodium']
  },
  {
    id: 'cat-clarithromycin',
    name: 'Clarithromycin 500mg',
    genericName: 'Clarithromycin',
    dosage: '500mg',
    frequency: 'BID x 7 Days',
    rxcui: '21212',
    drugClass: 'Macrolide Antibiotic (CYP3A4 Inhibitor)',
    excipients: ['Tartrazine E102', 'Povidone']
  },
  {
    id: 'cat-spironolactone',
    name: 'Spironolactone 25mg',
    genericName: 'Spironolactone',
    dosage: '25mg',
    frequency: 'OD Morning',
    rxcui: '9997',
    drugClass: 'Aldosterone Receptor Antagonist (K+ Sparing)',
    excipients: ['Lactose Monohydrate', 'Calcium Sulfate']
  },
  {
    id: 'cat-diltiazem',
    name: 'Diltiazem CD 60mg',
    genericName: 'Diltiazem Hydrochloride',
    dosage: '60mg',
    frequency: 'BID',
    rxcui: '3443',
    drugClass: 'Non-Dihydropyridine Calcium Channel Blocker',
    excipients: ['Hypromellose']
  },
  {
    id: 'cat-glimepiride',
    name: 'Glimepiride 2mg',
    genericName: 'Glimepiride',
    dosage: '2mg',
    frequency: 'OD before breakfast',
    rxcui: '25789',
    drugClass: 'Sulfonylurea Insulin Secretagogue',
    excipients: ['Lactose Monohydrate', 'Sodium Starch Glycolate']
  },
  {
    id: 'cat-warfarin',
    name: 'Warfarin 5mg',
    genericName: 'Warfarin Sodium',
    dosage: '5mg',
    frequency: 'OD 18:00 HRS',
    rxcui: '11289',
    drugClass: 'Vitamin K Epoxide Reductase Inhibitor',
    excipients: ['Lactose Monohydrate']
  },
  {
    id: 'cat-atorvastatin',
    name: 'Atorvastatin 20mg',
    genericName: 'Atorvastatin Calcium',
    dosage: '20mg',
    frequency: 'OD Bedtime',
    rxcui: '83367',
    drugClass: 'HMG-CoA Reductase Inhibitor (Statin)',
    excipients: ['Calcium Carbonate', 'Lactose Monohydrate']
  },
  {
    id: 'cat-metoprolol',
    name: 'Metoprolol Succinate XL 50mg',
    genericName: 'Metoprolol Succinate',
    dosage: '50mg',
    frequency: 'OD Morning',
    rxcui: '866427',
    drugClass: 'Beta-1 Selective Adrenoceptor Blocker',
    excipients: ['Ethylcellulose']
  },
  {
    id: 'cat-paracetamol-dye',
    name: 'Paracetamol 500mg (Yellow Film-Coated)',
    genericName: 'Acetaminophen',
    dosage: '500mg',
    frequency: 'Q6H PRN Fever/Pain',
    rxcui: '161',
    drugClass: 'Non-Opioid Analgesic & Antipyretic',
    excipients: ['Tartrazine E102', 'Starch']
  }
];

export const INITIAL_PATIENTS: PatientProfile[] = [
  {
    id: 'pt-rajesh',
    name: 'Rajesh Sharma',
    age: 58,
    gender: 'Male',
    bloodGroup: 'B+',
    abhaId: '91-4829-1049-8271',
    abhaAddress: 'rajesh.sharma58@abdm',
    location: 'Malviya Nagar, Jaipur, RJ',
    primaryDiagnosis: 'Non-Valvular Atrial Fibrillation · Dyslipidemia · Borderline Pre-Diabetes',
    allergies: ['Peanuts', 'Tartrazine E102', 'Soy Lecithin'],
    activeMedications: [
      {
        id: 'med-rj-1',
        name: 'Warfarin 5mg',
        genericName: 'Warfarin Sodium',
        dosage: '5mg',
        frequency: 'OD 18:00 HRS',
        rxcui: '11289',
        drugClass: 'Vitamin K Antagonist Anticoagulant'
      },
      {
        id: 'med-rj-2',
        name: 'Atorvastatin 20mg',
        genericName: 'Atorvastatin Calcium',
        dosage: '20mg',
        frequency: 'OD Bedtime',
        rxcui: '83367',
        drugClass: 'HMG-CoA Reductase Inhibitor (Statin)'
      },
      {
        id: 'med-rj-3',
        name: 'Metoprolol Succinate XL 50mg',
        genericName: 'Metoprolol Succinate',
        dosage: '50mg',
        frequency: 'OD Morning',
        rxcui: '866427',
        drugClass: 'Beta-1 Selective Adrenoceptor Blocker'
      }
    ],
    baselineVitals: {
      hrBpm: 72,
      spo2Pct: 97,
      glucoseMgDl: 108,
      hrvMs: 48,
      systolicBp: 132,
      diastolicBp: 84
    },
    defaultDrift: {
      glucoseDriftMgDl: 18,
      bpVarianceMmHg: 14,
      hrCreepBpm: 8
    },
    ehrTimeline: [
      {
        id: 'fhir-rj-01',
        hiType: 'DiagnosticReport',
        title: 'Coagulation Profile (PT/INR) & Lipid Panel',
        facilityName: 'SMS Medical College & Hospital, Jaipur',
        facilityHipId: 'HIP-RJ-SMS-001',
        department: 'Dept. of Cardiology & Hematology',
        authoredDate: '2026-10-04 09:15 IST',
        doctorName: 'Dr. Arvind Pangariya, MD, DM',
        summary: 'Therapeutic INR maintained on Warfarin 5mg. LDL-C mildly elevated at 112 mg/dL; Fasting Plasma Glucose shows early upward drift.',
        keyMetrics: [
          { label: 'PT / INR', value: '2.4 INR', status: 'NORMAL' },
          { label: 'Fasting Glucose', value: '108 mg/dL', status: 'WARNING' },
          { label: 'LDL Cholesterol', value: '112 mg/dL', status: 'WARNING' }
        ],
        sha256Hash: '8f3b219c04e71a9d88e25c4b9123a6f07d8e9102c4b5a67890123456789abcde',
        encryptionCipher: 'AES-256-GCM / ECDH Curve25519 (Fidelius ABDM)',
        consentArtifactId: 'CA-ABDM-2026-99104',
        fhirResourceJson: {
          resourceType: 'Bundle',
          type: 'document',
          id: 'fhir-rj-01',
          meta: { profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle'] },
          identifier: { system: 'https://abdm.gov.in/hip/sms-jaipur', value: 'LAB-2026-88412' },
          status: 'final'
        }
      }
    ],
    externalHiuRecords: [
      {
        id: 'fhir-rj-ext-1',
        hiType: 'DischargeSummary',
        title: '24-Hour Holter & Paroxysmal AFib Stabilization',
        facilityName: 'AIIMS New Delhi (Cardiothoracic Center)',
        facilityHipId: 'HIP-DL-AIIMS-104',
        department: 'Electrophysiology & Arrhythmia Unit',
        authoredDate: '2026-08-19 16:40 IST',
        doctorName: 'Dr. Randeep Guleria / Dr. S. K. Sharma',
        summary: 'Rate-controlled on Metoprolol XL 50mg + anticoagulated with Warfarin 5mg. Documented IgE hypersensitivity to Arachis (Peanuts) and Tartrazine E102 dye.',
        keyMetrics: [
          { label: 'CHA2DS2-VASc Score', value: '3 Points', status: 'WARNING' },
          { label: 'LVEF (2D Echo)', value: '58%', status: 'NORMAL' },
          { label: 'IgE Peanut / E102', value: 'Positive (Class 4)', status: 'CRITICAL' }
        ],
        sha256Hash: '3a7e91bc44d0192f67a8c50129384756abcdef0192837465fabcde1234567890',
        encryptionCipher: 'AES-256-GCM / ECDH Curve25519 (Fidelius ABDM)',
        consentArtifactId: 'CA-ABDM-2026-HIU-LIVE',
        fhirResourceJson: {
          resourceType: 'Bundle',
          type: 'document',
          id: 'fhir-rj-ext-1',
          meta: { profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DischargeSummaryRecord'] },
          custodian: 'AIIMS New Delhi HIP Node'
        }
      },
      {
        id: 'fhir-rj-ext-2',
        hiType: 'DiagnosticReport',
        title: 'Comprehensive Metabolic & HbA1c Longitudinal Panel',
        facilityName: 'Fortis Escorts Hospital, Jaipur',
        facilityHipId: 'HIP-RJ-FORTIS-208',
        department: 'Preventive Endocrinology',
        authoredDate: '2026-09-14 11:20 IST',
        doctorName: 'Dr. Meenakshi Choudhary, MD',
        summary: 'HbA1c at 6.1% (Pre-diabetic variance band). Serum creatinine 0.94 mg/dL, eGFR 86 mL/min/1.73m2.',
        keyMetrics: [
          { label: 'HbA1c (HPLC)', value: '6.1%', status: 'WARNING' },
          { label: 'Serum K+', value: '4.3 mEq/L', status: 'NORMAL' },
          { label: 'hs-CRP', value: '2.1 mg/L', status: 'WARNING' }
        ],
        sha256Hash: 'c450918273645fedcba98765432100123456789abcdef9988776655443322110',
        encryptionCipher: 'AES-256-GCM / ECDH Curve25519 (Fidelius ABDM)',
        consentArtifactId: 'CA-ABDM-2026-HIU-LIVE',
        fhirResourceJson: {
          resourceType: 'Bundle',
          type: 'document',
          id: 'fhir-rj-ext-2',
          meta: { profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportLab'] },
          custodian: 'Fortis Escorts Jaipur HIP Node'
        }
      }
    ]
  },
  {
    id: 'pt-priya',
    name: 'Priya Nair',
    age: 42,
    gender: 'Female',
    bloodGroup: 'O+',
    abhaId: '91-7392-5510-3914',
    abhaAddress: 'priya.nair42@abdm',
    location: 'Indiranagar, Bengaluru / Jaipur Transit',
    primaryDiagnosis: 'Type 2 Diabetes Mellitus (Early) · Essential Hypertension · Celiac Gluten Enteropathy',
    allergies: ['Gluten', 'Lactose', 'Sulfites'],
    activeMedications: [
      {
        id: 'med-pn-1',
        name: 'Metformin SR 500mg',
        genericName: 'Metformin Hydrochloride',
        dosage: '500mg',
        frequency: 'BID with Meals',
        rxcui: '860975',
        drugClass: 'Biguanide Antihyperglycemic'
      },
      {
        id: 'med-pn-2',
        name: 'Telmisartan 40mg',
        genericName: 'Telmisartan',
        dosage: '40mg',
        frequency: 'OD Morning',
        rxcui: '73494',
        drugClass: 'Angiotensin II Receptor Blocker (ARB)'
      }
    ],
    baselineVitals: {
      hrBpm: 76,
      spo2Pct: 98,
      glucoseMgDl: 124,
      hrvMs: 54,
      systolicBp: 136,
      diastolicBp: 86
    },
    defaultDrift: {
      glucoseDriftMgDl: 24,
      bpVarianceMmHg: 16,
      hrCreepBpm: 6
    },
    ehrTimeline: [
      {
        id: 'fhir-pn-01',
        hiType: 'DiagnosticReport',
        title: 'Tissue Transglutaminase IgA (tTG-IgA) & CGM Profile',
        facilityName: 'SMS Hospital Jaipur — Gastroenterology & Endocrinology',
        facilityHipId: 'HIP-RJ-SMS-001',
        department: 'Clinical Immunology & Metabolism',
        authoredDate: '2026-10-08 10:30 IST',
        doctorName: 'Dr. S. K. Sharma, MD',
        summary: 'Confirmed Gluten sensitivity and severe primary hypolactasia. Strict avoidance of wheat/maida and lactose-monohydrate tablet fillers advised.',
        keyMetrics: [
          { label: 'tTG-IgA', value: '68 U/mL', status: 'CRITICAL' },
          { label: 'Time-in-Range (CGM)', value: '74%', status: 'WARNING' },
          { label: 'Serum Potassium', value: '4.6 mEq/L', status: 'NORMAL' }
        ],
        sha256Hash: '7b112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
        encryptionCipher: 'AES-256-GCM / ECDH Curve25519 (Fidelius ABDM)',
        consentArtifactId: 'CA-ABDM-2026-77310',
        fhirResourceJson: {
          resourceType: 'Bundle',
          type: 'document',
          id: 'fhir-pn-01',
          meta: { profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle'] }
        }
      }
    ],
    externalHiuRecords: [
      {
        id: 'fhir-pn-ext-1',
        hiType: 'DischargeSummary',
        title: 'Sulfite-Triggered Bronchospasm Observation Summary',
        facilityName: 'AIIMS New Delhi (Pulmonology & Allergy Clinic)',
        facilityHipId: 'HIP-DL-AIIMS-104',
        department: 'Pulmonary Medicine',
        authoredDate: '2026-07-22 14:15 IST',
        doctorName: 'Dr. Anant Mohan, MD',
        summary: 'Acute wheezing episode following ingestion of E220 sulfite-preserved beverage. Resolved with nebulized salbutamol. Added Sulfites (INS 220/223) to ABHA Allergy Registry.',
        keyMetrics: [
          { label: 'FEV1 / FVC Post-BD', value: '84%', status: 'NORMAL' },
          { label: 'Allergen Trigger', value: 'INS 220 Sulfites', status: 'CRITICAL' }
        ],
        sha256Hash: '99887766554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa',
        encryptionCipher: 'AES-256-GCM / ECDH Curve25519 (Fidelius ABDM)',
        consentArtifactId: 'CA-ABDM-2026-HIU-LIVE',
        fhirResourceJson: {
          resourceType: 'Bundle',
          type: 'document',
          id: 'fhir-pn-ext-1',
          custodian: 'AIIMS New Delhi HIP Node'
        }
      }
    ]
  },
  {
    id: 'pt-vikram',
    name: 'Vikramaditya Singh',
    age: 64,
    gender: 'Male',
    bloodGroup: 'A+',
    abhaId: '91-6104-8823-4190',
    abhaAddress: 'vikramaditya.singh64@abdm',
    location: 'C-Scheme, Jaipur, RJ',
    primaryDiagnosis: 'Coronary Artery Disease (Post-PCI) · Stage-1 Hypertension · OSA Risk',
    allergies: ['Soy Lecithin', 'Shellfish', 'Peanuts'],
    activeMedications: [
      {
        id: 'med-vs-1',
        name: 'Atorvastatin 20mg',
        genericName: 'Atorvastatin Calcium',
        dosage: '20mg',
        frequency: 'OD Bedtime',
        rxcui: '83367',
        drugClass: 'HMG-CoA Reductase Inhibitor (Statin)'
      },
      {
        id: 'med-vs-2',
        name: 'Ramipril 5mg',
        genericName: 'Ramipril',
        dosage: '5mg',
        frequency: 'OD Morning',
        rxcui: '35296',
        drugClass: 'ACE Inhibitor'
      },
      {
        id: 'med-vs-3',
        name: 'Propranolol LA 40mg',
        genericName: 'Propranolol Hydrochloride',
        dosage: '40mg',
        frequency: 'OD Morning',
        rxcui: '8787',
        drugClass: 'Non-Selective Beta-Adrenoceptor Blocker'
      }
    ],
    baselineVitals: {
      hrBpm: 66,
      spo2Pct: 95,
      glucoseMgDl: 102,
      hrvMs: 41,
      systolicBp: 138,
      diastolicBp: 88
    },
    defaultDrift: {
      glucoseDriftMgDl: 12,
      bpVarianceMmHg: 19,
      hrCreepBpm: 11
    },
    ehrTimeline: [
      {
        id: 'fhir-vs-01',
        hiType: 'DiagnosticReport',
        title: 'Coronary CT Angiography & Sleep Oximetry Screening',
        facilityName: 'Fortis Escorts Hospital, Jaipur',
        facilityHipId: 'HIP-RJ-FORTIS-208',
        department: 'Interventional Cardiology',
        authoredDate: '2026-09-29 15:10 IST',
        doctorName: 'Dr. R. K. Tongia, MD, DM',
        summary: 'Patent LAD drug-eluting stent. Mild nocturnal SpO2 dips noted on home pulse oximetry; avoid CYP3A4 inhibitors with high-dose statin.',
        keyMetrics: [
          { label: 'LAD Stent Patency', value: '100% Patent', status: 'NORMAL' },
          { label: 'Nocturnal SpO2 Nadir', value: '91%', status: 'WARNING' },
          { label: 'Resting Sinus HR', value: '66 BPM', status: 'NORMAL' }
        ],
        sha256Hash: '44556677889900112233445566778899aabbccddeeff00112233445566778899',
        encryptionCipher: 'AES-256-GCM / ECDH Curve25519 (Fidelius ABDM)',
        consentArtifactId: 'CA-ABDM-2026-61049',
        fhirResourceJson: {
          resourceType: 'Bundle',
          type: 'document',
          id: 'fhir-vs-01',
          custodian: 'Fortis Escorts Jaipur HIP Node'
        }
      }
    ],
    externalHiuRecords: [
      {
        id: 'fhir-vs-ext-1',
        hiType: 'Prescription',
        title: 'Post-Angioplasty Secondary Prevention Protocol',
        facilityName: 'AIIMS New Delhi (Cardiology OPD)',
        facilityHipId: 'HIP-DL-AIIMS-104',
        department: 'Cardiology',
        authoredDate: '2026-06-11 11:00 IST',
        doctorName: 'Dr. Ambuj Roy, MD, DM',
        summary: 'Long-term statin + beta-blocker + ACE inhibitor regimen. Contraindicated with macrolide antibiotics (Clarithromycin) and potassium-sparing diuretics.',
        keyMetrics: [
          { label: 'Target LDL-C', value: '<55 mg/dL', status: 'NORMAL' },
          { label: 'Resting BP Goal', value: '<130/80 mmHg', status: 'WARNING' }
        ],
        sha256Hash: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
        encryptionCipher: 'AES-256-GCM / ECDH Curve25519 (Fidelius ABDM)',
        consentArtifactId: 'CA-ABDM-2026-HIU-LIVE',
        fhirResourceJson: {
          resourceType: 'Bundle',
          type: 'document',
          id: 'fhir-vs-ext-1',
          custodian: 'AIIMS New Delhi HIP Node'
        }
      }
    ]
  }
];

export const INITIAL_TRIAGE_INCIDENTS: TriageIncident[] = [
  {
    id: 'trig-init-1',
    patientId: 'pt-rajesh',
    patientName: 'Rajesh Sharma',
    abhaId: '91-4829-1049-8271',
    timestamp: '11:32:18 IST',
    sourceModule: 'PREDICTIVE_ML',
    severity: 'MODERATE',
    title: '60-Day Fasting Glycemic Variance Drift (+18 mg/dL)',
    metricSummary: 'Fasting Glucose 108 mg/dL · Variance Score 46.2',
    clinicalAction: 'Schedule HbA1c & HOMA-IR check; verify Warfarin dietary Vitamin K stability.',
    acknowledged: false
  }
];
