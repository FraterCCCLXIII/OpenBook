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
 * Service area ZIPs model.
 *
 * @package Models
 */
class Service_area_zips_model extends EA_Model
{
    protected array $casts = [
        'id' => 'integer',
    ];

    public function save(array $service_area_zip): int
    {
        $this->validate($service_area_zip);

        if (empty($service_area_zip['id'])) {
            return $this->insert($service_area_zip);
        }

        return $this->update($service_area_zip);
    }

    public function delete(int $service_area_zip_id): void
    {
        if (!$service_area_zip_id) {
            return;
        }

        $this->db->delete('service_area_zips', ['id' => $service_area_zip_id]);
    }

    public function find(int $service_area_zip_id): array
    {
        $service_area_zip = $this->db
            ->get_where('service_area_zips', ['id' => $service_area_zip_id])
            ->row_array();

        if (empty($service_area_zip)) {
            throw new InvalidArgumentException(
                'The provided service area zip ID does not exist in the database: ' . $service_area_zip_id,
            );
        }

        $this->cast($service_area_zip);

        return $service_area_zip;
    }

    public function get(
        array|string|null $where = null,
        ?int $limit = null,
        ?int $offset = null,
        ?string $order_by = null,
    ): array {
        if ($where !== null) {
            $this->db->where($where);
        }

        if ($order_by !== null) {
            $this->db->order_by($this->quote_order_by($order_by));
        }

        $service_area_zips = $this->db->get('service_area_zips', $limit, $offset)->result_array();

        foreach ($service_area_zips as &$service_area_zip) {
            $this->cast($service_area_zip);
        }

        return $service_area_zips;
    }

    public function find_by_postal_code(string $country_code, string $postal_code): ?array
    {
        $row = $this->db
            ->get_where('service_area_zips', [
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

    public function find_by_postal_code_any_country(string $postal_code): ?array
    {
        $row = $this->db
            ->where('postal_code', strtoupper($postal_code))
            ->limit(1)
            ->get('service_area_zips')
            ->row_array();

        if (!$row) {
            return null;
        }

        $this->cast($row);

        return $row;
    }

    protected function validate(array $service_area_zip): void
    {
        if (!empty($service_area_zip['id'])) {
            $count = $this->db->get_where('service_area_zips', ['id' => $service_area_zip['id']])->num_rows();

            if (!$count) {
                throw new InvalidArgumentException(
                    'The provided service area zip ID does not exist in the database: ' . $service_area_zip['id'],
                );
            }
        }

        if (empty($service_area_zip['country_code']) || empty($service_area_zip['postal_code'])) {
            throw new InvalidArgumentException(
                'Not all required fields are provided: ' . print_r($service_area_zip, true),
            );
        }
    }

    protected function insert(array $service_area_zip): int
    {
        $this->db->insert('service_area_zips', $service_area_zip);

        return (int) $this->db->insert_id();
    }

    protected function update(array $service_area_zip): int
    {
        $this->db->where('id', $service_area_zip['id']);
        $this->db->update('service_area_zips', $service_area_zip);

        return (int) $service_area_zip['id'];
    }

    public function get_with_labels(): array
    {
        $rows = $this->db
            ->select('service_area_zips.*, geonames.place_name, geonames.admin_name1, geonames.country_code AS geo_country')
            ->from('service_area_zips')
            ->join(
                'geonames_postal_codes AS geonames',
                'geonames.country_code = service_area_zips.country_code ' .
                'AND geonames.postal_code = service_area_zips.postal_code',
                'left',
            )
            ->order_by('service_area_zips.country_code')
            ->order_by('service_area_zips.postal_code')
            ->get()
            ->result_array();

        foreach ($rows as &$row) {
            $this->cast($row);
            $label = trim((string) ($row['custom_label'] ?? ''));
            if ($label === '') {
                $parts = array_filter([
                    $row['place_name'] ?? null,
                    $row['admin_name1'] ?? null,
                    $row['geo_country'] ?? null,
                ]);
                $label = implode(', ', $parts);
            }
            if ($label === '') {
                $label = 'Unknown ZIP';
            }
            $row['display_label'] = $label;
        }

        return $rows;
    }
}
