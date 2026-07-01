import { Routes, Route, Navigate } from 'react-router-dom';
import { AppNavMenu } from './components/AppNavMenu';
import HomePage from './pages/HomePage';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import OrdersPage from './pages/OrdersPage';
import SettingsPage from './pages/SettingsPage';
import BillingPage from './pages/BillingPage';

export default function App() {
  return (
    <>
      <AppNavMenu />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
