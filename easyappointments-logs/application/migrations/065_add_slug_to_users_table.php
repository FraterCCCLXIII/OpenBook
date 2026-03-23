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

class Migration_Add_slug_to_users_table extends EA_Migration
{
    /**
     * Upgrade method.
     */
    public function up(): void
    {
        $this->load->helper('string');

        if (!$this->db->field_exists('slug', 'users')) {
            $this->dbforge->add_column('users', [
                'slug' => [
                    'type' => 'VARCHAR',
                    'constraint' => 32,
                    'null' => true,
                ],
            ]);

            $this->dbforge->add_key('slug', false, true);
        }

        $users = $this->db
            ->select('id')
            ->from('users')
            ->where('(slug IS NULL OR slug = "")', null, false)
            ->get()
            ->result_array();

        foreach ($users as $user) {
            $slug = $this->generate_unique_slug('users');
            $this->db->update('users', ['slug' => $slug], ['id' => $user['id']]);
        }
    }

    /**
     * Downgrade method.
     */
    public function down(): void
    {
        if ($this->db->field_exists('slug', 'users')) {
            $this->dbforge->drop_column('users', 'slug');
        }
    }

    /**
     * Generate a unique slug for users.
     *
     * @param string $table
     * @return string
     */
    private function generate_unique_slug(string $table): string
    {
        do {
            $slug = random_string('alnum', 12);
            $exists = $this->db->get_where($table, ['slug' => $slug])->num_rows() > 0;
        } while ($exists);

        return $slug;
    }
}
