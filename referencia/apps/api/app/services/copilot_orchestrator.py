"""
Medical Copilot Orchestrator
Executes LLM Function Calling to transform unstructured medical dictations
into structured HL7 FHIR ClinicalImpression drafts and GoHighLevel v2 scheduling actions.
Strictly enforces Human-in-the-Loop constraints.
"""

import json
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
from ..core.config import settings
from .copilot_agent import MEDICAL_COPILOT_TOOLS, COPILOT_SYSTEM_PROMPT

logger = logging.getLogger("abundance.copilot_orchestrator")

class MedicalCopilotOrchestrator:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        self._client = None

    @property
    def client(self):
        if not self._client and self.api_key:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(api_key=self.api_key)
        return self._client

    def _compute_prompt_hash(self, text: str) -> str:
        """Computes SHA-256 hash of the dictation input for audit trail integrity."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    async def execute_dictation_pipeline(
        self,
        transcript: str,
        tenant_id: str,
        encounter_id: Optional[str] = None,
        patient_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes the Copilot pipeline:
        1. Ingests transcript.
        2. Calls LLM with function definitions.
        3. Formats outputs for HL7 FHIR draft and GHL actions.
        """
        prompt_hash = self._compute_prompt_hash(transcript)
        context_str = json.dumps(patient_context or {}, ensure_ascii=False)

        user_content = f"""
FECHA ACTUAL: {datetime.now(timezone.utc).isoformat()}
TENANT ID: {tenant_id}
ENCOUNTER ID: {encounter_id or 'UNKNOWN'}
CONTEXTO PACIENTE: {context_str}

DICTADO DEL MÉDICO:
"{transcript}"
"""

        if self.client:
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": COPILOT_SYSTEM_PROMPT},
                        {"role": "user", "content": user_content}
                    ],
                    tools=MEDICAL_COPILOT_TOOLS,
                    tool_choice="auto",
                    temperature=0.1 # Low temperature for clinical deterministic output
                )

                choice = response.choices[0].message
                tool_calls = choice.tool_calls or []
                
                draft_clinical_impression = None
                ghl_action_proposed = None

                for tool_call in tool_calls:
                    fn_name = tool_call.function.name
                    args = json.loads(tool_call.function.arguments)

                    if fn_name == "create_fhir_clinical_draft":
                        summary_soap = (
                            f"[S] SUBJETIVO:\n{args.get('subjective', '')}\n\n"
                            f"[O] OBJETIVO:\n{args.get('objective', '')}\n\n"
                            f"[A] EVALUACIÓN:\n{args.get('assessment', '')}\n\n"
                            f"[P] PLAN:\n{args.get('plan', '')}"
                        )
                        draft_clinical_impression = {
                            "status": "draft",
                            "summary": summary_soap,
                            "structured_soap": args,
                            "ai_generated": True,
                            "ai_model_version": self.model,
                            "ai_raw_prompt_hash": prompt_hash,
                            "requires_clinician_signature": True
                        }

                    elif fn_name == "propose_ghl_appointment":
                        days_offset = args.get("days_offset", 7)
                        target_date = datetime.now(timezone.utc) + timedelta(days=days_offset)
                        # Set default appointment slot to 10:00 AM UTC
                        target_iso = target_date.replace(hour=10, minute=0, second=0).isoformat()

                        ghl_action_proposed = {
                            "action": "book_appointment",
                            "contact_id": args.get("patient_ghl_contact_id", patient_context.get("ghl_contact_id") if patient_context else None),
                            "target_date_iso": target_iso,
                            "slot_days_offset": days_offset,
                            "reason": args.get("reason", "Control evolutivo clínico"),
                            "preferred_time_window": args.get("preferred_time_window", "morning"),
                            "requires_approval": True
                        }

                return {
                    "status": "SUCCESS",
                    "transcript": transcript,
                    "prompt_hash": prompt_hash,
                    "draft_clinical_impression": draft_clinical_impression,
                    "ghl_action_proposed": ghl_action_proposed,
                }

            except Exception as e:
                logger.error(f"Error in Copilot LLM execution: {str(e)}", exc_info=True)
                raise e
        else:
            # Deterministic simulation fallback
            logger.info("Executing mock Copilot LLM parsing.")
            target_date = datetime.now(timezone.utc) + timedelta(days=7)
            return {
                "status": "SUCCESS",
                "transcript": transcript,
                "prompt_hash": prompt_hash,
                "draft_clinical_impression": {
                    "status": "draft",
                    "summary": (
                        "[S] SUBJETIVO:\n"
                        "Paciente refiere cefalea frontal holocraneana de 4 días de evolución acompañada de náuseas leves sin emesis.\n\n"
                        "[O] OBJETIVO:\n"
                        "Signos vitales: TA 120/80 mmHg, FC 72 lpm, SatO2 98%. Lúcida, orientada, examen neurológico sin signos focales ni meníngeos.\n\n"
                        "[A] EVALUACIÓN:\n"
                        "Cefalea tensional episódica (CIE-10 G44.2).\n\n"
                        "[P] PLAN:\n"
                        "Paracetamol 1g cada 8 horas condicional al dolor por 3 días. Control evolutivo agendado en 7 días."
                    ),
                    "ai_generated": True,
                    "ai_model_version": "mock-copilot-v1",
                    "ai_raw_prompt_hash": prompt_hash,
                    "requires_clinician_signature": True
                },
                "ghl_action_proposed": {
                    "action": "book_appointment",
                    "contact_id": patient_context.get("ghl_contact_id", "ghl_c_889211") if patient_context else "ghl_c_889211",
                    "target_date_iso": target_date.replace(hour=10, minute=30, second=0).isoformat(),
                    "slot_days_offset": 7,
                    "reason": "Control médico evolutivo por cefalea",
                    "preferred_time_window": "morning",
                    "requires_approval": True
                }
            }

copilot_orchestrator = MedicalCopilotOrchestrator()
