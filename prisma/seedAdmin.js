const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Super Admin user...');

  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (existingAdmin) {
    console.log('An ADMIN user already exists:', existingAdmin.email);
    console.log('Use those credentials to log in. Script aborted.');
    return;
  }

  // Create a default super admin password
  const email = "superadmin@covenanthostel.com";
  const password = "adminpassword123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: email,
      hashedPassword: hashedPassword,
      role: 'ADMIN',
    }
  });

  console.log('-------------------------------------------');
  console.log('✅ Super Admin created successfully!');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('-------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
