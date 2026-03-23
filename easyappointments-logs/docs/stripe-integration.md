# Stripe Integration Guide

This guide explains how to configure the Stripe payment integration for Easy!Appointments.

## 1. Get Your Stripe API Keys

To process payments, you need to obtain your API keys from the Stripe Dashboard:

1.  Log in to your [Stripe Dashboard](https://dashboard.stripe.com/).
2.  Ensure you are in **Test Mode** (toggle in the top right) for initial setup.
3.  Navigate to **Developers > API keys**.
4.  Copy the **Publishable key** (starts with `pk_test_`).
5.  Copy the **Secret key** (starts with `sk_test_`).

## 2. Configure Easy!Appointments

1.  Log in to your Easy!Appointments Admin Panel.
2.  Go to **Settings > Stripe** (in the sidebar).
3.  Enable the integration.
4.  Paste your **Publishable Key** and **Secret Key**.
5.  Set your preferred **Currency** (e.g., `USD`, `EUR`).
6.  Click **Save**.

## 3. Set Up Webhooks (Required for Payment Confirmation)

Webhooks allow Stripe to notify Easy!Appointments when a payment is successful. Without this, appointments will remain in "Not Paid" status.

### How to find/create your Webhook Secret:

1.  In your Stripe Dashboard, go to **Developers > Webhooks**.
2.  Click **Add endpoint**.
3.  **Endpoint URL:** Enter `https://your-domain.com/index.php/booking/stripe_webhook` (replace `your-domain.com` with your actual URL).
4.  **Select events:** Click "Select events to listen to" and choose `checkout.session.completed`.
5.  Click **Add endpoint**.
6.  Once created, look for the **Signing secret** section on the webhook details page.
7.  Click **Reveal** to see your secret (starts with `whsec_`).
8.  Copy this value and paste it into the **Webhook Secret** field in your Easy!Appointments Stripe Settings.

## 4. Testing

1.  Go to your booking page.
2.  Select a service that has a price > 0.
3.  Complete the booking form.
4.  You should be redirected to Stripe Checkout.
5.  Use Stripe's [test card numbers](https://stripe.com/docs/testing#cards) to complete the payment.
6.  Upon success, you will be redirected back to the confirmation page, and the appointment will be marked as **Paid** in the Admin Billing tab.
