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
 * Customer notes model.
 *
 * Handles all the database operations of the customer-notes resource.
 *
 * @package Models
 */
class Customer_notes_model extends EA_Model
{
    /**
     * @var array
     */
    protected array $casts = [
        'id' => 'integer',
        'id_users_customer' => 'integer',
        'id_users_author' => 'integer',
    ];

    /**
     * @var array
     */
    protected array $api_resource = [
        'id' => 'id',
        'customer_id' => 'id_users_customer',
        'author_id' => 'id_users_author',
        'note' => 'note',
        'create_datetime' => 'create_datetime',
        'update_datetime' => 'update_datetime',
    ];

    /**
     * @var array
     */
    protected array $phi_fields = [
        'note',
    ];

    /**
     * @var array
     */
    protected array $author_phi_fields = [
        'author_first_name',
        'author_last_name',
        'author_email',
    ];

    /**
     * Save (insert or update) a customer note.
     *
     * @param array $note Associative array with the customer note data.
     *
     * @return int Returns the note ID.
     *
     * @throws InvalidArgumentException
     * @throws Exception
     */
    public function save(array $note): int
    {
        $this->validate($note);

        if (empty($note['id'])) {
            return $this->insert($note);
        }

        return $this->update($note);
    }

    /**
     * Validate the customer note data.
     *
     * @param array $note Associative array with the customer note data.
     *
     * @throws InvalidArgumentException
     * @throws Exception
     */
    public function validate(array $note): void
    {
        if (!empty($note['id'])) {
            $count = $this->db->get_where('customer_notes', ['id' => $note['id']])->num_rows();

            if (!$count) {
                throw new InvalidArgumentException(
                    'The provided customer note ID does not exist in the database: ' . $note['id'],
                );
            }
        }

        if (empty($note['id_users_customer']) || empty($note['id_users_author'])) {
            throw new InvalidArgumentException(
                'Not all required fields are provided: ' . print_r($note, true),
            );
        }

        if (!array_key_exists('note', $note) || trim((string) $note['note']) === '') {
            throw new InvalidArgumentException('The note cannot be empty.');
        }
    }

    /**
     * Insert a new customer note into the database.
     *
     * @param array $note Associative array with the customer note data.
     *
     * @return int Returns the customer note ID.
     *
     * @throws RuntimeException
     */
    protected function insert(array $note): int
    {
        $note['create_datetime'] = date('Y-m-d H:i:s');
        $note['update_datetime'] = date('Y-m-d H:i:s');

        $this->encrypt_phi_fields($note, $this->phi_fields);

        if (!$this->db->insert('customer_notes', $note)) {
            throw new RuntimeException('Could not insert customer note.');
        }

        return $this->db->insert_id();
    }

    /**
     * Update an existing customer note.
     *
     * @param array $note Associative array with the customer note data.
     *
     * @return int Returns the customer note ID.
     *
     * @throws RuntimeException
     */
    protected function update(array $note): int
    {
        $note['update_datetime'] = date('Y-m-d H:i:s');

        $this->encrypt_phi_fields($note, $this->phi_fields);

        if (!$this->db->update('customer_notes', $note, ['id' => $note['id']])) {
            throw new RuntimeException('Could not update customer note.');
        }

        return $note['id'];
    }

    /**
     * Remove an existing customer note from the database.
     *
     * @param int $note_id Customer note ID.
     *
     * @throws RuntimeException
     */
    public function delete(int $note_id): void
    {
        $this->db->delete('customer_notes', ['id' => $note_id]);
    }

    /**
     * Get a specific customer note from the database.
     *
     * @param int $note_id The ID of the record to be returned.
     *
     * @return array Returns an array with the customer note data.
     *
     * @throws InvalidArgumentException
     */
    public function find(int $note_id): array
    {
        $note = $this->db->get_where('customer_notes', ['id' => $note_id])->row_array();

        if (!$note) {
            throw new InvalidArgumentException(
                'The provided customer note ID was not found in the database: ' . $note_id,
            );
        }

        $this->cast($note);
        $this->decrypt_phi_fields($note, $this->phi_fields);

        return $note;
    }

    /**
     * Fetch a customer note with author info.
     *
     * @param int $note_id
     *
     * @return array
     *
     * @throws InvalidArgumentException
     */
    public function find_with_author(int $note_id): array
    {
        $note = $this->db
            ->select(
                'customer_notes.*,
                users.first_name AS author_first_name,
                users.last_name AS author_last_name,
                users.email AS author_email',
            )
            ->from('customer_notes')
            ->join('users', 'users.id = customer_notes.id_users_author', 'left')
            ->where('customer_notes.id', $note_id)
            ->get()
            ->row_array();

        if (!$note) {
            throw new InvalidArgumentException(
                'The provided customer note ID was not found in the database: ' . $note_id,
            );
        }

        $this->cast($note);
        $this->decrypt_phi_fields($note, $this->phi_fields);
        $this->decrypt_phi_fields($note, $this->author_phi_fields);

        return $note;
    }

    /**
     * Get all notes for a customer.
     *
     * @param int $customer_id
     *
     * @return array
     */
    public function get_by_customer(int $customer_id): array
    {
        $notes = $this->db
            ->select(
                'customer_notes.*,
                users.first_name AS author_first_name,
                users.last_name AS author_last_name,
                users.email AS author_email',
            )
            ->from('customer_notes')
            ->join('users', 'users.id = customer_notes.id_users_author', 'left')
            ->where('customer_notes.id_users_customer', $customer_id)
            ->order_by('customer_notes.create_datetime', 'DESC')
            ->get()
            ->result_array();

        foreach ($notes as &$note) {
            $this->cast($note);
            $this->decrypt_phi_fields($note, $this->phi_fields);
            $this->decrypt_phi_fields($note, $this->author_phi_fields);
        }

        return $notes;
    }
}
