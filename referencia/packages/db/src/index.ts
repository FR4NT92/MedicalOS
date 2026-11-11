// packages/db/src/index.ts
// Clinic-OS Multi-Tenant Database Client with Strict Tenant Isolation & Append-Only HCE Guarantees

import { PrismaClient, Prisma } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

/**
 * Creates a tenant-isolated Prisma client extension.
 * Ensures every operation is strictly bound to the authenticated workspaceId via RLS parameters.
 */
export function createTenantClient(workspaceId: string, userId: string = 'system', userRole: string = 'CLINIC_ADMIN') {
  if (!workspaceId) {
    throw new Error("SECURITY EXCEPTION: workspaceId is required to construct a tenant database client.");
  }

  // We use Prisma Client Extensions to wrap EVERY query in a transaction that sets the Postgres local variables
  // for Row Level Security (RLS) enforcement on the database layer.
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const [, result] = await prisma.$transaction([
            prisma.$executeRaw`
              SELECT set_config('role', 'authenticated', TRUE), 
                     set_config('app.current_workspace_id', ${workspaceId}, TRUE), 
                     set_config('app.current_user_id', ${userId}, TRUE), 
                     set_config('app.current_user_role', ${userRole}, TRUE);
            `,
            query(args),
          ]);
          return result;
        },
      },
      medicalRecord: {
        async update() {
          throw new Error("LEGAL COMPLIANCE: MedicalRecord is strictly Append-Only.");
        },
        async updateMany() {
          throw new Error("LEGAL COMPLIANCE: MedicalRecord is strictly Append-Only.");
        },
        async delete() {
          throw new Error("LEGAL COMPLIANCE: Deleting medical records is strictly prohibited.");
        },
      },
    },
  });
}

export * from "@prisma/client";
export type TenantPrismaClient = ReturnType<typeof createTenantClient>;
