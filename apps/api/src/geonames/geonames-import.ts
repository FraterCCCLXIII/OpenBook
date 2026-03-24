import { createReadStream } from 'node:fs';
import * as readline from 'node:readline';
import { resolve as pathResolve, sep } from 'node:path';
import type { PrismaClient } from '@prisma/client';

const BATCH_SIZE = 1000;

export type GeonamesPostalRow = {
  countryCode: string;
  postalCode: string;
  placeName: string | null;
  adminName1: string | null;
  adminCode1: string | null;
  latitude: number | null;
  longitude: number | null;
};

/**
 * GeoNames postal code file: tab-separated, at least 11 columns (see legacy PHP `Console::geonames_import`).
 */
export function parseGeonamesPostalLine(line: string): GeonamesPostalRow | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const columns = trimmed.split('\t');
  if (columns.length < 11) return null;

  const countryCode = String(columns[0] ?? '')
    .trim()
    .toUpperCase();
  const postalCode = String(columns[1] ?? '')
    .trim()
    .toUpperCase();
  if (!countryCode || !postalCode) return null;

  const latRaw = columns[9];
  const lngRaw = columns[10];
  const lat =
    latRaw !== undefined && latRaw !== '' ? Number.parseFloat(latRaw) : NaN;
  const lng =
    lngRaw !== undefined && lngRaw !== '' ? Number.parseFloat(lngRaw) : NaN;

  return {
    countryCode,
    postalCode,
    placeName: trimOrNull(columns[2]),
    adminName1: trimOrNull(columns[3]),
    adminCode1: trimOrNull(columns[4]),
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lng) ? lng : null,
  };
}

function trimOrNull(s: string | undefined): string | null {
  const t = (s ?? '').trim();
  return t === '' ? null : t;
}

/** Ensure `filePath` is under `uploadRoot` (prevents path traversal). */
export function assertGeonamesFileUnderRoot(
  filePath: string,
  uploadRoot: string,
): string {
  const root = pathResolve(uploadRoot);
  const resolved = pathResolve(filePath);
  if (resolved !== root && !resolved.startsWith(root + sep)) {
    throw new Error('GeoNames import path must be under UPLOAD_DIR');
  }
  return resolved;
}

export type GeonamesImportOptions = {
  /** When true, delete all rows before import. */
  truncate?: boolean;
  /** When set (and truncate is false), delete rows for this country only before import. */
  countryFilter?: string;
};

export type GeonamesImportResult = {
  inserted: number;
  skipped: number;
  linesRead: number;
};

/**
 * Stream-parse a GeoNames `allCountries.txt`-style postal file and upsert into `ea_geonames_postal_codes`.
 * Requires `@@unique([countryCode, postalCode])` for `createMany` skipDuplicates.
 */
export async function runGeonamesImportFromFile(
  prisma: PrismaClient,
  filePath: string,
  opts: GeonamesImportOptions,
): Promise<GeonamesImportResult> {
  const countryUpper = opts.countryFilter?.trim().toUpperCase();
  const filterCountry = Boolean(countryUpper);

  if (opts.truncate) {
    await prisma.geoNamesPostalCode.deleteMany({});
  } else if (filterCountry && countryUpper) {
    await prisma.geoNamesPostalCode.deleteMany({
      where: { countryCode: countryUpper },
    });
  }

  const stream = createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let inserted = 0;
  let skipped = 0;
  let linesRead = 0;
  let batch: GeonamesPostalRow[] = [];

  async function flush(): Promise<void> {
    if (batch.length === 0) return;
    const data = batch.map((row) => ({
      countryCode: row.countryCode,
      postalCode: row.postalCode,
      placeName: row.placeName,
      adminName1: row.adminName1,
      adminCode1: row.adminCode1,
      latitude: row.latitude,
      longitude: row.longitude,
    }));
    const result = await prisma.geoNamesPostalCode.createMany({
      data,
      skipDuplicates: true,
    });
    inserted += result.count;
    skipped += batch.length - result.count;
    batch = [];
  }

  for await (const line of rl) {
    linesRead += 1;
    const row = parseGeonamesPostalLine(line);
    if (!row) {
      skipped += 1;
      continue;
    }
    if (filterCountry && countryUpper && row.countryCode !== countryUpper) {
      skipped += 1;
      continue;
    }
    batch.push(row);
    if (batch.length >= BATCH_SIZE) {
      await flush();
    }
  }
  await flush();

  return { inserted, skipped, linesRead };
}
