import { useAuth } from "@/lib/AuthContext";
import AdminOverview from "@/pages/app/AdminOverview";
import ListenerDashboard from "@/pages/app/ListenerDashboard";
import SeekerDashboard from "@/pages/app/SeekerDashboard";

export default function AppHome() {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <AdminOverview />;
  }

  if (user?.role === "listener" || user?.role === "therapist") {
    return <ListenerDashboard />;
  }

  return <SeekerDashboard />;
}
