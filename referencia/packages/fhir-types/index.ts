/**
 * HL7 FHIR v4.0.1 Core Types for Abundance Clinic OS
 * Resources: Patient, Encounter, Observation, ClinicalImpression
 * Includes Compliance, Human-in-the-Loop Validation & GHL v2 Bindings
 */

export type FHIRAdministrativeGender = 'male' | 'female' | 'other' | 'unknown';

export interface FHIRCoding {
  system: string;
  version?: string;
  code: string;
  display: string;
}

export interface FHIRCodeableConcept {
  coding: FHIRCoding[];
  text?: string;
}

export interface FHIRHumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family: string;
  given: string[];
  prefix?: string[];
  suffix?: string[];
}

export interface FHIRContactPoint {
  system: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  rank?: number;
}

export interface FHIRAddress {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  type?: 'postal' | 'physical' | 'both';
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface FHIRIdentifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary';
  type?: FHIRCodeableConcept;
  system: string; // e.g. "urn:oid:abundance:mrn"
  value: string;
}

// 1. FHIR Patient Resource
export interface FHIRPatient {
  id: string; // UUID
  tenantId: string; // Multitenant scoping
  resourceType: 'Patient';
  active: boolean;
  identifier: FHIRIdentifier[];
  name: FHIRHumanName[];
  telecom: FHIRContactPoint[];
  gender: FHIRAdministrativeGender;
  birthDate: string; // YYYY-MM-DD
  address?: FHIRAddress[];
  ghlContactId?: string; // GHL v2 Contact ID
  createdAt: string;
  updatedAt: string;
}

// 2. FHIR Encounter Resource
export type FHIREncounterStatus =
  | 'planned'
  | 'arrived'
  | 'triaged'
  | 'in-progress'
  | 'onleave'
  | 'finished'
  | 'cancelled'
  | 'entered-in-error';

export interface FHIREncounter {
  id: string;
  tenantId: string;
  resourceType: 'Encounter';
  status: FHIREncounterStatus;
  class: FHIRCoding; // ambulatory, emergency, inpatient
  subjectPatientId: string;
  clinicianId?: string;
  periodStart: string;
  periodEnd?: string;
  reasonCode?: FHIRCodeableConcept[];
  ghlAppointmentId?: string; // GHL v2 Calendar Appointment ID
  createdAt: string;
  updatedAt: string;
}

// 3. FHIR Observation Resource (Vitals, Lab, Dictated findings)
export type FHIRObservationStatus =
  | 'registered'
  | 'preliminary'
  | 'final'
  | 'amended'
  | 'corrected'
  | 'cancelled'
  | 'entered-in-error';

export interface FHIRObservation {
  id: string;
  tenantId: string;
  resourceType: 'Observation';
  status: FHIRObservationStatus;
  category: FHIRCodeableConcept[];
  code: FHIRCodeableConcept; // LOINC / SNOMED CT
  subjectPatientId: string;
  encounterId?: string;
  effectiveDateTime: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  valueString?: string;
  interpretation?: FHIRCodeableConcept[];
  note?: string;
  createdAt: string;
}

// 4. FHIR ClinicalImpression (SOAP + Human-in-the-Loop Signature)
export type FHIRClinicalImpressionStatus =
  | 'draft'
  | 'in-progress'
  | 'completed'
  | 'entered-in-error';

export interface FHIRClinicalImpression {
  id: string;
  tenantId: string;
  resourceType: 'ClinicalImpression';
  status: FHIRClinicalImpressionStatus;
  subjectPatientId: string;
  encounterId?: string;
  date: string;
  summary: string; // SOAP Format: Subjective, Objective, Assessment, Plan
  findings: Array<{
    itemCodeableConcept?: FHIRCodeableConcept;
    basis?: string;
  }>;
  aiGenerated: boolean;
  aiModelVersion?: string;
  aiRawPromptHash?: string;
  signedBy?: string; // Clinician ID
  signedAt?: string;
  signatureDigest?: string; // SHA-256 integrity validation
  createdAt: string;
  updatedAt: string;
}

// Audit Trail Record
export interface AuditLogEntry {
  id: number;
  tenantId: string;
  userId?: string;
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'SIGN' | 'EXPORT' | 'AI_DISPATCH' | 'GHL_SYNC';
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  userAgent?: string;
  changeDiff?: Record<string, unknown>;
  tamperProofHash: string;
  createdAt: string;
}
