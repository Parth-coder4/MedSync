import test from 'node:test';
import assert from 'node:assert/strict';
import {
  levenshteinDistance,
  computeFuzzySimilarity,
  scanIngredientsAgainstAllergies,
  evaluatePrescriptionSafety,
  calculateZScore,
  evaluateWearableAnomaly,
  computeLongitudinalRisk,
  generateSha256Signature
} from './clinicalAlgorithms.ts';

test('levenshteinDistance computes exact edit distance', () => {
  assert.equal(levenshteinDistance('arachis', 'arachis'), 0);
  assert.equal(levenshteinDistance('peanut', 'peanuts'), 1);
  assert.equal(levenshteinDistance('tartrazine', 'tartraz1ne'), 1);
});

test('scanIngredientsAgainstAllergies detects noisy OCR allergens and returns dietitian alternatives', () => {
  const report = scanIngredientsAgainstAllergies(
    'Refined Wheat Flour, Hydr0genated Arachis (Peanut) 0il, S0ya Lecith1n (INS 322), Salt',
    ['Peanuts', 'Soy Lecithin']
  );
  assert.equal(report.overallStatus, 'DANGER');
  assert.ok(report.flaggedAllergens.includes('Peanuts'));
  assert.ok(report.flaggedAllergens.includes('Soy Lecithin'));
  assert.ok(report.maxSimilarity >= 80);
  assert.equal(report.dietitianAlternatives.length, 3);
});

test('evaluatePrescriptionSafety flags Warfarin + Ibuprofen critical Drug-Drug and Vitamin K Drug-Food interactions', () => {
  const activeMeds = [
    {
      id: 'm1',
      name: 'Warfarin 5mg',
      genericName: 'Warfarin Sodium',
      dosage: '5mg',
      frequency: 'OD Evening',
      rxcui: '11289',
      drugClass: 'Vitamin K Antagonist Anticoagulant'
    }
  ];
  const draftMeds = [
    {
      id: 'd1',
      name: 'Ibuprofen 400mg',
      genericName: 'Ibuprofen',
      dosage: '400mg',
      frequency: 'TID',
      rxcui: '5640',
      drugClass: 'NSAID'
    }
  ];
  const alerts = evaluatePrescriptionSafety(draftMeds, activeMeds, ['Peanuts']);
  const criticalDdi = alerts.find((a) => a.id === 'ddi-warfarin-ibuprofen');
  const vitKDfi = alerts.find((a) => a.id === 'dfi-warfarin-vitk');
  assert.ok(criticalDdi);
  assert.equal(criticalDdi.severity, 'CRITICAL');
  assert.ok(criticalDdi.safeAlternative);
  assert.ok(vitKDfi);
});

test('calculateZScore and evaluateWearableAnomaly detect beta-blocker bradycardia ADR', () => {
  const history = Array.from({ length: 15 }, (_, i) => ({
    hrBpm: 72 + (i % 3),
    spo2Pct: 98,
    glucoseMgDl: 105
  }));
  const activeMeds = [
    {
      id: 'bb1',
      name: 'Metoprolol Succinate 50mg',
      genericName: 'Metoprolol',
      dosage: '50mg',
      frequency: 'OD',
      rxcui: '866427',
      drugClass: 'Beta-1 Selective Adrenoceptor Blocker'
    }
  ];
  const evalResult = evaluateWearableAnomaly(
    { hrBpm: 44, spo2Pct: 97, glucoseMgDl: 106, hrvMs: 62 },
    history,
    activeMeds
  );
  assert.equal(evalResult.isAnomaly, true);
  assert.equal(evalResult.severity, 'CRITICAL');
  assert.ok(evalResult.title.includes('Bradycardia ADR'));
  assert.ok(evalResult.relatedMedication?.includes('Metoprolol'));
  assert.ok(evalResult.zScoreHr < -3);
});

test('computeLongitudinalRisk calculates 30/60/90 day variance and probabilities', () => {
  const res = computeLongitudinalRisk(
    60,
    { fastingGlucose: 106, systolicBp: 132, restingHr: 76 },
    { glucoseDriftMgDl: 22, bpVarianceMmHg: 16, hrCreepBpm: 10 }
  );
  assert.ok(res.series.length > 10);
  assert.ok(res.preDiabetesProbability > 50);
  assert.ok(res.hypertensionRisk > 50);
  assert.ok(res.varianceScore > 10);
});

test('generateSha256Signature generates valid 64-character hex digest', () => {
  const sig = generateSha256Signature('ABHA:91-4829-1049-8271|RX:Warfarin');
  assert.equal(sig.length, 64);
  assert.match(sig, /^[0-9a-f]{64}$/);
});
