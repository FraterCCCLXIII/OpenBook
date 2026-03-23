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
 * User files model.
 *
 * Handles all the database operations of the user files resource.
 *
 * @package Models
 */
class User_files_model extends EA_Model
{
    /**
     * @var array
     */
    protected array $casts = [
        'id' => 'integer',
        'id_users' => 'integer',
        'file_size' => 'integer',
    ];

    /**
     * @var array
     */
    protected array $phi_fields = [
        'file_name',
    ];

    /**
     * Insert a new file record.
     *
     * @param array $file
     *
     * @return int
     */
    public function insert(array $file): int
    {
        $file['create_datetime'] = date('Y-m-d H:i:s');

        $this->encrypt_phi_fields($file, $this->phi_fields);

        if (!$this->db->insert('user_files', $file)) {
            throw new RuntimeException('Could not insert user file.');
        }

        return $this->db->insert_id();
    }

    /**
     * Delete a file record.
     *
     * @param int $file_id
     */
    public function delete(int $file_id): void
    {
        $this->db->delete('user_files', ['id' => $file_id]);
    }

    /**
     * Get a single file record.
     *
     * @param int $file_id
     *
     * @return array
     */
    public function find(int $file_id): array
    {
        $file = $this->db->get_where('user_files', ['id' => $file_id])->row_array();

        if (!$file) {
            throw new InvalidArgumentException('The provided user file ID was not found in the database.');
        }

        $this->cast($file);
        $this->decrypt_phi_fields($file, $this->phi_fields);

        return $file;
    }

    /**
     * List files for a user.
     *
     * @param int $user_id
     *
     * @return array
     */
    public function find_for_user(int $user_id): array
    {
        $files = $this->db
            ->order_by('create_datetime', 'DESC')
            ->get_where('user_files', ['id_users' => $user_id])
            ->result_array();

        foreach ($files as &$file) {
            $this->cast($file);
            $this->decrypt_phi_fields($file, $this->phi_fields);
        }

        return $files;
    }
}
