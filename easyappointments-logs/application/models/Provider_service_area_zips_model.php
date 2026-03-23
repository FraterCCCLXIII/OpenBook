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
 * Provider service area ZIPs model.
 *
 * @package Models
 */
class Provider_service_area_zips_model extends EA_Model
{
    protected array $casts = [
        'id' => 'integer',
        'id_users_provider' => 'integer',
        'id_service_area_zips' => 'integer',
    ];

    public function get_zip_ids_for_provider(int $provider_id): array
    {
        $rows = $this->db
            ->select('id_service_area_zips')
            ->from('provider_service_area_zips')
            ->where('id_users_provider', $provider_id)
            ->get()
            ->result_array();

        return array_map(static fn ($row) => (int) $row['id_service_area_zips'], $rows);
    }

    public function sync_for_provider(int $provider_id, array $zip_ids): void
    {
        $zip_ids = array_values(array_unique(array_map('intval', $zip_ids)));

        $existing_rows = $this->db
            ->select('id, id_service_area_zips')
            ->from('provider_service_area_zips')
            ->where('id_users_provider', $provider_id)
            ->get()
            ->result_array();

        $existing_map = [];
        foreach ($existing_rows as $row) {
            $existing_map[(int) $row['id_service_area_zips']] = (int) $row['id'];
        }

        $now = date('Y-m-d H:i:s');
        $insert_rows = [];

        foreach ($zip_ids as $zip_id) {
            if (isset($existing_map[$zip_id])) {
                unset($existing_map[$zip_id]);
                continue;
            }

            $insert_rows[] = [
                'create_datetime' => $now,
                'update_datetime' => $now,
                'id_users_provider' => $provider_id,
                'id_service_area_zips' => $zip_id,
            ];
        }

        if (!empty($insert_rows)) {
            $this->db->insert_batch('provider_service_area_zips', $insert_rows);
        }

        if (!empty($existing_map)) {
            $this->db
                ->where_in('id', array_values($existing_map))
                ->delete('provider_service_area_zips');
        }
    }

    public function get_provider_ids_for_zip(string $country_code, string $postal_code): array
    {
        $rows = $this->db
            ->select('provider_service_area_zips.id_users_provider')
            ->from('provider_service_area_zips')
            ->join(
                'service_area_zips',
                'service_area_zips.id = provider_service_area_zips.id_service_area_zips',
                'inner',
            )
            ->where('service_area_zips.country_code', strtoupper($country_code))
            ->where('service_area_zips.postal_code', strtoupper($postal_code))
            ->get()
            ->result_array();

        return array_map(static fn ($row) => (int) $row['id_users_provider'], $rows);
    }

    public function get_provider_ids_for_postal_code(string $postal_code): array
    {
        $rows = $this->db
            ->select('provider_service_area_zips.id_users_provider')
            ->from('provider_service_area_zips')
            ->join(
                'service_area_zips',
                'service_area_zips.id = provider_service_area_zips.id_service_area_zips',
                'inner',
            )
            ->where('service_area_zips.postal_code', strtoupper($postal_code))
            ->get()
            ->result_array();

        return array_map(static fn ($row) => (int) $row['id_users_provider'], $rows);
    }

    public function has_any_assignments(): bool
    {
        return (bool) $this->db
            ->from('provider_service_area_zips')
            ->limit(1)
            ->count_all_results();
    }
}
