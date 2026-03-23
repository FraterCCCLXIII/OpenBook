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
 * Customer alerts model.
 *
 * Handles all the database operations of the customer-alerts resource.
 *
 * @package Models
 */
class Customer_alerts_model extends EA_Model
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
        'alert' => 'alert',
        'show_in_banner' => 'show_in_banner',
        'create_datetime' => 'create_datetime',
        'update_datetime' => 'update_datetime',
    ];

    /**
     * Save (insert or update) a customer alert.
     *
     * @param array $alert Associative array with the customer alert data.
     *
     * @return int Returns the alert ID.
     *
     * @throws InvalidArgumentException
     * @throws Exception
     */
    public function save(array $alert): int
    {
        $this->validate($alert);

        if (empty($alert['id'])) {
            return $this->insert($alert);
        }

        return $this->update($alert);
    }

    /**
     * Validate the customer alert data.
     *
     * @param array $alert Associative array with the customer alert data.
     *
     * @throws InvalidArgumentException
     * @throws Exception
     */
    public function validate(array $alert): void
    {
        if (!empty($alert['id'])) {
            $count = $this->db->get_where('customer_alerts', ['id' => $alert['id']])->num_rows();

            if (!$count) {
                throw new InvalidArgumentException(
                    'The provided customer alert ID does not exist in the database: ' . $alert['id'],
                );
            }
        }

        if (empty($alert['id_users_customer']) || empty($alert['id_users_author'])) {
            throw new InvalidArgumentException(
                'Not all required fields are provided: ' . print_r($alert, true),
            );
        }

        if (!array_key_exists('alert', $alert) || trim((string) $alert['alert']) === '') {
            throw new InvalidArgumentException('The alert cannot be empty.');
        }

        if (array_key_exists('show_in_banner', $alert)) {
            $alert['show_in_banner'] = (int) (bool) $alert['show_in_banner'];
        }
    }

    /**
     * Insert a new customer alert into the database.
     *
     * @param array $alert Associative array with the customer alert data.
     *
     * @return int Returns the customer alert ID.
     *
     * @throws RuntimeException
     */
    protected function insert(array $alert): int
    {
        $alert['create_datetime'] = date('Y-m-d H:i:s');
        $alert['update_datetime'] = date('Y-m-d H:i:s');

        if (!$this->db->insert('customer_alerts', $alert)) {
            throw new RuntimeException('Could not insert customer alert.');
        }

        return $this->db->insert_id();
    }

    /**
     * Update an existing customer alert.
     *
     * @param array $alert Associative array with the customer alert data.
     *
     * @return int Returns the customer alert ID.
     *
     * @throws RuntimeException
     */
    protected function update(array $alert): int
    {
        $alert['update_datetime'] = date('Y-m-d H:i:s');

        if (!$this->db->update('customer_alerts', $alert, ['id' => $alert['id']])) {
            throw new RuntimeException('Could not update customer alert.');
        }

        return $alert['id'];
    }

    /**
     * Remove an existing customer alert from the database.
     *
     * @param int $alert_id Customer alert ID.
     *
     * @throws RuntimeException
     */
    public function delete(int $alert_id): void
    {
        $this->db->delete('customer_alerts', ['id' => $alert_id]);
    }

    /**
     * Get a specific customer alert from the database.
     *
     * @param int $alert_id The ID of the record to be returned.
     *
     * @return array Returns an array with the customer alert data.
     *
     * @throws InvalidArgumentException
     */
    public function find(int $alert_id): array
    {
        $alert = $this->db->get_where('customer_alerts', ['id' => $alert_id])->row_array();

        if (!$alert) {
            throw new InvalidArgumentException(
                'The provided customer alert ID was not found in the database: ' . $alert_id,
            );
        }

        $this->cast($alert);

        return $alert;
    }

    /**
     * Fetch a customer alert with author info.
     *
     * @param int $alert_id
     *
     * @return array
     *
     * @throws InvalidArgumentException
     */
    public function find_with_author(int $alert_id): array
    {
        $alert = $this->db
            ->select(
                'customer_alerts.*,
                users.first_name AS author_first_name,
                users.last_name AS author_last_name,
                users.email AS author_email',
            )
            ->from('customer_alerts')
            ->join('users', 'users.id = customer_alerts.id_users_author', 'left')
            ->where('customer_alerts.id', $alert_id)
            ->get()
            ->row_array();

        if (!$alert) {
            throw new InvalidArgumentException(
                'The provided customer alert ID was not found in the database: ' . $alert_id,
            );
        }

        $this->cast($alert);

        return $alert;
    }

    /**
     * Get all alerts for a customer.
     *
     * @param int $customer_id
     *
     * @return array
     */
    public function get_by_customer(int $customer_id): array
    {
        $alerts = $this->db
            ->select(
                'customer_alerts.*,
                users.first_name AS author_first_name,
                users.last_name AS author_last_name,
                users.email AS author_email',
            )
            ->from('customer_alerts')
            ->join('users', 'users.id = customer_alerts.id_users_author', 'left')
            ->where('customer_alerts.id_users_customer', $customer_id)
            ->order_by('customer_alerts.create_datetime', 'DESC')
            ->get()
            ->result_array();

        foreach ($alerts as &$alert) {
            $this->cast($alert);
        }

        return $alerts;
    }
}
