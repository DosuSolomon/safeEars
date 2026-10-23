import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Calendar,
  ClipboardCheck,
  ShieldAlert,
  CreditCard,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { apiClient } from "@/api/apiClient";

export default function AdminOverview() {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.entities.User.list("-created_date", 100),
      apiClient.entities.Session.list("-updated_date", 100),
      apiClient.entities.ListenerApplication.filter(
        { status: "pending" },
        "-created_date",
        50,
      ),
      apiClient.entities.SafetyReport.list("-created_date", 50),
      apiClient.entities.Subscription.list("-created_date", 50),
    ]).then(([users, sessions, apps, reports, subs]) => {
      const available = (users || []).filter(
        (u) =>
          u.is_available && (u.role === "listener" || u.role === "therapist"),
      );
      setMetrics({
        totalUsers: (users || []).length,
        activeSessions: (sessions || []).filter((s) => s.status === "active")
          .length,
        availableListeners: available.length,
        pendingApps: (apps || []).length,
        revenue: (subs || []).reduce((sum, s) => sum + (s.price_ngn || 0), 0),
        incidents: (reports || []).length,
      });
      setLoading(false);
    });
  }, []);

  const cards = [
    { label: "Total users", value: metrics.totalUsers, icon: Users },
    { label: "Active sessions", value: metrics.activeSessions, icon: Calendar },
    {
      label: "Available listeners",
      value: metrics.availableListeners,
      icon: Users,
    },
    {
      label: "Pending applications",
      value: metrics.pendingApps,
      icon: ClipboardCheck,
      link: "/app/applications",
    },
    { label: "Subscriptions", value: metrics.totalUsers, icon: CreditCard },
    { label: "Revenue (₦)", value: metrics.revenue, icon: TrendingUp },
    { label: "Safety incidents", value: metrics.incidents, icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform health at a glance.
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Link
              key={c.label}
              to={c.link || "/app"}
              className="surface-card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <c.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-semibold mt-2">
                {typeof c.value === "number"
                  ? c.value.toLocaleString()
                  : c.value}
              </p>
            </Link>
          ))}
        </div>
      )}

      <div className="surface-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Pending applications</h2>
          <Link
            to="/app/applications"
            className="text-sm text-primary inline-flex items-center gap-1"
          >
            Review all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Approve or reject listener and therapist applications.
        </p>
      </div>
    </div>
  );
}