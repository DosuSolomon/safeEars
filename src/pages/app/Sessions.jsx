import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Mic, Star } from "lucide-react";
import { apiClient } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import PullToRefresh from "@/components/PullToRefresh";

export default function Sessions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    if (!user) return;
    const field = user.role === "seeker" ? "seeker_id" : "listener_id";
    const s = await apiClient.entities.Session.filter(
      { [field]: user.id },
      "-updated_date",
      50,
    );
    setSessions(s || []);
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
  }, [user]);

  return (
    <PullToRefresh onRefresh={loadSessions}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your private session history.
          </p>
        </div>

        {loading ? (
          <div className="h-32 rounded-2xl bg-muted animate-pulse" />
        ) : sessions.length === 0 ? (
          <div className="surface-card p-10 text-center">
            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No sessions yet. When you have one, it'll appear here privately.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/app/session/${s.id}`)}
                className="w-full surface-card p-4 flex items-center justify-between hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full ${s.session_type === "voice" ? "bg-primary text-primary-foreground" : "bg-accent text-primary"}`}
                  >
                    {s.session_type === "voice" ? (
                      <Mic className="h-5 w-5" />
                    ) : (
                      <MessageCircle className="h-5 w-5" />
                    )}
                  </span>
                  <div>
                    <p className="font-medium text-sm">
                      {user.role === "seeker"
                        ? s.listener_name
                        : s.seeker_nickname}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.topic_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {s.rating > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 text-primary" /> {s.rating}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full ${s.status === "completed" ? "bg-muted text-muted-foreground" : "bg-success/10 text-success"}`}
                  >
                    {s.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
