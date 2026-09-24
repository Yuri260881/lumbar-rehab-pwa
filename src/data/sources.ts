import type { SourceRef } from '../types';

/**
 * Single registry of the medical sources used across the app.
 *
 * Every entry was opened and read on the access date shown. Sources are
 * national health services, professional societies, academic medical centres
 * or peer-reviewed publications. Consumer blogs are deliberately not used.
 *
 * If a link stops working, the app keeps working offline — but the citation
 * should be re-checked and the date updated.
 */

const ACCESSED = '2026-09-24';

export const SOURCES = {
  nhsSciatica: {
    organisation: 'NHS (Великобритания)',
    title: 'Sciatica',
    url: 'https://www.nhs.uk/conditions/sciatica/',
    accessedOn: ACCESSED,
  },
  nhsBackPain: {
    organisation: 'NHS (Великобритания)',
    title: 'Back pain',
    url: 'https://www.nhs.uk/conditions/back-pain/',
    accessedOn: ACCESSED,
  },
  nhsSlippedDisc: {
    organisation: 'NHS (Великобритания)',
    title: 'Slipped disc',
    url: 'https://www.nhs.uk/conditions/slipped-disc/',
    accessedOn: ACCESSED,
  },
  nhsSciaticaExercises: {
    organisation: 'NHS (Великобритания)',
    title: 'Exercises for sciatica problems',
    url: 'https://www.nhs.uk/live-well/exercise/exercises-sciatica-problems/',
    accessedOn: ACCESSED,
  },
  nhsInformSciatica: {
    organisation: 'NHS inform (Шотландия)',
    title: 'Sciatica — when to get professional advice',
    url: 'https://www.nhsinform.scot/illnesses-and-conditions/muscle-bone-and-joints/neck-and-back-problems-and-conditions/sciatica/',
    accessedOn: ACCESSED,
  },
  nbtCaudaEquina: {
    organisation: 'North Bristol NHS Trust — Neurosurgery',
    title: 'Cauda Equina Syndrome (CES): when to seek urgent advice',
    url: 'https://www.nbt.nhs.uk/our-services/a-z-services/neurosurgery/neurosurgery-patient-information/same-day-emergency-clinic-sdec-cauda-equina-syndrome-sec',
    accessedOn: ACCESSED,
  },
  mskDorsetLegPain: {
    organisation: 'MSK Dorset (NHS физиотерапевтическая служба)',
    title: 'Low back related leg pain — Sciatica: exercises',
    url: 'https://www.mskdorset.nhs.uk/back-pain_1/back-pain-leg-pain-sciatica/',
    accessedOn: ACCESSED,
  },
  mskDorsetLowBack: {
    organisation: 'MSK Dorset (NHS физиотерапевтическая служба)',
    title: 'Back pain — Low back pain: exercises, keeping active, advice for at home',
    url: 'https://www.mskdorset.nhs.uk/back-pain_1/back-pain-low-back-pain/',
    accessedOn: ACCESSED,
  },
  nhsAaaBackPainExercises: {
    organisation: 'NHS Ayrshire & Arran (MSK Patient Portal)',
    title: 'Low Back Pain Exercises (MSK Patient Portal)',
    url: 'https://www.nhsaaa.net/musculoskeletal-msk-service-patient-portal/low-back-pain-msk-patient-portal/low-back-pain-exercises-msk-patient-portal/',
    accessedOn: ACCESSED,
  },
  stGeorgesBackPainAdvice: {
    organisation: 'St George’s University Hospitals NHS Foundation Trust',
    title: 'Emergency Department Back Pain Advice (patient leaflet, PDF)',
    url: 'https://www.stgeorges.nhs.uk/wp-content/uploads/2023/07/AAE_BPA.pdf',
    accessedOn: ACCESSED,
  },
  niceNg59: {
    organisation: 'NICE (Великобритания)',
    title: 'Low back pain and sciatica in over 16s: assessment and management (NG59)',
    url: 'https://www.nice.org.uk/guidance/ng59',
    accessedOn: ACCESSED,
  },
  mayoBackExercises: {
    organisation: 'Mayo Clinic',
    title: 'Back exercises in 15 minutes a day',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/back-pain/art-20546859',
    accessedOn: ACCESSED,
  },
  mayoSciaticaTreatment: {
    organisation: 'Mayo Clinic',
    title: 'Sciatica — Diagnosis and treatment (Lifestyle and home remedies)',
    url: 'https://www.mayoclinic.org/diseases-conditions/sciatica/diagnosis-treatment/drc-20377441',
    accessedOn: ACCESSED,
  },
  aaosHerniatedDisk: {
    organisation: 'AAOS OrthoInfo',
    title: 'Herniated Disk in the Lower Back',
    url: 'https://orthoinfo.aaos.org/en/diseases--conditions/herniated-disk-in-the-lower-back/',
    accessedOn: ACCESSED,
  },
  aaosLowBackPain: {
    organisation: 'AAOS OrthoInfo',
    title: 'Low Back Pain',
    url: 'https://orthoinfo.aaos.org/en/diseases--conditions/low-back-pain/',
    accessedOn: ACCESSED,
  },
  aaosSpineConditioning: {
    organisation: 'AAOS OrthoInfo',
    title: 'Spine Conditioning Program',
    url: 'https://orthoinfo.aaos.org/en/recovery/spine-conditioning-program/',
    accessedOn: ACCESSED,
  },
  aansHerniatedDisc: {
    organisation: 'AANS (American Association of Neurological Surgeons)',
    title: 'Herniated Disc (обновлено 20 марта 2024)',
    url: 'https://www.aans.org/patients/conditions-treatments/herniated-disc/',
    accessedOn: ACCESSED,
  },
  clevelandHerniated: {
    organisation: 'Cleveland Clinic',
    title: 'Herniated Disk (Bulging Disk): Symptoms & Treatment',
    url: 'https://my.clevelandclinic.org/health/diseases/12768-herniated-disk',
    accessedOn: ACCESSED,
  },
  clevelandPiriformis: {
    organisation: 'Cleveland Clinic',
    title: 'Piriformis Syndrome: Symptoms, Causes and Treatment',
    url: 'https://my.clevelandclinic.org/health/diseases/23495-piriformis-syndrome',
    accessedOn: ACCESSED,
  },
  acp2017: {
    organisation: 'American College of Physicians',
    title:
      'Qaseem A, Wilt TJ, McLean RM, Forciea MA. Noninvasive Treatments for Acute, Subacute, and Chronic Low Back Pain: A Clinical Practice Guideline. Ann Intern Med. 2017;166(7):514–530',
    url: 'https://www.acpjournals.org/doi/10.7326/M16-2367',
    accessedOn: ACCESSED,
  },
  wfnsConservative: {
    organisation: 'WFNS Spine Committee (рецензируемая публикация, PMC)',
    title: 'The role of conservative treatment in lumbar disc herniations: WFNS spine committee recommendations',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10882128/',
    accessedOn: ACCESSED,
  },
  narrativeReviewLdhr: {
    organisation: 'Peer-reviewed narrative review (PMC)',
    title: 'Non-Surgical Approaches to the Management of Lumbar Disc Herniation Associated with Radiculopathy',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10888666/',
    accessedOn: ACCESSED,
  },
  exerciseTherapyMeta: {
    organisation: 'Систематический обзор и мета-анализ РКИ (PMC)',
    title: 'Clinical efficacy of exercise therapy for lumbar disc herniation: a systematic review and meta-analysis of randomized controlled trials',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11985520/',
    accessedOn: ACCESSED,
  },
  /**
   * Secondary review of inversion therapy. Used ONLY to justify the
   * contraindication and stop-signal lists in the inversion module — never as
   * a recommendation to use an inversion table.
   */
  inversionRisks: {
    organisation: 'Medical News Today (вторичный обзор рисков инверсии)',
    title: 'What are the benefits and risks of hanging upside down (inversion therapy)?',
    url: 'https://www.medicalnewstoday.com/articles/hanging-upside-down',
    accessedOn: ACCESSED,
  },
  mcgill1998: {
    organisation: 'McGill SM. (первичная научная публикация)',
    title:
      'Low back stability: from formal description to issues for performance. Exerc Sport Sci Rev. 1998;26:147–173 (концепция щадящих позвоночник изометрических удержаний; популяризирована в книге «Back Mechanic»)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/9476265/',
    accessedOn: ACCESSED,
  },
} as const satisfies Record<string, SourceRef>;

export type SourceKey = keyof typeof SOURCES;

export function source(...keys: SourceKey[]): SourceRef[] {
  return keys.map((key) => SOURCES[key]);
}

export const ALL_SOURCES: SourceRef[] = Object.values(SOURCES);
