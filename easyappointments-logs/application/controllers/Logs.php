<?php defined('BASEPATH') or exit('No direct script access allowed');

class Logs extends EA_Controller
{
    public function __construct()
    {
        parent::__construct();

        $this->load->model('audit_events_model');
    }

    public function index(): void
    {
        if (!$this->can_view_logs()) {
            redirect('login');

            return;
        }

        $user_id = (int) session('user_id');
        $user_display_name = $this->accounts->get_user_display_name($user_id);

        html_vars([
            'page_title' => 'Logs',
            'active_menu' => 'logs',
            'user_display_name' => $user_display_name,
        ]);

        $this->load->view('pages/logs', [
            'active_menu' => 'logs',
            'user_display_name' => $user_display_name,
        ]);
    }

    public function events(): void
    {
        try {
            if (!$this->can_view_logs()) {
                abort(403, 'Forbidden');
            }

            $limit = max(1, min(250, (int) request('limit', 50)));
            $offset = max(0, (int) request('offset', 0));
            $filters = [
                'start_date' => trim((string) request('start_date', '')),
                'end_date' => trim((string) request('end_date', '')),
                'actor_user_id' => (int) request('actor_user_id', 0),
                'customer_id' => (int) request('customer_id', 0),
                'appointment_id' => (int) request('appointment_id', 0),
                'action' => trim((string) request('action', '')),
                'entity_type' => trim((string) request('entity_type', '')),
                'source' => trim((string) request('source', '')),
            ];

            $rows = $this->audit_events_model->search($filters, $limit, $offset);
            $total = $this->audit_events_model->count_search($filters);
            $rows = $this->hydrate_actor_display_names($rows);

            json_response([
                'items' => $rows,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    private function can_view_logs(): bool
    {
        if (cannot('view', PRIV_SYSTEM_SETTINGS)) {
            return false;
        }

        $role_slug = (string) session('role_slug');

        return in_array($role_slug, [DB_SLUG_ADMIN, 'manager'], true);
    }

    private function hydrate_actor_display_names(array $rows): array
    {
        if (empty($rows)) {
            return [];
        }

        $user_ids = [];
        foreach ($rows as $row) {
            if (!empty($row['actor_user_id'])) {
                $user_ids[] = (int) $row['actor_user_id'];
            }
        }
        $user_ids = array_values(array_unique($user_ids));

        $display_names = [];
        if (!empty($user_ids)) {
            $users = $this->db->select('id, first_name, last_name, email')
                ->from('users')
                ->where_in('id', $user_ids)
                ->get()
                ->result_array();

            foreach ($users as $user) {
                $name = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
                $display_names[(int) $user['id']] = $name !== '' ? $name : ($user['email'] ?? ('User #' . $user['id']));
            }
        }

        foreach ($rows as &$row) {
            $actor_id = (int) ($row['actor_user_id'] ?? 0);
            $row['actor_display_name'] = $actor_id > 0 ? ($display_names[$actor_id] ?? ('User #' . $actor_id)) : 'System';
        }

        return $rows;
    }
}
