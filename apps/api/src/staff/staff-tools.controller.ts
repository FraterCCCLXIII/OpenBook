import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { canView } from '../auth/permissions.ea';
import { PrismaService } from '../prisma/prisma.service';

@Controller('staff/tools')
@UseGuards(StaffAuthGuard)
export class StaffToolsController {
  constructor(private readonly prisma: PrismaService) {}

  /** Lookup postal rows in `ea_geonames_postal_codes` (import data separately). */
  @Get('postal-lookup')
  async postalLookup(
    @Req() req: RequestWithStaff,
    @Query('country') country?: string,
    @Query('q') q?: string,
  ) {
    if (!canView(req.staffUser.permissions, 'customers')) {
      throw new ForbiddenException();
    }
    const cc = (country ?? 'US').trim().toUpperCase().slice(0, 2);
    const term = (q ?? '').trim();
    if (term.length < 2) {
      return { items: [], message: 'Enter at least 2 characters.' };
    }

    const rows = await this.prisma.geoNamesPostalCode.findMany({
      where: {
        countryCode: cc,
        OR: [
          { postalCode: { contains: term } },
          { placeName: { contains: term } },
        ],
      },
      take: 40,
      orderBy: { postalCode: 'asc' },
    });

    return {
      items: rows.map((r) => ({
        id: r.id.toString(),
        postalCode: r.postalCode,
        countryCode: r.countryCode,
        placeName: r.placeName,
        adminName1: r.adminName1,
        latitude: r.latitude,
        longitude: r.longitude,
      })),
    };
  }
}
