import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FormsService } from './forms.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = () => ({
  form: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  formField: {
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  formAssignment: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  formSubmission: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
});

describe('FormsService', () => {
  let service: FormsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [FormsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(FormsService);
  });

  describe('createForm', () => {
    it('creates a form and returns it', async () => {
      prisma.form.findFirst
        .mockResolvedValueOnce(null) // slug uniqueness check
        .mockResolvedValueOnce({
          id: 1,
          name: 'Test Form',
          slug: 'test-form',
          description: null,
          isActive: 1,
          fields: [],
          assignments: [],
        });
      prisma.form.create.mockResolvedValue({
        id: 1,
        name: 'Test Form',
        slug: 'test-form',
        description: null,
        isActive: 1,
      });

      const result = await service.createForm({ name: 'Test Form' });
      expect(result.name).toBe('Test Form');
      expect(prisma.form.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFormForCustomer', () => {
    it('returns form data when it exists', async () => {
      prisma.form.findFirst.mockResolvedValue({
        id: 1,
        name: 'Test Form',
        slug: 'test-form',
        description: null,
        isActive: 1,
        fields: [],
        assignments: [],
      });

      const result = await service.getFormForCustomer(1);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
    });

    it('returns null when form does not exist', async () => {
      prisma.form.findFirst.mockResolvedValue(null);
      const result = await service.getFormForCustomer(999);
      expect(result).toBeNull();
    });
  });

  describe('submitForm', () => {
    it('throws NotFoundException when form does not exist', async () => {
      prisma.form.findFirst.mockResolvedValue(null);

      await expect(service.submitForm(999, BigInt(1), {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
