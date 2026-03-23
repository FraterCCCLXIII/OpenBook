# Customer Login & OTP Security Rules

This document outlines the security policies and logic implemented for customer authentication and profile management.

## 1. Authentication Modes
The system supports three customer login modes, configurable in the Admin Settings:
- **No login required**: Customers can book as guests. Sensitive actions (viewing/modifying existing bookings) require an email OTP.
- **Email + Password**: Standard credential-based login.
- **Email + OTP code**: Passwordless login where a 6-digit code is sent to the customer's email for every session.

## 2. OTP Policy (One-Time Passcode)
- **Format**: 6-digit numeric code.
- **Expiry**: Codes expire after **5 minutes**.
- **Usage**: One-time use only; invalidated immediately upon successful verification.
- **Generation**: Cryptographically secure random integers (`random_int`), stored as salted hashes.

## 3. Rate Limiting & Lockouts
To prevent brute-force attacks and email spamming, the following rules apply:
- **Verification Attempts**: 3 failed code entries within a 10-minute window will trigger a lockout.
- **Resend Limits**: A maximum of 3 OTP emails can be requested within a 10-minute window.
- **Freeze Duration**: Upon hitting either limit, the account/email is frozen for **5 minutes**.
- **UI Feedback**: A live countdown timer is displayed during the lockout period, and action buttons are disabled.

## 4. Mode Transitions (OTP to Password)
If the administrator switches the system from **OTP** to **Password** mode:
- Customers without a set password must first verify their identity via **OTP**.
- Upon successful OTP verification, they are redirected to a mandatory **Create Password** page.
- Access to the dashboard or booking flow is restricted until a password is created.

## 5. Profile Management Security
- **Email Changes**: Changing an account email address requires OTP verification sent to the **new** address.
- **Password Changes**: Changing a password requires OTP verification sent to the **current** email address.
- **OTP-Only Accounts**: If the system is in OTP mode, all password-related fields (current password, new password) are hidden from the customer profile to prevent confusion.

## 6. Booking Flow Optimization
- **Step Skipping**: If a customer is logged in and their profile is complete (First Name, Last Name, and Address are filled), the "Customer Information" step is automatically skipped during the booking wizard.
- **Renumbering**: When a step is skipped, the UI renumbers subsequent steps to maintain a logical 1-2-3 sequence for the user.
