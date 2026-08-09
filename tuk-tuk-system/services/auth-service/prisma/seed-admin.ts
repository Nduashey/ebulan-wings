import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDefaultAdmin() {
  try {
    console.log('🌱 Seeding default admin...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'admin' },
          { email: 'admin@ebulanwings.com' },
        ],
      },
    });

    if (existingAdmin) {
      console.log('✅ Default admin already exists');
      console.log(`   Username: ${existingAdmin.username || 'admin'}`);
      console.log(`   Email: ${existingAdmin.email}`);
      return;
    }

    // Create default admin
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@ebulanwings.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: false,
      },
    });

    console.log('✅ Default admin created successfully!');
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('   🔐 Default Admin Credentials');
    console.log('═══════════════════════════════════════');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password in production!');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDefaultAdmin();
