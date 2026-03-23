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
 * Appointment notes model.
 *
 * Handles all the database operations of the appointment-notes resource.
 *
 * @package Models
 */
class Appointment_notes_model extends EA_Model
{
    /**
     * @var array
     */
    protected array $casts = [
        'id' => 'integer',
        'id_appointments' => 'integer',
        'id_users_author' => 'integer',
    ];

    /**
     * @var array
     */
    protected array $api_resource = [
        'id' => 'id',
        'appointment_id' => 'id_appointments',
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
     * Save (insert or update) an appointment note.
     *
     * @param array $note Associative array with the appointment note data.
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
     * Validate the appointment note data.
     *
     * @param array $note Associative array with the appointment note data.
     *
     * @throws InvalidArgumentException
     * @throws Exception
     */
    public function validate(array $note): void
    {
        if (!empty($note['id'])) {
            $count = $this->db->get_where('appointment_notes', ['id' => $note['id']])->num_rows();

            if (!$count) {
                throw new InvalidArgumentException(
                    'The provided appointment note ID does not exist in the database: ' . $note['id'],
                );
            }
        }

        if (empty($note['id_appointments']) || empty($note['id_users_author'])) {
            throw new InvalidArgumentException(
                'Not all required fields are provided: ' . print_r($note, true),
            );
        }

        if (!array_key_exists('note', $note) || trim((string) $note['note']) === '') {
            throw new InvalidArgumentException('The note cannot be empty.');
        }
    }

    /**
     * Insert a new appointment note into the database.
     *
     * @param array $note Associative array with the appointment note data.
     *
     * @return int Returns the appointment note ID.
     *
     * @throws RuntimeException
     */
    protected function insert(array $note): int
    {
        $note['create_datetime'] = date('Y-m-d H:i:s');
        $note['update_datetime'] = date('Y-m-d H:i:s');

        $this->encrypt_phi_fields($note, $this->phi_fields);

        if (!$this->db->insert('appointment_notes', $note)) {
            throw new RuntimeException('Could not insert appointment note.');
        }

        return $this->db->insert_id();
    }

    /**
     * Update an existing appointment note.
     *
     * @param array $note Associative array with the appointment note data.
     *
     * @return int Returns the appointment note ID.
     *
     * @throws RuntimeException
     */
    protected function update(array $note): int
    {
        $note['update_datetime'] = date('Y-m-d H:i:s');

        $this->encrypt_phi_fields($note, $this->phi_fields);

        if (!$this->db->update('appointment_notes', $note, ['id' => $note['id']])) {
            throw new RuntimeException('Could not update appointment note.');
        }

        return $note['id'];
    }

    /**
     * Get a specific appointment note from the database.
     *
     * @param int $note_id The ID of the record to be returned.
     *
     * @return array Returns an array with the appointment note data.
     *
     * @throws InvalidArgumentException
     */
    public function find(int $note_id): array
    {
        $note = $this->db->get_where('appointment_notes', ['id' => $note_id])->row_array();

        if (!$note) {
            throw new InvalidArgumentException(
                'The provided appointment note ID was not found in the database: ' . $note_id,
            );
        }

        $this->cast($note);
        $this->decrypt_phi_fields($note, $this->phi_fields);

        return $note;
    }

    /**
     * Fetch an appointment note with author info.
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
                'appointment_notes.*,
                users.first_name AS author_first_name,
                users.last_name AS author_last_name,
                users.email AS author_email',
            )
            ->from('appointment_notes')
            ->join('users', 'users.id = appointment_notes.id_users_author', 'left')
            ->where('appointment_notes.id', $note_id)
            ->get()
            ->row_array();

        if (!$note) {
            throw new InvalidArgumentException(
                'The provided appointment note ID was not found in the database: ' . $note_id,
            );
        }

        $this->cast($note);
        $this->decrypt_phi_fields($note, $this->phi_fields);
        $this->decrypt_phi_fields($note, $this->author_phi_fields);

        return $note;
    }

    /**
     * Get all notes for an appointment.
     *
     * @param int $appointment_id
     *
     * @return array
     */
    public function get_by_appointment(int $appointment_id): array
    {
        $notes = $this->db
            ->select(
                'appointment_notes.*,
                users.first_name AS author_first_name,
                users.last_name AS author_last_name,
                users.email AS author_email',
            )
            ->from('appointment_notes')
            ->join('users', 'users.id = appointment_notes.id_users_author', 'left')
            ->where('appointment_notes.id_appointments', $appointment_id)
            ->order_by('appointment_notes.create_datetime', 'DESC')
            ->get()
            ->result_array();

        foreach ($notes as &$note) {
            $this->cast($note);
            $this->decrypt_phi_fields($note, $this->phi_fields);
            $this->decrypt_phi_fields($note, $this->author_phi_fields);
        }

        return $notes;
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
                'appointment_notes.*,
                appointments.start_datetime AS appointment_start_datetime,
                services.name AS service_name,
                users.first_name AS author_first_name,
                users.last_name AS author_last_name,
                users.email AS author_email',
            )
            ->from('appointment_notes')
            ->join('appointments', 'appointments.id = appointment_notes.id_appointments', 'left')
            ->join('services', 'services.id = appointments.id_services', 'left')
            ->join('users', 'users.id = appointment_notes.id_users_author', 'left')
            ->where('appointments.id_users_customer', $customer_id)
            ->order_by('appointments.start_datetime', 'DESC')
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
