import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  StaffSettingsLayout,
  StaffSettingsSectionPage,
} from './pages/staff/settings/StaffSettingsSections';
import { PublicLayout } from './layouts/PublicLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { StaffShell } from './layouts/StaffShell';
import { HomePage } from './pages/HomePage';
import { BookPage } from './pages/BookPage';
import { CustomerLoginPage } from './pages/customer/CustomerLoginPage';
import { CustomerRegisterPage } from './pages/customer/CustomerRegisterPage';
import { CustomerAccountPage } from './pages/customer/CustomerAccountPage';
import { CustomerBookingDetailPage } from './pages/customer/CustomerBookingDetailPage';
import { CustomerBookingsPage } from './pages/customer/CustomerBookingsPage';
import { CustomerFormsPage } from './pages/customer/CustomerFormsPage';
import { CustomerFormDetailPage } from './pages/customer/CustomerFormDetailPage';
import { StaffLoginPage } from './pages/staff/StaffLoginPage';
import { StaffDashboardPage } from './pages/staff/StaffDashboardPage';
import { StaffCustomerDetailPage } from './pages/staff/StaffCustomerDetailPage';
import { StaffProviderBookingDetailPage } from './pages/staff/StaffProviderBookingDetailPage';
import {
  StaffAdminsPage,
  StaffBillingPage,
  StaffCalendarPage,
  StaffCustomersPage,
  StaffLogsPage,
  StaffProviderBookingsPage,
  StaffProvidersPage,
  StaffSecretariesPage,
  StaffServiceCategoriesPage,
  StaffServicesPage,
  StaffAccountPage,
} from './pages/staff/staffPages';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/book" element={<BookPage />} />
        </Route>

        <Route path="/customer/login" element={<CustomerLoginPage />} />
        <Route path="/customer/register" element={<CustomerRegisterPage />} />

        <Route element={<CustomerLayout />}>
          <Route path="/customer/account" element={<CustomerAccountPage />} />
          <Route path="/customer/bookings/:id" element={<CustomerBookingDetailPage />} />
          <Route path="/customer/bookings" element={<CustomerBookingsPage />} />
          <Route path="/customer/forms" element={<CustomerFormsPage />} />
          <Route path="/customer/forms/:formId" element={<CustomerFormDetailPage />} />
        </Route>

        <Route path="/staff/login" element={<StaffLoginPage />} />

        <Route element={<StaffShell />}>
          <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
          <Route path="/staff/calendar" element={<StaffCalendarPage />} />
          <Route path="/staff/customers/:id" element={<StaffCustomerDetailPage />} />
          <Route path="/staff/customers" element={<StaffCustomersPage />} />
          <Route path="/staff/billing" element={<StaffBillingPage />} />
          <Route path="/staff/logs" element={<StaffLogsPage />} />
          <Route path="/staff/services" element={<StaffServicesPage />} />
          <Route path="/staff/service-categories" element={<StaffServiceCategoriesPage />} />
          <Route path="/staff/providers" element={<StaffProvidersPage />} />
          <Route path="/staff/secretaries" element={<StaffSecretariesPage />} />
          <Route path="/staff/admins" element={<StaffAdminsPage />} />
          <Route path="/staff/settings" element={<StaffSettingsLayout />}>
            <Route index element={<Navigate to="general" replace />} />
            <Route path=":section" element={<StaffSettingsSectionPage />} />
          </Route>
          <Route path="/staff/account" element={<StaffAccountPage />} />
          <Route path="/staff/provider/bookings/:id" element={<StaffProviderBookingDetailPage />} />
          <Route path="/staff/provider/bookings" element={<StaffProviderBookingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
