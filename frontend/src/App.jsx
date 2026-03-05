import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar    from "./components/layout/Sidebar";
import Dashboard  from "./pages/Dashboard";
import Leads      from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Analytics  from "./pages/Analytics";
import Login      from "./pages/Login";
import ArchivedLeads from "./pages/ArchivedLeads";

// ── Protected layout wrapper ──────────────────
const AppLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent
                          rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading Mini CRM...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

// ── Public route — redirect if already logged in ──
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

// ── Root App ──────────────────────────────────
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#1e293b",
            color: "#f1f5f9",
            borderRadius: "12px",
            fontSize: "14px",
            padding: "12px 16px",
          },
          success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Protected */}
        <Route element={<AppLayout />}>
          <Route index         element={<Dashboard  />} />
          <Route path="leads"  element={<Leads      />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="archived"    element={<ArchivedLeads />} /> 
          <Route path="analytics" element={<Analytics  />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;