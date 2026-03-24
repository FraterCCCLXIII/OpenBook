import { join } from 'node:path';
import {
  assertGeonamesFileUnderRoot,
  parseGeonamesPostalLine,
} from './geonames-import';

describe('parseGeonamesPostalLine', () => {
  it('parses a GeoNames postal row (tab-separated, 11+ columns)', () => {
    const line =
      'US\t99553\tAkutan\tAlaska\tAK\tAleutians East\t013\t\t\t54.133\t-165.776';
    const row = parseGeonamesPostalLine(line);
    expect(row).not.toBeNull();
    expect(row?.countryCode).toBe('US');
    expect(row?.postalCode).toBe('99553');
    expect(row?.placeName).toBe('Akutan');
    expect(row?.latitude).toBeCloseTo(54.133, 3);
    expect(row?.longitude).toBeCloseTo(-165.776, 3);
  });

  it('returns null for short lines', () => {
    expect(parseGeonamesPostalLine('US\t12345')).toBeNull();
  });
});

describe('assertGeonamesFileUnderRoot', () => {
  it('allows paths under upload root', () => {
    const root = join('/data', 'uploads');
    const ok = join(root, 'geonames', 'x.txt');
    expect(assertGeonamesFileUnderRoot(ok, root)).toBe(ok);
  });

  it('rejects traversal outside root', () => {
    expect(() =>
      assertGeonamesFileUnderRoot('/etc/passwd', '/data/uploads'),
    ).toThrow();
  });
});
