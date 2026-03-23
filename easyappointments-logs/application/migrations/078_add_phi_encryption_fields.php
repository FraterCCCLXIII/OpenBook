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

class Migration_Add_phi_encryption_fields extends EA_Migration
{
    public function up(): void
    {
        if ($this->db->table_exists('users')) {
            $this->drop_indexes_for_columns('users', [
                'email',
                'phone_number',
                'mobile_number',
                'first_name',
                'last_name',
            ]);

            $hash_fields = [
                'email_hash' => [
                    'type' => 'VARCHAR',
                    'constraint' => '64',
                    'null' => true,
                    'after' => 'email',
                ],
                'phone_hash' => [
                    'type' => 'VARCHAR',
                    'constraint' => '64',
                    'null' => true,
                    'after' => 'phone_number',
                ],
                'mobile_hash' => [
                    'type' => 'VARCHAR',
                    'constraint' => '64',
                    'null' => true,
                    'after' => 'mobile_number',
                ],
                'first_name_hash' => [
                    'type' => 'VARCHAR',
                    'constraint' => '64',
                    'null' => true,
                    'after' => 'first_name',
                ],
                'last_name_hash' => [
                    'type' => 'VARCHAR',
                    'constraint' => '64',
                    'null' => true,
                    'after' => 'last_name',
                ],
                'full_name_hash' => [
                    'type' => 'VARCHAR',
                    'constraint' => '64',
                    'null' => true,
                    'after' => 'last_name_hash',
                ],
            ];

            foreach ($hash_fields as $field => $definition) {
                if (!$this->db->field_exists($field, 'users')) {
                    $this->dbforge->add_column('users', [$field => $definition]);
                }
            }

            $text_fields = [
                'first_name' => ['type' => 'TEXT', 'null' => true],
                'last_name' => ['type' => 'TEXT', 'null' => true],
                'email' => ['type' => 'TEXT', 'null' => true],
                'mobile_number' => ['type' => 'TEXT', 'null' => true],
                'phone_number' => ['type' => 'TEXT', 'null' => true],
                'address' => ['type' => 'TEXT', 'null' => true],
                'city' => ['type' => 'TEXT', 'null' => true],
                'state' => ['type' => 'TEXT', 'null' => true],
                'zip_code' => ['type' => 'TEXT', 'null' => true],
                'ldap_dn' => ['type' => 'TEXT', 'null' => true],
            ];

            foreach ($text_fields as $field => $definition) {
                if ($this->db->field_exists($field, 'users')) {
                    $this->dbforge->modify_column('users', [$field => $definition]);
                }
            }

            if (!$this->index_exists('users', 'users_email_hash_idx')) {
                $this->db->query(
                    'CREATE INDEX users_email_hash_idx ON ' . $this->db->dbprefix('users') . ' (email_hash)',
                );
            }

            if (!$this->index_exists('users', 'users_phone_hash_idx')) {
                $this->db->query(
                    'CREATE INDEX users_phone_hash_idx ON ' . $this->db->dbprefix('users') . ' (phone_hash)',
                );
            }

            if (!$this->index_exists('users', 'users_mobile_hash_idx')) {
                $this->db->query(
                    'CREATE INDEX users_mobile_hash_idx ON ' . $this->db->dbprefix('users') . ' (mobile_hash)',
                );
            }

            if (!$this->index_exists('users', 'users_name_hash_idx')) {
                $this->db->query(
                    'CREATE INDEX users_name_hash_idx ON ' . $this->db->dbprefix('users') .
                    ' (first_name_hash, last_name_hash)',
                );
            }
        }

        if ($this->db->table_exists('customer_auth')) {
            $this->drop_indexes_for_columns('customer_auth', ['email']);

            if (!$this->db->field_exists('email_hash', 'customer_auth')) {
                $this->dbforge->add_column('customer_auth', [
                    'email_hash' => [
                        'type' => 'VARCHAR',
                        'constraint' => '64',
                        'null' => true,
                        'after' => 'email',
                    ],
                ]);
            }

            if ($this->index_exists('customer_auth', 'customer_auth_email_unique')) {
                $this->db->query(
                    'DROP INDEX customer_auth_email_unique ON ' . $this->db->dbprefix('customer_auth'),
                );
            }

            if ($this->db->field_exists('email', 'customer_auth')) {
                $this->dbforge->modify_column('customer_auth', [
                    'email' => ['type' => 'TEXT', 'null' => false],
                ]);
            }

            if (!$this->index_exists('customer_auth', 'customer_auth_email_hash_unique')) {
                $this->db->query(
                    'CREATE UNIQUE INDEX customer_auth_email_hash_unique ON ' .
                    $this->db->dbprefix('customer_auth') . ' (email_hash)',
                );
            }
        }

        if ($this->db->table_exists('customer_otp')) {
            $this->drop_indexes_for_columns('customer_otp', ['email']);

            if (!$this->db->field_exists('email_hash', 'customer_otp')) {
                $this->dbforge->add_column('customer_otp', [
                    'email_hash' => [
                        'type' => 'VARCHAR',
                        'constraint' => '64',
                        'null' => true,
                        'after' => 'email',
                    ],
                ]);
            }

            if ($this->index_exists('customer_otp', 'customer_otp_email_unique')) {
                $this->db->query(
                    'DROP INDEX customer_otp_email_unique ON ' . $this->db->dbprefix('customer_otp'),
                );
            }

            if ($this->db->field_exists('email', 'customer_otp')) {
                $this->dbforge->modify_column('customer_otp', [
                    'email' => ['type' => 'TEXT', 'null' => false],
                ]);
            }

            if (!$this->index_exists('customer_otp', 'customer_otp_email_hash_unique')) {
                $this->db->query(
                    'CREATE UNIQUE INDEX customer_otp_email_hash_unique ON ' .
                    $this->db->dbprefix('customer_otp') . ' (email_hash)',
                );
            }
        }

        if ($this->db->table_exists('user_files')) {
            if ($this->db->field_exists('file_name', 'user_files')) {
                $this->dbforge->modify_column('user_files', [
                    'file_name' => ['type' => 'TEXT', 'null' => false],
                ]);
            }
        }
    }

