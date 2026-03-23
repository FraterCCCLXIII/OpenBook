import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public bookable services (non-private). */
  async listPublicServices() {
    const rows = await this.prisma.service.findMany({
      where: {
        OR: [{ isPrivate: 0 }, { isPrivate: null }],
      },
      orderBy: { id: 'asc' },
      include: { category: true },
    });
    return rows.map((s) => ({
      id: s.id.toString(),
      name: s.name,
      duration: s.duration,
      price: s.price?.toString() ?? null,
      currency: s.currency,
      description: s.description,
      categoryId: s.idServiceCategories?.toString() ?? null,
      categoryName: s.category?.name ?? null,
    }));
  }

  /** Providers linked to a service via ea_services_providers. */
  async listProvidersForService(serviceIdStr: string) {
    let serviceId: bigint;
    try {
      serviceId = BigInt(serviceIdStr);
    } catch {
      throw new NotFoundException('Service not found');
    }
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service || service.isPrivate === 1) {
      throw new NotFoundException('Service not found');
    }

    const links = await this.prisma.serviceProvider.findMany({
      where: { idServices: serviceId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return links.map((l) => ({
      id: l.user.id.toString(),
      firstName: l.user.firstName,
      lastName: l.user.lastName,
      email: l.user.email,
      displayName:
        [l.user.firstName, l.user.lastName].filter(Boolean).join(' ').trim() ||
        l.user.email ||
        `Provider ${l.user.id}`,
    }));
  }

  /** Ensures provider is linked to the service (ea_services_providers). */
  async assertProviderOffersService(serviceId: bigint, providerId: bigint) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service || service.isPrivate === 1) {
      throw new NotFoundException('Service not found');
    }
    const link = await this.prisma.serviceProvider.findUnique({
      where: {
        idUsers_idServices: { idUsers: providerId, idServices: serviceId },
      },
    });
    if (!link) {
      throw new BadRequestException('Provider does not offer this service');
    }
  }
}
