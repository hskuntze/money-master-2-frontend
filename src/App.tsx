import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import AppLayout from "@/components/AppLayout";
import PrivateRoute from "@/PrivateRoute";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import ChatPage from "@/pages/Chat";
import TransactionsPage from "@/pages/Transactions";
import AccountsPage from "@/pages/Accounts";
import CategoriesPage from "@/pages/Categories";
import SavingsJarsPage from "@/pages/SavingsJars";
import MonthlyPeriodsPage from "@/pages/MonthlyPeriods";
import ReportsPage from "@/pages/Reports";
import ThemeSettingsPage from "@/pages/ThemeSettings";
import SystemAdminPage from "@/pages/SystemAdmin";
import NotFound from "@/pages/NotFound";
import { setupInterceptors } from "@/utils/interceptor";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    setupInterceptors(navigate);
  }, [navigate]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/recover-password" element={<AuthPage mode="recover" />} />
        <Route path="/confirm-email" element={<AuthPage mode="confirm" />} />

        <Route
          path="/app"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="savings-jars" element={<SavingsJarsPage />} />
          <Route path="monthly-periods" element={<MonthlyPeriodsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route
            path="theme"
            element={
              <PrivateRoute permissions={["THEME_MANAGE"]}>
                <ThemeSettingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="system"
            element={
              <PrivateRoute permissions={["LOG_READ", "EMAIL_SETTINGS_MANAGE"]}>
                <SystemAdminPage />
              </PrivateRoute>
            }
          />
          <Route path="denied" element={<NotFound type="denied" />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3500} theme="light" />
    </>
  );
}

export default App;