    public function down(): void
    {
        if ($this->db->table_exists('users')) {
            $drop_fields = [
                'email_hash',
                'phone_hash',
                'mobile_hash',
                'first_name_hash',
                'last_name_hash',
                'full_name_hash',
            ];

            foreach ($drop_fields as $field) {
                if ($this->db->field_exists($field, 'users')) {
                    $this->dbforge->drop_column('users', $field);
                }
            }

            $revert_fields = [
                'first_name' => ['type' => 'VARCHAR', 'constraint' => '512', 'null' => true],
                'last_name' => ['type' => 'VARCHAR', 'constraint' => '512', 'null' => true],
                'email' => ['type' => 'VARCHAR', 'constraint' => '512', 'null' => true],
                'mobile_number' => ['type' => 'VARCHAR', 'constraint' => '128', 'null' => true],
                'phone_number' => ['type' => 'VARCHAR', 'constraint' => '128', 'null' => true],
                'address' => ['type' => 'VARCHAR', 'constraint' => '256', 'null' => true],
                'city' => ['type' => 'VARCHAR', 'constraint' => '256', 'null' => true],
                'state' => ['type' => 'VARCHAR', 'constraint' => '128', 'null' => true],
                'zip_code' => ['type' => 'VARCHAR', 'constraint' => '64', 'null' => true],
                'ldap_dn' => ['type' => 'VARCHAR', 'constraint' => '512', 'null' => true],
            ];

            foreach ($revert_fields as $field => $definition) {
                if ($this->db->field_exists($field, 'users')) {
                    $this->dbforge->modify_column('users', [$field => $definition]);
                }
            }
        }

        if ($this->db->table_exists('customer_auth')) {
            if ($this->db->field_exists('email_hash', 'customer_auth')) {
                $this->dbforge->drop_column('customer_auth', 'email_hash');
            }

            if ($this->db->field_exists('email', 'customer_auth')) {
                $this->dbforge->modify_column('customer_auth', [
                    'email' => ['type' => 'VARCHAR', 'constraint' => '512', 'null' => false],
                ]);
            }

            if ($this->index_exists('customer_auth', 'customer_auth_email_hash_unique')) {
                $this->db->query(
                    'DROP INDEX customer_auth_email_hash_unique ON ' . $this->db->dbprefix('customer_auth'),
                );
            }

            if (!$this->index_exists('customer_auth', 'customer_auth_email_unique')) {
                $this->db->query(
                    'CREATE UNIQUE INDEX customer_auth_email_unique ON ' .
                    $this->db->dbprefix('customer_auth') . ' (email)',
                );
            }
        }

        if ($this->db->table_exists('customer_otp')) {
            if ($this->db->field_exists('email_hash', 'customer_otp')) {
                $this->dbforge->drop_column('customer_otp', 'email_hash');
            }

            if ($this->db->field_exists('email', 'customer_otp')) {
                $this->dbforge->modify_column('customer_otp', [
                    'email' => ['type' => 'VARCHAR', 'constraint' => '512', 'null' => false],
                ]);
            }

            if ($this->index_exists('customer_otp', 'customer_otp_email_hash_unique')) {
                $this->db->query(
                    'DROP INDEX customer_otp_email_hash_unique ON ' . $this->db->dbprefix('customer_otp'),
                );
            }

            if (!$this->index_exists('customer_otp', 'customer_otp_email_unique')) {
                $this->db->query(
                    'CREATE UNIQUE INDEX customer_otp_email_unique ON ' .
                    $this->db->dbprefix('customer_otp') . ' (email)',
                );
            }
        }

        if ($this->db->table_exists('user_files')) {
            if ($this->db->field_exists('file_name', 'user_files')) {
                $this->dbforge->modify_column('user_files', [
                    'file_name' => ['type' => 'VARCHAR', 'constraint' => '255', 'null' => false],
                ]);
            }
        }
    }

    private function index_exists(string $table, string $index): bool
    {
        $query = $this->db->query(
            'SHOW INDEX FROM ' . $this->db->dbprefix($table) . ' WHERE Key_name = ' . $this->db->escape($index),
        );

        return $query->num_rows() > 0;
    }

    private function drop_indexes_for_columns(string $table, array $columns): void
    {
        $query = $this->db->query('SHOW INDEX FROM ' . $this->db->dbprefix($table));

        $indexes = [];
        foreach ($query->result_array() as $row) {
            if (!in_array($row['Column_name'], $columns, true)) {
                continue;
            }

            $key_name = $row['Key_name'];
            if ($key_name === 'PRIMARY') {
                continue;
            }

            $indexes[$key_name] = true;
        }

        foreach (array_keys($indexes) as $index) {
            $this->db->query(
                'DROP INDEX ' . $this->db->escape_str($index) . ' ON ' . $this->db->dbprefix($table),
            );
        }
    }
}
