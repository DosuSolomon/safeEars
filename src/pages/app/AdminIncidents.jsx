import React, { useEffect, useState } from "react";
import { ShieldAlert, Check } from "lucide-react";
import { apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";

const severityBadge = {
  low: "bg-muted",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
  critical: "bg-destructive text-destructive-foreground",
};

export default function AdminIncidents() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    apiClient.entities.SafetyReport.list("-created_date", 50).then((r) => {
      setReports(r || []);
      setLoading(false);
    });
  };
  useEffect(() => {
    load();
  }, []);

  const resolve = async (r) => {
    await apiClient.entities.SafetyReport.update(r.id, { status: "resolved" });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-destructive" /> Safety incidents
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Moderation reports and escalations.
        </p>
      </div>

      {loading ? (
        <div className="h-32 rounded-2xl bg-muted animate-pulse" />
      ) : reports.length === 0 ? (
        <div className="surface-card p-10 text-center text-sm text-muted-foreground">
          No safety incidents reported.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="surface-card p-5 flex items-start justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs rounded-full px-2.5 py-1 ${severityBadge[r.severity] || "bg-muted"}`}
                  >
                    {r.severity}
                  </span>
                  <span
                    className={`text-xs ${r.status === "resolved" ? "text-success" : "text-muted-foreground"}`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="text-sm mt-2">{r.reason}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Session: {r.session_id || "—"} · Reporter: {r.reporter_id}
                </p>
              </div>
              {r.status !== "resolved" && (
                <Button size="sm" variant="outline" onClick={() => resolve(r)}>
                  <Check className="h-4 w-4" /> Resolve
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
