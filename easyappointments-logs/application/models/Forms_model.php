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
 * Forms model.
 *
 * Handles all the database operations of the forms resource.
 *
 * @package Models
 */
class Forms_model extends EA_Model
{
    protected array $casts = [
        'id' => 'integer',
        'is_active' => 'boolean',
    ];

    public function validate(array $form): void
    {
        if (!empty($form['id'])) {
            $count = $this->db->get_where('forms', ['id' => $form['id']])->num_rows();
            if (!$count) {
                throw new InvalidArgumentException('The provided form ID does not exist in the database.');
            }
        }

        if (empty($form['name'])) {
            throw new InvalidArgumentException('Form name is required.');
        }
    }

    public function save(array $form): int
    {
        $this->validate($form);

        if (empty($form['id'])) {
            return $this->insert($form);
        }

        return $this->update($form);
    }

    public function insert(array $form): int
    {
        $form['create_datetime'] = date('Y-m-d H:i:s');
        $form['update_datetime'] = date('Y-m-d H:i:s');
        $form['slug'] = $this->build_unique_slug($form['slug'] ?? $form['name']);

        if (!$this->db->insert('forms', $form)) {
            throw new RuntimeException('Could not insert form.');
        }

        return $this->db->insert_id();
    }

    public function update(array $form): int
    {
        $form['update_datetime'] = date('Y-m-d H:i:s');

        if (!empty($form['name'])) {
            $form['slug'] = $this->build_unique_slug($form['slug'] ?? $form['name'], (int) $form['id']);
        }

        if (!$this->db->update('forms', $form, ['id' => $form['id']])) {
            throw new RuntimeException('Could not update form.');
        }

        return (int) $form['id'];
    }

    public function delete(int $form_id): void
    {
        $this->db->update('forms', ['is_active' => 0], ['id' => $form_id]);
    }

    public function find(int $form_id): array
    {
        $form = $this->db->get_where('forms', ['id' => $form_id])->row_array();

        if (!$form) {
            throw new InvalidArgumentException('The provided form ID was not found in the database.');
        }

        $this->cast($form);

        return $form;
    }

    public function find_by_slug(string $slug): ?array
    {
        $form = $this->db->get_where('forms', ['slug' => $slug])->row_array();

        if (!$form) {
            return null;
        }

        $this->cast($form);

        return $form;
    }

    public function find_all(): array
    {
        $forms = $this->db
            ->where('is_active', 1)
            ->order_by('name')
            ->get('forms')
            ->result_array();

        foreach ($forms as &$form) {
            $this->cast($form);
        }

        return $forms;
    }

    public function find_by_ids(array $ids, bool $active_only = false): array
    {
        if (!$ids) {
            return [];
        }

        $this->db->from('forms')->where_in('id', $ids)->order_by('name');

        if ($active_only) {
            $this->db->where('is_active', 1);
        }

        $forms = $this->db->get()->result_array();

        foreach ($forms as &$form) {
            $this->cast($form);
        }

        return $forms;
    }

    protected function build_unique_slug(string $value, ?int $exclude_id = null): string
    {
        $base = $this->slugify($value);

        if ($base === '') {
            $base = 'form';
        }

        $slug = $base;
        $suffix = 2;

        while ($this->slug_exists($slug, $exclude_id)) {
            $slug = $base . '-' . $suffix;
            $suffix++;
        }

        return $slug;
    }

    protected function slug_exists(string $slug, ?int $exclude_id = null): bool
    {
        $this->db->from('forms')->where('slug', $slug);

        if ($exclude_id) {
            $this->db->where('id !=', $exclude_id);
        }

        return $this->db->count_all_results() > 0;
    }

    protected function slugify(string $value): string
    {
        $slug = strtolower(trim($value));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');

        return $slug ?: '';
    }
}
