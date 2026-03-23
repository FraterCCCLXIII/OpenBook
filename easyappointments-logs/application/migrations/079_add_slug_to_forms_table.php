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

class Migration_Add_slug_to_forms_table extends EA_Migration
{
    public function up(): void
    {
        if ($this->db->table_exists('forms') && !$this->db->field_exists('slug', 'forms')) {
            $this->dbforge->add_column('forms', [
                'slug' => [
                    'type' => 'VARCHAR',
                    'constraint' => 255,
                    'null' => true,
                    'after' => 'name',
                ],
            ]);
        }

        $forms = $this->db->get('forms')->result_array();
        $used = [];

        foreach ($forms as $form) {
            $slug = $this->slugify($form['name'] ?? '');

            if ($slug === '') {
                $slug = 'form';
            }

            if (isset($used[$slug])) {
                $slug .= '-' . $form['id'];
            }

            $used[$slug] = true;

            $this->db->update('forms', ['slug' => $slug], ['id' => $form['id']]);
        }

        if (!$this->index_exists('forms', 'forms_slug_unique')) {
            $this->db->query(
                'CREATE UNIQUE INDEX forms_slug_unique ON ' . $this->db->dbprefix('forms') . ' (slug)',
            );
        }
    }

    public function down(): void
    {
        if ($this->index_exists('forms', 'forms_slug_unique')) {
            $this->db->query(
                'DROP INDEX forms_slug_unique ON ' . $this->db->dbprefix('forms'),
            );
        }

        if ($this->db->field_exists('slug', 'forms')) {
            $this->dbforge->drop_column('forms', 'slug');
        }
    }

    private function slugify(string $value): string
    {
        $slug = strtolower(trim($value));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');

        return $slug ?: '';
    }

    private function index_exists(string $table, string $index): bool
    {
        $query = $this->db->query(
            'SHOW INDEX FROM ' . $this->db->dbprefix($table) . ' WHERE Key_name = ' . $this->db->escape($index),
        );

        return $query->num_rows() > 0;
    }
}
