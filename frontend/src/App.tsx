import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { POSPage } from './pages/POSPage';
import { InventoryPage } from './pages/InventoryPage';
import { LowStockPage } from './pages/LowStockPage';
import { DashboardPage } from './pages/DashboardPage';
import { WarungSettingsPage } from './pages/WarungSettingsPage';
import { CashierManagementPage } from './pages/CashierManagementPage';

// Protected Route Guard Component
interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState<boolean>(() => {
    const saved = localStorage.getItem('warbisa_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('warbisa_sidebar_open', String(next));
      return next;
    });
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.roleName)) {
    return <Navigate to="/pos" replace />;
  }

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden">
      <Navbar isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Mobile Backdrop Overlay */}
        <div
          onClick={() => setIsSidebarOpen(false)}
          className={`md:hidden fixed inset-0 top-16 bg-slate-900/40 backdrop-blur-xs z-20 transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto transition-all duration-300 ease-in-out">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/pos" replace />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/low-stock" element={<LowStockPage />} />
          <Route path="/settings" element={<WarungSettingsPage />} />
        </Route>

        {/* Owner-Only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Owner']} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cashiers" element={<CashierManagementPage />} />
        </Route>

        {/* Fallback Wildcard */}
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
