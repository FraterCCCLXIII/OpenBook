import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/HomePage';
import { BookPage } from './pages/BookPage';
import { CustomerLoginPage } from './pages/customer/CustomerLoginPage';
import { CustomerAccountPage } from './pages/customer/CustomerAccountPage';
import { StaffLoginPage } from './pages/staff/StaffLoginPage';
import { StaffDashboardPage } from './pages/staff/StaffDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/customer/login" element={<CustomerLoginPage />} />
          <Route path="/customer/account" element={<CustomerAccountPage />} />
          <Route path="/staff/login" element={<StaffLoginPage />} />
          <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
