import React, { useEffect, useState, useCallback } from "react";
import { Check, X, Clock, ShieldCheck } from "lucide-react";
import { apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

const tabs = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "all", label: "All" },
];

export default function AdminApplications() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    let filter = {};
    if (tab === "pending") filter = { status: "pending" };
    else if (tab === "approved") filter = { status: "approved" };
    const list = await apiClient.entities.ListenerApplication.filter(
      filter,
      "-created_date",
      50,
    );
    setApps(list || []);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const decide = async (app, status) => {
    setActing(app.id);
    await apiClient.entities.ListenerApplication.update(app.id, {
      status,
      reviewed_at: new Date().toISOString(),
      reviewer_id: user.id,
    });
    if (app.applicant_id) {
      await apiClient.entities.User.update(app.applicant_id, {
        verification_status: status === "approved" ? "approved" : "rejected",
        ...(status === "approved" ? { role: app.applied_role } : {}),
      });
    }
    setActing(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review, approve, reject, or suspend listener & therapist applications.
        </p>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="surface-card p-10 text-center text-sm text-muted-foreground">
          No applications in this view.
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="surface-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-primary font-semibold">
                    {a.full_name[0]}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{a.full_name}</p>
                      <span className="text-xs rounded-full bg-muted px-2 py-0.5">
                        {a.applied_role}
                      </span>
                      <span
                        className={`text-xs rounded-full px-2 py-0.5 ${a.status === "approved" ? "bg-success/10 text-success" : a.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}
                      >
                        {a.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                    <p className="text-sm mt-2">{a.credentials}</p>
                    {a.bio && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {a.bio}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(a.expertise_topics || []).map((t) => (
                        <span
                          key={t}
                          className="text-xs rounded-full bg-accent px-2.5 py-1"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {a.availability}
                    </p>
                    {a.agreed_safeguarding && (
                      <p className="text-xs text-success mt-1 inline-flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" /> Agreed to
                        safeguarding standards
                      </p>
                    )}
                  </div>
                </div>
                {a.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => decide(a, "approved")}
                      disabled={acting === a.id}
                    >
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decide(a, "rejected")}
                      disabled={acting === a.id}
                    >
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
