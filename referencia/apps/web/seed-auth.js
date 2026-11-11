const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // 1. Create Default Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'clinica-buenos-aires' },
    update: {},
    create: {
      name: 'Clínica Buenos Aires',
      slug: 'clinica-buenos-aires',
      timezone: 'America/Argentina/Buenos_Aires',
    },
  });
  console.log('Workspace seeded:', workspace.id);

  // 2. Hash password
  const passwordHash = await bcrypt.hash('admin123', 10);

  // 3. Create Admin User (Doctor)
  const admin = await prisma.user.upsert({
    where: { email_workspaceId: { email: 'admin@clinica.com', workspaceId: workspace.id } },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      email: 'admin@clinica.com',
      passwordHash,
      name: 'Dr. Admin',
      role: 'ADMIN',
      workspaceId: workspace.id,
      isActive: true,
    },
  });
  console.log('Admin user seeded:', admin.email);
  
  // 4. Create Recepcion User
  const recepcion = await prisma.user.upsert({
    where: { email_workspaceId: { email: 'recepcion@clinica.com', workspaceId: workspace.id } },
    update: { passwordHash, role: 'RECEPCION' },
    create: {
      email: 'recepcion@clinica.com',
      passwordHash,
      name: 'Secretaría General',
      role: 'RECEPCION',
      workspaceId: workspace.id,
      isActive: true,
    },
  });
  console.log('Recepcion user seeded:', recepcion.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
