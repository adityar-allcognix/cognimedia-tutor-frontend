import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import LearnPage from "./pages/LearnPage.tsx";
import AIToolsPage from "./pages/AIToolsPage.tsx";
import AnalyticsPage from "./pages/AnalyticsPage.tsx";
import HistoryPage from "./pages/HistoryPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import SchoolAdminPage from "./pages/SchoolAdminPage.tsx";
import MaterialsPage from "./pages/MaterialsPage.tsx";
import ParentProgressPage from "./pages/ParentProgressPage.tsx";
import OnboardingPage from "./pages/OnboardingPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/learn" element={<ProtectedRoute><LearnPage /></ProtectedRoute>} />
          <Route path="/ai-tools" element={<ProtectedRoute><AIToolsPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute><MaterialsPage /></ProtectedRoute>} />
          <Route path="/school-admin" element={<RoleRoute allowed={["school_admin"]}><SchoolAdminPage /></RoleRoute>} />
          <Route path="/onboarding" element={<RoleRoute allowed={["school_admin", "teacher"]}><OnboardingPage /></RoleRoute>} />
          <Route path="/parent-progress" element={<RoleRoute allowed={["parent"]}><ParentProgressPage /></RoleRoute>} />
          <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
