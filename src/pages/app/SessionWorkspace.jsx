import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Send,
  PhoneOff,
  Mic,
  MicOff,
  ShieldAlert,
  Clock,
  X,
  Check,
} from "lucide-react";
import { apiClient } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import CalendarSyncButton from "@/components/CalendarSyncButton";

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function SessionWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [stars, setStars] = useState(5);
  const [feedback, setFeedback] = useState("");
  const scrollRef = useRef(null);

  const isSeeker = user?.role === "seeker";

  useEffect(() => {
    let active = true;
    const load = () =>
      apiClient.entities.Session.get(id).then((s) => {
        if (active) {
          setSession(s);
          if (s.started_at) {
            setElapsed(
              Math.floor(
                (Date.now() - new Date(s.started_at).getTime()) / 1000,
              ),
            );
          }
          setLoading(false);
        }
      });
    load();
    const unsub = apiClient.entities.Session.subscribe((event) => {
      if (event.id === id) load();
    });
    return () => {
      active = false;
      unsub();
    };
  }, [id]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [session?.messages]);

  useEffect(() => {
    if (!session || session.status !== "active") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [session?.status]);

  if (loading) {
    return (
      <div className="h-64 grid place-items-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (!session) {
    return (
      <div className="text-center py-16">
        <p>Session not found.</p>
        <Button className="mt-4" onClick={() => navigate("/app")}>
          Back
        </Button>
      </div>
    );
  }

  const ended = session.status !== "active";

  const send = async () => {
    if (!text.trim() || ended) return;
    const msg = {
      from: isSeeker ? "seeker" : "listener",
      text: text.trim(),
      at: new Date().toISOString(),
    };
    const messages = [...(session.messages || []), msg];
    // Optimistically clear the input and reflect the message immediately
    setText("");
    setSession((s) => ({ ...s, messages }));
    try {
      await apiClient.entities.Session.update(session.id, { messages });
    } catch {
      // Revert on failure so the user can retry
      setSession((s) => ({
        ...s,
        messages: (s.messages || []).filter((m) => m !== msg),
      }));
      setText(msg.text);
    }
  };

  const endSession = async () => {
    await apiClient.entities.Session.update(session.id, {
      status: "completed",
      ended_at: new Date().toISOString(),
      duration_seconds: elapsed,
    });
    await apiClient.entities.SessionRequest.update(session.request_id, {
      status: "completed",
    });
    if (isSeeker) setShowRating(true);
    else navigate("/app");
  };

  const submitRating = async () => {
    await apiClient.entities.Rating.create({
      session_id: session.id,
      seeker_id: session.seeker_id,
      listener_id: session.listener_id,
      stars,
      comment: feedback,
    });
    await apiClient.entities.Session.update(session.id, {
      rating: stars,
      feedback,
    });
    setShowRating(false);
    navigate("/app/sessions");
  };

  const submitReport = async (severity) => {
    await apiClient.entities.SafetyReport.create({
      session_id: session.id,
      reporter_id: user.id,
      reason: "Session safety report",
      severity,
      status: "open",
    });
    await apiClient.entities.Session.update(session.id, { escalated: true });
    setShowReport(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="surface-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full brand-gradient text-primary-foreground font-semibold">
              {(isSeeker ? session.listener_name : session.seeker_nickname)[0]}
            </span>
            <div>
              <p className="font-medium text-sm">
                {isSeeker ? session.listener_name : session.seeker_nickname}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.topic_name} · {session.session_type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Clock className="h-4 w-4 text-primary" />{" "}
              {formatDuration(elapsed)}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${ended ? "bg-muted text-muted-foreground" : "bg-success/10 text-success"}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${ended ? "bg-muted-foreground" : "bg-success animate-pulse"}`}
              />
              {ended ? session.status : "Live"}
            </span>
          </div>
        </div>

        {/* Voice bar */}
        {session.session_type === "voice" && (
          <div className="flex items-center justify-center gap-4 py-6 bg-accent/30 border-b border-border">
            <button
              onClick={() => setMuted((m) => !m)}
              className={`grid h-14 w-14 place-items-center rounded-full transition-colors ${muted ? "bg-muted" : "bg-primary text-primary-foreground"}`}
            >
              {muted ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </button>
            <div className="text-sm text-muted-foreground">
              {muted ? "You are muted" : "Microphone on"}
            </div>
            <div className="flex gap-1 items-end h-8">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className="w-1 bg-primary/60 rounded-full animate-pulse"
                  style={{
                    height: `${((i % 3) + 1) * 8}px`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {session.session_type === "text" && (
          <div
            ref={scrollRef}
            className="h-80 overflow-y-auto p-4 space-y-2.5 bg-background"
          >
            {(session.messages || []).length === 0 && (
              <p className="text-center text-sm text-muted-foreground mt-8">
                {ended
                  ? "This session has ended."
                  : "Say hello — your session is private and secure."}
              </p>
            )}
            {(session.messages || []).map((m, i) => {
              const mine =
                (isSeeker && m.from === "seeker") ||
                (!isSeeker && m.from === "listener");
              return (
                <div
                  key={i}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Input */}
        {session.session_type === "text" && !ended && (
          <div className="border-t border-border p-3 flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message…"
              className="flex-1 rounded-full bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/40"
            />
            <Button size="icon" className="rounded-full" onClick={send}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Footer actions */}
        <div className="border-t border-border p-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarSyncButton session={session} isSeeker={isSeeker} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReport(true)}
              className="text-destructive"
            >
              <ShieldAlert className="h-4 w-4 mr-1.5" /> Report
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {!ended && (
              <Button variant="destructive" size="sm" onClick={endSession}>
                <PhoneOff className="h-4 w-4 mr-1.5" /> End session
              </Button>
            )}
            {ended && !isSeeker && (
              <Button size="sm" onClick={() => navigate("/app")}>
                Back to queue
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Rating modal */}
      {showRating && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="surface-card w-full max-w-md p-6">
            <h3 className="font-semibold text-lg">How was your session?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your feedback helps us improve and is kept private.
            </p>
            <div className="flex gap-2 mt-4 justify-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  className="grid min-h-[44px] min-w-[44px] place-items-center text-2xl"
                >
                  <span className={n <= stars ? "text-primary" : "text-muted"}>
                    ★
                  </span>
                </button>
              ))}
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional feedback…"
              className="mt-4 w-full rounded-xl bg-muted px-3 py-2 text-sm outline-none min-h-20"
            />
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/app/sessions")}
              >
                Skip
              </Button>
              <Button className="flex-1" onClick={submitRating}>
                <Check className="h-4 w-4 mr-1.5" /> Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="surface-card w-full max-w-md p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-destructive">
                Report & Escalate
              </h3>
              <button onClick={() => setShowReport(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Our safety team reviews every report. Choose a severity.
            </p>
            <div className="mt-4 space-y-2">
              {["low", "medium", "high", "critical"].map((s) => (
                <button
                  key={s}
                  onClick={() => submitReport(s)}
                  className="w-full rounded-xl border border-border px-4 py-3 text-left text-sm hover:bg-muted capitalize"
                >
                  {s} severity
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
