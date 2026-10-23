import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Check,
  X,
  ShieldCheck,
  MessageCircle,
  Mic,
  Loader2,
} from "lucide-react";
import { apiClient } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { getIcon } from "@/lib/iconMap";
import { openSession } from "@/lib/matching";

export default function ListenerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [available, setAvailable] = useState(user?.is_available || false);
  const [requests, setRequests] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [countdowns, setCountdowns] = useState({});

  const load = useCallback(async () => {
    if (!user) return;
    const [reqs, sessions] = await Promise.all([
      apiClient.entities.SessionRequest.filter(
        { matched_listener_id: user.id, status: "awaiting" },
        "-created_date",
        20,
      ),
      apiClient.entities.Session.filter(
        { listener_id: user.id },
        "-updated_date",
        50,
      ),
    ]);
    setRequests(reqs || []);
    setActiveSessions((sessions || []).filter((s) => s.status === "active"));
    setCompleted((sessions || []).filter((s) => s.status === "completed"));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
    const unsubReq = apiClient.entities.SessionRequest.subscribe(() => load());
    const unsubSess = apiClient.entities.Session.subscribe(() => load());
    return () => {
      unsubReq();
      unsubSess();
    };
  }, [load]);

  // Countdown timers for each awaiting request (30s to respond)
  useEffect(() => {
    const t = setInterval(() => {
      setCountdowns((c) => {
        const next = {};
        requests.forEach((r) => {
          const created = new Date(r.created_date).getTime();
          const left = Math.max(
            0,
            30 - Math.floor((Date.now() - created) / 1000),
          );
          next[r.id] = left;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [requests]);

  const toggleAvailability = async () => {
    const next = !available;
    setAvailable(next);
    await apiClient.auth.updateMe({ is_available: next });
  };

  const accept = async (req) => {
    setActing(req.id);
    const session = await openSession({ request: req, listener: user });
    setActing(null);
    navigate(`/app/session/${session.id}`);
  };

  const decline = async (req) => {
    setActing(req.id);
    await apiClient.entities.SessionRequest.update(req.id, {
      status: "cancelled",
      matched_listener_id: "",
    });
    setActing(null);
    load();
  };

  const profilePct =
    [
      user?.bio,
      user?.nickname,
      (user?.support_topics || []).length > 0,
      user?.verification_status === "approved",
    ].filter(Boolean).length * 25;

  return (
    <div className="space-y-6">
      {/* Header / availability */}
      <div className="surface-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {user?.role === "therapist" ? "Therapist" : "Listener"} dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verification:{" "}
            <span
              className={
                user?.verification_status === "approved"
                  ? "text-success"
                  : "text-warning"
              }
            >
              {user?.verification_status || "pending"}
            </span>
          </p>
        </div>
        <button
          onClick={toggleAvailability}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${available ? "bg-success text-white" : "bg-muted text-muted-foreground"}`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${available ? "bg-white animate-pulse" : "bg-muted-foreground"}`}
          />
          {available ? "Available for sessions" : "Currently unavailable"}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { label: "Queue", value: requests.length },
          { label: "Active sessions", value: activeSessions.length },
          { label: "Completed", value: completed.length },
          {
            label: "Avg. rating",
            value: (user?.average_rating || 0).toFixed(1) + "★",
          },
        ].map((m) => (
          <div key={m.label} className="surface-card p-5">
            <p className="text-sm text-muted-foreground">{m.label}</p>
            <p className="text-2xl font-semibold mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Incoming requests */}
      <div className="surface-card p-6">
        <h2 className="font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" /> Incoming session
          requests
        </h2>
        {loading ? (
          <div className="mt-4 h-24 rounded-xl bg-muted animate-pulse" />
        ) : requests.length === 0 ? (
          <div className="mt-4 text-center py-8 text-sm text-muted-foreground">
            No requests right now. Turn on availability to start receiving
            matches.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {requests.map((r) => {
              const left = countdowns[r.id] ?? 30;
              const Icon = getIcon("MessageCircle");
              return (
                <div key={r.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-primary font-semibold">
                        {r.seeker_nickname[0]}
                      </span>
                      <div>
                        <p className="font-medium text-sm">
                          {r.seeker_nickname}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.topic_name} · {r.session_type} · {r.urgency}{" "}
                          urgency
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium ${left < 10 ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      <Clock className="inline h-3.5 w-3.5 mr-1" /> {left}s
                    </span>
                  </div>
                  {r.note && (
                    <p className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                      "{r.note}"
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => accept(r)}
                      disabled={acting === r.id}
                    >
                      {acting === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}{" "}
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decline(r)}
                      disabled={acting === r.id}
                    >
                      <X className="h-4 w-4" /> Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active sessions */}
      <div className="surface-card p-6">
        <h2 className="font-semibold">Active sessions</h2>
        {activeSessions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No active sessions.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {activeSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/app/session/${s.id}`)}
                className="w-full flex items-center justify-between rounded-xl border border-border p-4 hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full ${s.session_type === "voice" ? "bg-primary text-primary-foreground" : "bg-accent text-primary"}`}
                  >
                    {s.session_type === "voice" ? (
                      <Mic className="h-4 w-4" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{s.seeker_nickname}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.topic_name}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-success inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />{" "}
                  Live
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Profile completeness */}
      <div className="surface-card p-6">
        <h2 className="font-semibold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Profile completeness
        </h2>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary"
            style={{ width: `${profilePct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {profilePct}% complete — update your profile in Settings.
        </p>
      </div>
    </div>
  );
}
