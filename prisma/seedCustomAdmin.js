const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Custom Super Admin user...');

  const email = "superadmin@covenanthostel.com";
  const password = "superadmin@covenanthostel.com";
  
  // Check if this specific user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: email }
  });

  if (existingAdmin) {
    console.log('Admin user with this email already exists. Updating password to ensure match...');
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email: email },
      data: {
        hashedPassword: hashedPassword,
        role: 'ADMIN',
      }
    });
    console.log('Password updated and role ensured to be ADMIN.');
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: email,
        hashedPassword: hashedPassword,
        role: 'ADMIN',
      }
    });
    console.log('Created new Super Admin user.');
  }

  console.log('-------------------------------------------');
  console.log('✅ Custom Super Admin is ready!');
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
