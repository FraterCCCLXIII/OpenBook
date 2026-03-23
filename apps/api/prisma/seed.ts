import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { hashPasswordEa } from '../src/auth/password.ea';

const prisma = new PrismaClient();

const WORKING_PLAN = JSON.stringify({
  monday: { start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
  tuesday: { start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
  wednesday: { start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
  thursday: { start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
  friday: { start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
  saturday: null,
  sunday: null,
});

async function main() {
  await prisma.appointment.deleteMany();
  await prisma.blockedPeriod.deleteMany();
  await prisma.serviceProvider.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.customerAuth.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.role.deleteMany();

  const [adminRole, providerRole, , customerRole] = await prisma.$transaction([
    prisma.role.create({
      data: {
        name: 'Administrator',
        slug: 'admin',
        isAdmin: 1,
        appointments: 15,
        customers: 15,
        services: 15,
        usersPerm: 15,
        systemSettings: 15,
        userSettings: 15,
        webhooks: 0,
        blockedPeriods: 15,
      },
    }),
    prisma.role.create({
      data: {
        name: 'Provider',
        slug: 'provider',
        isAdmin: 0,
        appointments: 15,
        customers: 15,
        services: 0,
        usersPerm: 0,
        systemSettings: 0,
        userSettings: 15,
        webhooks: 0,
        blockedPeriods: 0,
      },
    }),
    prisma.role.create({
      data: {
        name: 'Secretary',
        slug: 'secretary',
        isAdmin: 0,
        appointments: 15,
        customers: 15,
        services: 0,
        usersPerm: 0,
        systemSettings: 0,
        userSettings: 15,
        webhooks: 0,
        blockedPeriods: 0,
      },
    }),
    prisma.role.create({
      data: {
        name: 'Customer',
        slug: 'customer',
        isAdmin: 0,
        appointments: 0,
        customers: 0,
        services: 0,
        usersPerm: 0,
        systemSettings: 0,
        userSettings: 0,
        webhooks: 0,
        blockedPeriods: 0,
      },
    }),
  ]);

  const salt =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const passwordPlain = 'password';
  const hashed = hashPasswordEa(salt, passwordPlain);

  const providerUser = await prisma.user.create({
    data: {
      firstName: 'Test',
      lastName: 'Provider',
      email: 'provider@example.com',
      idRoles: providerRole.id,
      timezone: 'UTC',
    },
  });

  await prisma.userSettings.create({
    data: {
      idUsers: providerUser.id,
      username: 'provider',
      password: hashed,
      salt,
      workingPlan: WORKING_PLAN,
      workingPlanExceptions: null,
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'customer@example.com',
      idRoles: customerRole.id,
      timezone: 'UTC',
    },
  });

  const customerHash = await bcrypt.hash(passwordPlain, 10);
  await prisma.customerAuth.create({
    data: {
      customerId: customerUser.id,
      email: 'customer@example.com',
      passwordHash: customerHash,
      status: 'active',
    },
  });

  const category = await prisma.serviceCategory.create({
    data: { name: 'General', description: 'Seeded category' },
  });

  const service = await prisma.service.create({
    data: {
      name: 'Consultation',
      duration: 30,
      price: 0,
      currency: 'USD',
      description: 'Seeded service',
      idServiceCategories: category.id,
      availabilitiesType: 'flexible',
      attendantsNumber: 1,
      isPrivate: 0,
    },
  });

  await prisma.serviceProvider.create({
    data: { idUsers: providerUser.id, idServices: service.id },
  });

  const start = new Date();
  start.setDate(start.getDate() + 7);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);

  await prisma.appointment.create({
    data: {
      bookDatetime: start,
      startDatetime: start,
      endDatetime: end,
      notes: 'Seeded booking for customer demo',
      isUnavailability: 0,
      idUsersProvider: providerUser.id,
      idUsersCustomer: customerUser.id,
      idServices: service.id,
    },
  });

  await prisma.setting.createMany({
    data: [
      { name: 'company_name', value: 'OpenBook Seed Co' },
      { name: 'book_advance_timeout', value: '30' },
      { name: 'future_booking_limit', value: '365' },
    ],
  });

  await prisma.auditLog.create({
    data: {
      action: 'seed: database seeded',
      metadata: JSON.stringify({ at: new Date().toISOString() }),
    },
  });

  await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      idRoles: adminRole.id,
      timezone: 'UTC',
      userSettings: {
        create: {
          username: 'admin',
          password: hashed,
          salt,
          workingPlan: WORKING_PLAN,
        },
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed OK. Logins: staff provider/password, admin/password, customer customer@example.com/password');
  // eslint-disable-next-line no-console
  console.log(`Service id ${service.id}, Provider user id ${providerUser.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
