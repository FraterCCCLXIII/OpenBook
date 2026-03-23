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

class Migration_Add_service_area_zip_tables extends EA_Migration
{
    public function up(): void
    {
        if (!$this->db->table_exists('geonames_postal_codes')) {
            $this->dbforge->add_field([
                'id' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'auto_increment' => true,
                ],
                'country_code' => [
                    'type' => 'VARCHAR',
                    'constraint' => 2,
                    'null' => false,
                ],
                'postal_code' => [
                    'type' => 'VARCHAR',
                    'constraint' => 20,
                    'null' => false,
                ],
                'place_name' => [
                    'type' => 'VARCHAR',
                    'constraint' => 180,
                    'null' => true,
                ],
                'admin_name1' => [
                    'type' => 'VARCHAR',
                    'constraint' => 180,
                    'null' => true,
                ],
                'admin_code1' => [
                    'type' => 'VARCHAR',
                    'constraint' => 20,
                    'null' => true,
                ],
                'admin_name2' => [
                    'type' => 'VARCHAR',
                    'constraint' => 180,
                    'null' => true,
                ],
                'admin_code2' => [
                    'type' => 'VARCHAR',
                    'constraint' => 20,
                    'null' => true,
                ],
                'latitude' => [
                    'type' => 'DECIMAL',
                    'constraint' => '10,7',
                    'null' => true,
                ],
                'longitude' => [
                    'type' => 'DECIMAL',
                    'constraint' => '10,7',
                    'null' => true,
                ],
            ]);

            $this->dbforge->add_key('id', true);
            $this->dbforge->add_key(['country_code', 'postal_code']);
            $this->dbforge->create_table('geonames_postal_codes', true, ['engine' => 'InnoDB']);
        }

        if (!$this->db->table_exists('service_area_zips')) {
            $this->dbforge->add_field([
                'id' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'auto_increment' => true,
                ],
                'create_datetime' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'update_datetime' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'country_code' => [
                    'type' => 'VARCHAR',
                    'constraint' => 2,
                    'null' => false,
                ],
                'postal_code' => [
                    'type' => 'VARCHAR',
                    'constraint' => 20,
                    'null' => false,
                ],
                'custom_label' => [
                    'type' => 'VARCHAR',
                    'constraint' => 255,
                    'null' => true,
                ],
            ]);

            $this->dbforge->add_key('id', true);
            $this->dbforge->add_key(['country_code', 'postal_code']);
            $this->dbforge->create_table('service_area_zips', true, ['engine' => 'InnoDB']);
        }

        if (!$this->db->table_exists('provider_service_area_zips')) {
            $this->dbforge->add_field([
                'id' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'auto_increment' => true,
                ],
                'create_datetime' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'update_datetime' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'id_users_provider' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'null' => false,
                ],
                'id_service_area_zips' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'null' => false,
                ],
            ]);

            $this->dbforge->add_key('id', true);
            $this->dbforge->add_key('id_users_provider');
            $this->dbforge->add_key('id_service_area_zips');
            $this->dbforge->add_key(['id_users_provider', 'id_service_area_zips']);
            $this->dbforge->create_table('provider_service_area_zips', true, ['engine' => 'InnoDB']);
        }

        if (!$this->db->field_exists('service_area_only', 'services')) {
            $this->dbforge->add_column('services', [
                'service_area_only' => [
                    'type' => 'TINYINT',
                    'constraint' => 1,
                    'default' => 0,
                ],
            ]);
        }

        if (!$this->db->get_where('settings', ['name' => 'default_service_area_country'])->num_rows()) {
            $this->db->insert('settings', [
                'create_datetime' => date('Y-m-d H:i:s'),
                'update_datetime' => date('Y-m-d H:i:s'),
                'name' => 'default_service_area_country',
                'value' => 'US',
            ]);
        }
    }

    public function down(): void
    {
        if ($this->db->get_where('settings', ['name' => 'default_service_area_country'])->num_rows()) {
            $this->db->delete('settings', ['name' => 'default_service_area_country']);
        }

        if ($this->db->field_exists('service_area_only', 'services')) {
            $this->dbforge->drop_column('services', 'service_area_only');
        }

        if ($this->db->table_exists('provider_service_area_zips')) {
            $this->dbforge->drop_table('provider_service_area_zips');
        }

        if ($this->db->table_exists('service_area_zips')) {
            $this->dbforge->drop_table('service_area_zips');
        }

        if ($this->db->table_exists('geonames_postal_codes')) {
            $this->dbforge->drop_table('geonames_postal_codes');
        }
    }
}
