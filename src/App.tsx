import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Stats from "./pages/Stats";
import NewWorkout from "./pages/NewWorkout";
import ActiveWorkout from "./pages/ActiveWorkout";
import WorkoutPlans from "./pages/WorkoutPlans";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/plans" element={<WorkoutPlans />} />
            <Route path="/workout/new" element={<NewWorkout />} />
            <Route path="/workout/:workoutId" element={<ActiveWorkout />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
