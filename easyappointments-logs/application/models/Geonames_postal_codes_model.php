<?php defined('BASEPATH') or exit('No direct script access allowed');

/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 *
 * @package     EasyAppointments
 * @author      A.Tselegidis <alextselegidis@gmail.com>
 * @copyright   Copyright (c) Alex Tselegidis
 * @license     https://opensource.org/licenses/GPL-3.0 - GPLv3
 * @link        https://easyappointments.org
 * @since       v1.5.0
 * ---------------------------------------------------------------------------- */

/**
 * GeoNames postal codes model.
 *
 * Handles the geonames_postal_codes table.
 *
 * @package Models
 */
class Geonames_postal_codes_model extends EA_Model
{
    protected array $casts = [
        'id' => 'integer',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function find_by_postal_code(string $country_code, string $postal_code): ?array
    {
        $row = $this->db
            ->get_where('geonames_postal_codes', [
                'country_code' => strtoupper($country_code),
                'postal_code' => strtoupper($postal_code),
            ])
            ->row_array();

        if (!$row) {
            return null;
        }

        $this->cast($row);

        return $row;
    }

    public function truncate(): void
    {
        $this->db->truncate('geonames_postal_codes');
    }

    public function insert_batch(array $rows): void
    {
        if (empty($rows)) {
            return;
        }

        $this->db->insert_batch('geonames_postal_codes', $rows);
    }
}
