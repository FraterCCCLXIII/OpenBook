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

class Audit_events_model extends EA_Model
{
    protected array $casts = [
        'id' => 'integer',
        'actor_user_id' => 'integer',
        'customer_id' => 'integer',
        'appointment_id' => 'integer',
    ];

    public function save(array $event): int
    {
        $event['update_datetime'] = date('Y-m-d H:i:s');
        $event['create_datetime'] = $event['create_datetime'] ?? date('Y-m-d H:i:s');
        $event['occurred_at'] = $event['occurred_at'] ?? date('Y-m-d H:i:s');

        if (!$this->db->insert('audit_events', $event)) {
            throw new RuntimeException('Could not insert audit event.');
        }

        return (int) $this->db->insert_id();
    }

    public function search(array $filters = [], int $limit = 100, int $offset = 0): array
    {
        $query = $this->db
            ->select('*')
            ->from('audit_events')
            ->order_by('occurred_at', 'DESC')
            ->limit($limit, $offset);

        if (!empty($filters['actor_user_id'])) {
            $query->where('actor_user_id', (int) $filters['actor_user_id']);
        }

        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', (int) $filters['customer_id']);
        }

        if (!empty($filters['appointment_id'])) {
            $query->where('appointment_id', (int) $filters['appointment_id']);
        }

        if (!empty($filters['entity_type'])) {
            $query->where('entity_type', (string) $filters['entity_type']);
        }

        if (!empty($filters['action'])) {
            $query->like('action', (string) $filters['action']);
        }

        if (!empty($filters['source'])) {
            $query->where('source', (string) $filters['source']);
        }

        if (!empty($filters['start_date'])) {
            $query->where('occurred_at >=', (string) $filters['start_date'] . ' 00:00:00');
        }

        if (!empty($filters['end_date'])) {
            $query->where('occurred_at <=', (string) $filters['end_date'] . ' 23:59:59');
        }

        $rows = $query->get()->result_array();

        foreach ($rows as &$row) {
            $this->cast($row);
            $row['metadata'] = $this->decode_metadata($row['metadata_json'] ?? null);
        }

        return $rows;
    }

    public function count_search(array $filters = []): int
    {
        $query = $this->db->from('audit_events');

        if (!empty($filters['actor_user_id'])) {
            $query->where('actor_user_id', (int) $filters['actor_user_id']);
        }

        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', (int) $filters['customer_id']);
        }

        if (!empty($filters['appointment_id'])) {
            $query->where('appointment_id', (int) $filters['appointment_id']);
        }

        if (!empty($filters['entity_type'])) {
            $query->where('entity_type', (string) $filters['entity_type']);
        }

        if (!empty($filters['action'])) {
            $query->like('action', (string) $filters['action']);
        }

        if (!empty($filters['source'])) {
            $query->where('source', (string) $filters['source']);
        }

        if (!empty($filters['start_date'])) {
            $query->where('occurred_at >=', (string) $filters['start_date'] . ' 00:00:00');
        }

        if (!empty($filters['end_date'])) {
            $query->where('occurred_at <=', (string) $filters['end_date'] . ' 23:59:59');
        }

        return (int) $query->count_all_results();
    }

    public function prune_older_than_days(int $days): void
    {
        if ($days <= 0) {
            return;
        }

        $threshold = date('Y-m-d H:i:s', strtotime('-' . $days . ' days'));
        $this->db->where('occurred_at <', $threshold)->delete('audit_events');
    }

    private function decode_metadata(?string $metadata_json): array
    {
        if (!$metadata_json) {
            return [];
        }

        $decoded = json_decode($metadata_json, true);

        return is_array($decoded) ? $decoded : [];
    }
}
