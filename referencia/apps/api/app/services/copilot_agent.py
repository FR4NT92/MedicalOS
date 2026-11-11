"""
Medical Copilot Function Calling Agent
Interprets clinician's natural voice dictation and outputs structured tool calls
for HL7 FHIR documentation (ClinicalImpression draft) and GoHighLevel appointment booking.
"""

from typing import List, Dict, Any

MEDICAL_COPILOT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_fhir_clinical_draft",
            "description": "Generates a structured SOAP clinical note draft complying with HL7 FHIR ClinicalImpression resource.",
            "parameters": {
                "type": "object",
                "properties": {
                    "subjective": {
                        "type": "string",
                        "description": "Patient anamnesis, symptoms, chronological disease evolution reported by patient."
                    },
                    "objective": {
                        "type": "string",
                        "description": "Physical exam findings, vital signs, physical state."
                    },
                    "assessment": {
                        "type": "string",
                        "description": "Clinical impression, primary diagnosis, differential diagnosis (ICD-10 / SNOMED CT)."
                    },
                    "plan": {
                        "type": "string",
                        "description": "Pharmacological prescription, lifestyle indications, alarms, follow-up period."
                    }
                },
                "required": ["subjective", "objective", "assessment", "plan"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "propose_ghl_appointment",
            "description": "Proposes scheduling or rescheduling an appointment in GoHighLevel v2 calendar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_ghl_contact_id": {
                        "type": "string",
                        "description": "The GoHighLevel contact ID of the patient."
                    },
                    "days_offset": {
                        "type": "integer",
                        "description": "Target days from today for follow-up (e.g., 7 for 1 week, 14 for 2 weeks)."
                    },
                    "preferred_time_window": {
                        "type": "string",
                        "enum": ["morning", "afternoon", "any"],
                        "description": "Preferred time slot window."
                    },
                    "reason": {
                        "type": "string",
                        "description": "Appointment reason for calendar record."
                    }
                },
                "required": ["days_offset", "reason"]
            }
        }
    }
]

COPILOT_SYSTEM_PROMPT = """
You are the AI Medical Copilot for Abundance Clinic OS.
Your role is to assist the clinician by translating spoken clinical dictation into:
1. HL7 FHIR v4 ClinicalImpression drafts using strict SOAP methodology (Subjective, Objective, Assessment, Plan).
2. GoHighLevel v2 appointment scheduling actions.

CRITICAL HEALTH COMPLIANCE RULES:
- Never finalize a clinical record yourself. All outputs are strictly DRAFTS that require the clinician's manual electronic signature.
- Preserve medical terminology with high precision.
- Do not add unmentioned medical claims.
- Extract any scheduling or follow-up orders directly to the propose_ghl_appointment tool call.
"""
