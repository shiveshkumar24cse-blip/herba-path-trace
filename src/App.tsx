import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/auth/AuthForm";
import AggregatorDashboard from "./pages/AggregatorDashboard";
import ConsumerPortal from "./pages/ConsumerPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthForm />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthForm />;
  }

  // Redirect to appropriate dashboard based on role
  const getDashboardRoute = (role: string) => {
    switch (role) {
      case 'aggregator':
        return '/aggregator';
      case 'consumer':
        return '/consumer';
      case 'lab':
        return '/lab';
      case 'factory':
        return '/factory';
      case 'farmer':
      case 'wild_collector':
        return '/collector';
      case 'admin':
        return '/admin';
      default:
        return '/consumer';
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to={getDashboardRoute(profile.role)} replace />} />
      <Route 
        path="/aggregator" 
        element={
          <ProtectedRoute allowedRoles={['aggregator', 'admin']}>
            <AggregatorDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/consumer" 
        element={
          <ProtectedRoute>
            <ConsumerPortal />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
