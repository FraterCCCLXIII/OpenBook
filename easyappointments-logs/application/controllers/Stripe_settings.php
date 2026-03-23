<?php defined('BASEPATH') or exit('No direct script access allowed');

class Stripe_settings extends EA_Controller
{
    public function __construct()
    {
        parent::__construct();

        if (!can('view', PRIV_SYSTEM_SETTINGS)) {
            redirect('login');
        }

        $this->load->model('settings_model');
    }

    public function index()
    {
        $user_id = (int)session('user_id');
        $user_display_name = $this->accounts->get_user_display_name($user_id);

        html_vars([
            'page_title' => lang('stripe'),
            'active_menu' => PRIV_SYSTEM_SETTINGS,
            'stripe_enabled' => setting('stripe_enabled'),
            'stripe_publishable_key' => setting('stripe_publishable_key'),
            'stripe_secret_key' => setting('stripe_secret_key'),
            'stripe_webhook_secret' => setting('stripe_webhook_secret'),
            'stripe_currency' => setting('stripe_currency', 'USD'),
            'user_display_name' => $user_display_name,
            'role_slug' => session('role_slug'),
        ]);

        $this->load->view('pages/stripe_settings', [
            'active_menu' => PRIV_SYSTEM_SETTINGS,
            'user_display_name' => $user_display_name,
            'stripe_enabled' => setting('stripe_enabled'),
            'stripe_publishable_key' => setting('stripe_publishable_key'),
            'stripe_secret_key' => setting('stripe_secret_key'),
            'stripe_webhook_secret' => setting('stripe_webhook_secret'),
            'stripe_currency' => setting('stripe_currency', 'USD'),
        ]);
    }

    public function save()
    {
        try {
            if (cannot('edit', PRIV_SYSTEM_SETTINGS)) {
                abort(403, 'Forbidden');
            }

            $settings = [
                'stripe_enabled' => request('stripe_enabled') ? '1' : '0',
                'stripe_publishable_key' => request('stripe_publishable_key'),
                'stripe_secret_key' => request('stripe_secret_key'),
                'stripe_webhook_secret' => request('stripe_webhook_secret'),
                'stripe_currency' => request('stripe_currency'),
            ];

            setting($settings);

            json_response(['success' => true]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }
}
