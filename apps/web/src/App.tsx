import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  StaffSettingsLayout,
  StaffSettingsSectionPage,
} from './pages/staff/settings/StaffSettingsSections';
import { PublicLayout } from './layouts/PublicLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { StaffShell } from './layouts/StaffShell';
import { BookPage } from './pages/BookPage';
import { CustomerLoginPage } from './pages/customer/CustomerLoginPage';
import { CustomerRegisterPage } from './pages/customer/CustomerRegisterPage';
import { CustomerCreatePasswordPage } from './pages/customer/CustomerCreatePasswordPage';
import { CustomerDashboardPage } from './pages/customer/CustomerDashboardPage';
import { CustomerAccountPage } from './pages/customer/CustomerAccountPage';
import { CustomerBookingDetailPage } from './pages/customer/CustomerBookingDetailPage';
import { CustomerBookingsPage } from './pages/customer/CustomerBookingsPage';
import { CustomerConsentsPage } from './pages/customer/CustomerConsentsPage';
import { CustomerFormsPage } from './pages/customer/CustomerFormsPage';
import { useAuth } from './auth/AuthContext';
import { StaffLoginPage } from './pages/staff/StaffLoginPage';
import { StaffDashboardPage } from './pages/staff/StaffDashboardPage';
import { StaffCustomerDetailPage } from './pages/staff/StaffCustomerDetailPage';
import { StaffProviderDetailPage } from './pages/staff/StaffProviderDetailPage';
import { StaffProviderBookingDetailPage } from './pages/staff/StaffProviderBookingDetailPage';
import {
  StaffAdminsPage,
  StaffCustomersPage,
  StaffLogsPage,
  StaffProviderBookingsPage,
  StaffProvidersPage,
  StaffSecretariesPage,
  StaffServiceCategoriesPage,
  StaffServicesPage,
  StaffAccountPage,
} from './pages/staff/staffPages';

// Heavy pages — code-split to reduce initial bundle size
const StaffCalendarPage = lazy(() =>
  import('./pages/staff/StaffCalendarPage').then((m) => ({ default: m.StaffCalendarPage })),
);
const StaffBillingPage = lazy(() =>
  import('./pages/staff/StaffBillingPage').then((m) => ({ default: m.StaffBillingPage })),
);
const StaffFormsPage = lazy(() =>
  import('./pages/staff/StaffFormsPage').then((m) => ({ default: m.StaffFormsPage })),
);
const StaffWebhooksPage = lazy(() =>
  import('./pages/staff/StaffWebhooksPage').then((m) => ({ default: m.StaffWebhooksPage })),
);
const CustomerFormDetailPage = lazy(() =>
  import('./pages/customer/CustomerFormDetailPage').then((m) => ({
    default: m.CustomerFormDetailPage,
  })),
);

const Loading = () => (
  <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
    Loading…
  </div>
);

/** Redirects logged-in customers to their dashboard; others see the login page. */
function RootPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.kind === 'customer') return <Navigate to="/customer/dashboard" replace />;
  return <CustomerLoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<PublicLayout />}>
            {/* Public / unauthenticated */}
            <Route path="/" element={<RootPage />} />
            <Route path="/book" element={<BookPage />} />
            <Route path="/customer/login" element={<CustomerLoginPage />} />
            <Route path="/customer/register" element={<CustomerRegisterPage />} />
            <Route path="/customer/create-password" element={<CustomerCreatePasswordPage />} />

            {/* Customer portal — auth-guarded, inherits PublicLayout nav */}
            <Route element={<CustomerLayout />}>
              <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
              <Route path="/customer/account" element={<CustomerAccountPage />} />
              <Route path="/customer/bookings/:id" element={<CustomerBookingDetailPage />} />
              <Route path="/customer/bookings" element={<CustomerBookingsPage />} />
              <Route path="/customer/forms" element={<CustomerFormsPage />} />
              <Route path="/customer/forms/:formId" element={<CustomerFormDetailPage />} />
              <Route path="/customer/consents" element={<CustomerConsentsPage />} />
            </Route>
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
            <Route path="/staff/providers/:id" element={<StaffProviderDetailPage />} />
            <Route path="/staff/providers" element={<StaffProvidersPage />} />
            <Route path="/staff/secretaries" element={<StaffSecretariesPage />} />
            <Route path="/staff/admins" element={<StaffAdminsPage />} />
            <Route path="/staff/forms" element={<StaffFormsPage />} />
            <Route path="/staff/webhooks" element={<StaffWebhooksPage />} />
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
      </Suspense>
    </BrowserRouter>
  );
}
