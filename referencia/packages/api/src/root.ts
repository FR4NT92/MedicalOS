// packages/api/src/root.ts
import { router } from "./trpc";
import { patientRouter } from "./routers/patient";
import { appointmentRouter } from "./routers/appointment";
import { triageRouter } from "./routers/triage";
import { medicalRecordRouter } from "./routers/medicalRecord";
import { invoiceRouter } from "./routers/invoice";
import { paymentRouter } from "./routers/payment";
import { aiRouter } from "./routers/ai";
import { integrationRouter } from "./routers/integration";

export const appRouter = router({
  patient: patientRouter,
  appointment: appointmentRouter,
  triage: triageRouter,
  medicalRecord: medicalRecordRouter,
  invoice: invoiceRouter,
  payment: paymentRouter,
  ai: aiRouter,
  integration: integrationRouter,
});

export type AppRouter = typeof appRouter;
