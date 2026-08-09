import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentDashboard from './pages/student/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import MessOwnerDashboard from './pages/mess-owner/Dashboard';
import MessOwnerMyMess from './pages/mess-owner/MyMess';
import MessOwnerMenu from './pages/mess-owner/Menu';
import MessOwnerRequests from './pages/mess-owner/Requests';
import MessOwnerReviews from './pages/mess-owner/Reviews';
import MessOwnerRevenue from './pages/mess-owner/Revenue';
import StudentHostels from './pages/student/Hostels';
import StudentMess from './pages/student/Mess';
import StudentMyRoom from './pages/student/MyRoom';
import StudentPayments from './pages/student/Payments';
import StudentComplaints from './pages/student/Complaints';
import StudentFeedback from './pages/student/Feedback';
import StudentNotifications from './pages/student/Notifications';
import StudentSettings from './pages/student/Settings';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ModulePlaceholder from './components/ModulePlaceholder';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getDashboardPath } from './lib/navigation';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Catch-all: authenticated users land on their role dashboard (never the
 * login page — that was the "menus throw me to login" bug), guests go to login.
 */
function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={user ? getDashboardPath(user.role) : '/login'} replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Layout />}>
            {/* Student */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
              path="/student/dashboard"
            />
            <Route
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentHostels />
                </ProtectedRoute>
              }
              path="/student/hostels"
            />
            <Route
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentMess />
                </ProtectedRoute>
              }
              path="/student/mess"
            />
            <Route
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentMyRoom />
                </ProtectedRoute>
              }
              path="/student/room"
            />
            <Route
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentPayments />
                </ProtectedRoute>
              }
              path="/student/payments"
            />
            <Route
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentComplaints />
                </ProtectedRoute>
              }
              path="/student/complaints"
            />
            <Route
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentFeedback />
                </ProtectedRoute>
              }
              path="/student/feedback"
            />
            <Route
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentNotifications />
                </ProtectedRoute>
              }
              path="/student/notifications"
            />
            <Route
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentSettings />
                </ProtectedRoute>
              }
              path="/student/settings"
            />
            {/* Admin */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
              path="/admin/dashboard"
            />
            {/* Admin module routes — registered so sidebar navigation visibly
                works; real pages land with the admin module (next build step). */}
            {(
              [
                [
                  '/admin/students',
                  'Students',
                  'Manage hostel students, allocations and profiles.',
                ],
                ['/admin/rooms', 'Rooms', 'Manage rooms, occupancy and allocations.'],
                ['/admin/hostel', 'Hostel Info', 'Edit your hostel&apos;s details and facilities.'],
                ['/admin/mess', 'Mess Management', 'Manage the hostel mess and its menu.'],
                [
                  '/admin/complaints',
                  'Complaints',
                  'Track and resolve student complaints (kanban).',
                ],
                ['/admin/payments', 'Payments', 'Review and confirm student payments.'],
                ['/admin/reports', 'Reports', 'Export PDF / Excel reports.'],
                ['/admin/analytics', 'Analytics', 'Charts and insights across the hostel.'],
                ['/admin/settings', 'Settings', 'Admin account and hostel settings.'],
              ] as const
            ).map(([path, title, description]) => (
              <Route
                key={path}
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ModulePlaceholder title={title} description={description} />
                  </ProtectedRoute>
                }
                path={path}
              />
            ))}
            {/* Mess Owner */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['mess_owner']}>
                  <MessOwnerDashboard />
                </ProtectedRoute>
              }
              path="/mess-owner/dashboard"
            />
            <Route
              element={
                <ProtectedRoute allowedRoles={['mess_owner']}>
                  <MessOwnerMyMess />
                </ProtectedRoute>
              }
              path="/mess-owner/profile"
            />
            <Route
              element={
                <ProtectedRoute allowedRoles={['mess_owner']}>
                  <MessOwnerMenu />
                </ProtectedRoute>
              }
              path="/mess-owner/menu"
            />
            <Route
              element={
                <ProtectedRoute allowedRoles={['mess_owner']}>
                  <MessOwnerRequests />
                </ProtectedRoute>
              }
              path="/mess-owner/subscriptions"
            />
            <Route
              element={
                <ProtectedRoute allowedRoles={['mess_owner']}>
                  <MessOwnerReviews />
                </ProtectedRoute>
              }
              path="/mess-owner/reviews"
            />
            <Route
              element={
                <ProtectedRoute allowedRoles={['mess_owner']}>
                  <MessOwnerRevenue />
                </ProtectedRoute>
              }
              path="/mess-owner/revenue"
            />
            <Route
              element={
                <ProtectedRoute allowedRoles={['mess_owner']}>
                  <MessOwnerMyMess />
                </ProtectedRoute>
              }
              path="/mess-owner/settings"
            />
          </Route>
          <Route path="*" element={<RootRedirect />} />
        </Routes>
        <Toaster position="top-right" richColors theme="system" />
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
