import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/lib/theme";
import PageTransition from "@/components/PageTransition";

// Public pages (code-split)
const Landing = lazy(() => import("@/pages/Landing"));
const About = lazy(() => import("@/pages/About"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Resources = lazy(() => import("@/pages/Resources"));
const Safety = lazy(() => import("@/pages/Safety"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
// Auth pages (code-split)
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
// App pages (code-split)
const AppLayout = lazy(() => import("@/components/AppLayout"));
const AppHome = lazy(() => import("@/pages/app/AppHome"));
const Sessions = lazy(() => import("@/pages/app/Sessions"));
const SessionWorkspace = lazy(() => import("@/pages/app/SessionWorkspace"));
const Billing = lazy(() => import("@/pages/app/Billing"));
const AppResources = lazy(() => import("@/pages/app/AppResources"));
const AdminApplications = lazy(() => import("@/pages/app/AdminApplications"));
const AdminUsers = lazy(() => import("@/pages/app/AdminUsers"));
const AdminPlans = lazy(() => import("@/pages/app/AdminPlans"));
const AdminIncidents = lazy(() => import("@/pages/app/AdminIncidents"));
const Settings = lazy(() => import("@/pages/app/Settings"));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
  </div>
);

// Direction-aware slide variants. PUSH => forward slide, POP => back slide,
// REPLACE/RELOAD => simple fade. `custom` carries the direction into both the
// entering and (via AnimatePresence) the exiting element.
const pageVariants = {
  enter: (dir) => ({
    x: dir > 0 ? "100%" : dir < 0 ? "-100%" : 0,
    opacity: dir === 0 ? 0 : 1,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({
    x: dir > 0 ? "-100%" : dir < 0 ? "100%" : 0,
    opacity: dir === 0 ? 0 : 1,
  }),
};

const pageTransition = { duration: 0.26, ease: [0.4, 0, 0.2, 1] };

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } =
    useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === "user_not_registered") {
      return <UserNotRegisteredError />;
    } else if (authError.type === "auth_required") {
      navigateToLogin();
      return null;
    }
  }

  return <AnimatedRoutes />;
};

function AnimatedRoutes() {
  const location = useLocation();
  const navType = useNavigationType();
  // Resolve direction synchronously from the history action so the entering
  // page mounts with the correct slide direction on the same render.
  const direction = navType === "PUSH" ? 1 : navType === "POP" ? -1 : 0;

  return (
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <PageTransition
        key={location.pathname}
        direction={direction}
        variants={pageVariants}
        transition={pageTransition}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* App (protected) */}
            <Route
              element={
                <ProtectedRoute
                  unauthenticatedElement={<Navigate to="/login" replace />}
                />
              }
            >
              <Route element={<AppLayout />}>
                <Route path="/app" element={<AppHome />} />
                <Route path="/app/sessions" element={<Sessions />} />
                <Route path="/app/session/:id" element={<SessionWorkspace />} />
                <Route path="/app/billing" element={<Billing />} />
                <Route path="/app/resources" element={<AppResources />} />
                <Route
                  path="/app/applications"
                  element={<AdminApplications />}
                />
                <Route path="/app/users" element={<AdminUsers />} />
                <Route path="/app/plans" element={<AdminPlans />} />
                <Route path="/app/incidents" element={<AdminIncidents />} />
                <Route path="/app/settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Suspense>
      </PageTransition>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
