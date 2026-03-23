import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type FormFieldInput = {
  id?: number;
  label: string;
  fieldType?: string;
  options?: string[];
  isRequired?: boolean;
  sortOrder?: number;
};

export type CreateFormInput = {
  name: string;
  description?: string;
  fields?: FormFieldInput[];
  roleAssignments?: string[];
};

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async buildUniqueSlug(
    base: string,
    excludeId?: number,
  ): Promise<string> {
    const slug = this.slugify(base) || 'form';
    let candidate = slug;
    let suffix = 2;
    while (true) {
      const existing = await this.prisma.form.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (!existing) break;
      candidate = `${slug}-${suffix++}`;
    }
    return candidate;
  }

  async listForms() {
    const forms = await this.prisma.form.findMany({
      where: { isActive: 1 },
      orderBy: { name: 'asc' },
      include: { _count: { select: { fields: { where: { isActive: 1 } } } } },
    });
    return forms.map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      description: f.description,
      fieldCount: f._count.fields,
    }));
  }

  async getForm(id: number) {
    const form = await this.prisma.form.findFirst({
      where: { id },
      include: {
        fields: { where: { isActive: 1 }, orderBy: { sortOrder: 'asc' } },
        assignments: true,
      },
    });
    if (!form) throw new NotFoundException('Form not found');
    return {
      id: form.id,
      name: form.name,
      slug: form.slug,
      description: form.description,
      fields: form.fields.map((f) => ({
        id: f.id,
        label: f.label,
        fieldType: f.fieldType,
        options: this.decodeOptions(f.options, f.fieldType),
        isRequired: f.isRequired === 1,
        sortOrder: f.sortOrder,
      })),
      roleAssignments: form.assignments.map((a) => a.roleSlug),
    };
  }

  async createForm(input: CreateFormInput) {
    if (!input.name?.trim()) throw new BadRequestException('name is required');
    const slug = await this.buildUniqueSlug(input.name);
    const form = await this.prisma.form.create({
      data: {
        name: input.name.trim(),
        slug,
        description: input.description ?? null,
        isActive: 1,
      },
    });
    if (input.fields?.length) {
      await this.syncFields(form.id, input.fields);
    }
    if (input.roleAssignments?.length) {
      await this.syncAssignments(form.id, input.roleAssignments);
    }
    return this.getForm(form.id);
  }

  async updateForm(id: number, input: Partial<CreateFormInput>) {
    const existing = await this.prisma.form.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException('Form not found');

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) {
      data.name = input.name.trim();
      data.slug = await this.buildUniqueSlug(input.name, id);
    }
    if (input.description !== undefined) data.description = input.description;

    if (Object.keys(data).length > 0) {
      await this.prisma.form.update({ where: { id }, data });
    }
    if (input.fields !== undefined) {
      await this.syncFields(id, input.fields);
    }
    if (input.roleAssignments !== undefined) {
      await this.syncAssignments(id, input.roleAssignments);
    }
    return this.getForm(id);
  }

  async deleteForm(id: number) {
    const existing = await this.prisma.form.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException('Form not found');
    await this.prisma.form.update({ where: { id }, data: { isActive: 0 } });
    return { ok: true };
  }

  async getFormsForCustomer(customerRoleSlug: string) {
    const assignments = await this.prisma.formAssignment.findMany({
      where: { roleSlug: customerRoleSlug },
      include: { form: true },
    });
    return assignments
      .filter((a) => a.form.isActive === 1)
      .map((a) => ({
        id: a.form.id,
        name: a.form.name,
        slug: a.form.slug,
        description: a.form.description,
      }));
  }

  async getFormForCustomer(formId: number) {
    try {
      return await this.getForm(formId);
    } catch {
      return null;
    }
  }

  async submitForm(
    formId: number,
    userId: bigint,
    answers: Record<string, unknown>,
  ) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, isActive: 1 },
    });
    if (!form) throw new NotFoundException('Form not found');

    const fieldsSnapshot = JSON.stringify(answers);
    const submission = await this.prisma.formSubmission.create({
      data: {
        idForms: formId,
        idUsers: userId,
        fieldsSnapshot,
      },
    });
    return { id: submission.id, ok: true };
  }

  async getSubmission(formId: number, userId: bigint) {
    const submission = await this.prisma.formSubmission.findFirst({
      where: { idForms: formId, idUsers: userId },
      orderBy: { submittedAt: 'desc' },
    });
    if (!submission) return null;
    return {
      id: submission.id,
      submittedAt: submission.submittedAt,
      answers: submission.fieldsSnapshot
        ? (JSON.parse(submission.fieldsSnapshot) as Record<string, unknown>)
        : {},
    };
  }

  private async syncFields(formId: number, fields: FormFieldInput[]) {
    const existing = await this.prisma.formField.findMany({
      where: { idForms: formId },
    });
    const existingIds = new Set(existing.map((f) => f.id));
    const incomingIds = new Set<number>();

    for (const [idx, field] of fields.entries()) {
      const optionsJson = field.options?.length
        ? JSON.stringify(field.options)
        : null;
      const data = {
        idForms: formId,
        label: field.label,
        fieldType: field.fieldType ?? 'input',
        options: optionsJson,
        isRequired: field.isRequired ? 1 : 0,
        isActive: 1,
        sortOrder: field.sortOrder ?? idx,
      };
      if (field.id && existingIds.has(field.id)) {
        await this.prisma.formField.update({ where: { id: field.id }, data });
        incomingIds.add(field.id);
      } else {
        const created = await this.prisma.formField.create({ data });
        incomingIds.add(created.id);
      }
    }

    for (const existing of await this.prisma.formField.findMany({
      where: { idForms: formId },
    })) {
      if (!incomingIds.has(existing.id)) {
        await this.prisma.formField.update({
          where: { id: existing.id },
          data: { isActive: 0 },
        });
      }
    }
  }

  private async syncAssignments(formId: number, roleSlugs: string[]) {
    await this.prisma.formAssignment.deleteMany({ where: { idForms: formId } });
    if (roleSlugs.length > 0) {
      await this.prisma.formAssignment.createMany({
        data: roleSlugs.map((roleSlug) => ({ idForms: formId, roleSlug })),
      });
    }
  }

  private decodeOptions(raw: string | null, fieldType: string): string[] {
    const typesWithOptions = ['dropdown', 'radio', 'checkboxes'];
    if (!typesWithOptions.includes(fieldType)) return [];
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed as string[];
    } catch {
      // fall through
    }
    return raw.split('\n').filter(Boolean);
  }
}
