-- GeoNames: dedupe rows, replace composite index with unique (country_code, postal_code) for createMany skipDuplicates

DELETE t1 FROM `ea_geonames_postal_codes` t1
INNER JOIN `ea_geonames_postal_codes` t2
  ON t1.country_code = t2.country_code
  AND t1.postal_code = t2.postal_code
  AND t1.id > t2.id;

DROP INDEX `idx_postal_country` ON `ea_geonames_postal_codes`;

CREATE UNIQUE INDEX `ea_geonames_postal_codes_country_code_postal_code_key`
  ON `ea_geonames_postal_codes` (`country_code`, `postal_code`);
