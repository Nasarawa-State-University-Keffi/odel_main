import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Loader } from "./components/ui/loader";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";


const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Auth/Login"));
const Register = lazy(() => import("./pages/Auth/Register"));
const ForgotPassword = lazy(() => import("./pages/Auth/ForgotPassword"));
const Application = lazy(() => import("./pages/applicationJourney/Application"));
const Dashboard = lazy(() => import("./pages/applicationJourney/Dashboard"));
const DataCorrection = lazy(() => import("./pages/applicationJourney/DataCorrection"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminStaffs = lazy(() => import("./pages/admin/Staffs"));
const AdminApplications = lazy(() => import("./pages/admin/Applications"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const MFAVerification = lazy(() => import("./pages/admin/MFAVerification"));

const queryClient = new QueryClient();

import OfflineBanner from "./components/OfflineBanner";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Loader fullscreen size="lg" text="Getting Ready..." />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/api/auth/login" element={<Login />} />
              <Route path="/api/auth/register" element={<Register />} />
              <Route path="/api/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/application" element={<Application />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/data-correction" element={<DataCorrection />} />

              {/* Admin Login (not protected) */}
              <Route path="/api/auth/admin/login" element={<AdminLogin />} />
              <Route path="/api/auth/admin/verify-mfa" element={<MFAVerification />} />

              {/* Protected Admin Routes */}
              <Route
                path="/api/admin/dashboard"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="staffs" element={<AdminStaffs />} />
                <Route path="applications" element={<AdminApplications />} />
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute requireSuperAdmin={true}>
                      <AdminSettings />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
