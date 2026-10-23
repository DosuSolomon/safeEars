import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Loader2,
  MessagesSquare,
  Mic,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";
import { apiClient } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { getIcon } from "@/lib/iconMap";
import {
  createSessionRequest,
  attemptMatch,
  openSession,
} from "@/lib/matching";
import PullToRefresh from "@/components/PullToRefresh";

const urgencyOptions = [
  { value: "low", label: "Whenever", desc: "No rush" },
  { value: "medium", label: "Soon", desc: "Today, if possible" },
  { value: "high", label: "Now", desc: "I'd like to talk now" },
  { value: "crisis", label: "Urgent", desc: "I'm really struggling" },
];

export default function SeekerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState(null);
  const [type, setType] = useState("text");
  const [urgency, setUrgency] = useState("medium");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("idle"); // idle | searching | matched | opening | no_match
  const [queuePos, setQueuePos] = useState(0);
  const [waitSec, setWaitSec] = useState(0);

  const loadTopics = async () => {
    const t = await apiClient.entities.SupportTopic.list();
    setTopics(t || []);
    setLoading(false);
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const reset = () => {
    setStep(1);
    setTopic(null);
    setType("text");
    setUrgency("medium");
    setNote("");
    setStatus("idle");
  };

  const requestSupport = async () => {
    if (!user || !topic) return;
    setStatus("searching");
    setQueuePos(Math.floor(Math.random() * 3) + 1);
    setWaitSec(30 + Math.floor(Math.random() * 60));
    const req = await createSessionRequest({
      seeker: user,
      topic,
      sessionType: type,
      urgency,
      note,
    });

    // Simulate matching attempts
    const preferTherapist = urgency === "crisis" ? false : null;
    let matched = false;
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      if (i > 0) setQueuePos((q) => Math.max(1, q - 1));
      const res = await attemptMatch(req, preferTherapist);
      if (res.matched) {
        matched = true;
        setStatus("matched");
        await new Promise((r) => setTimeout(r, 1200));
        setStatus("opening");
        const session = await openSession({
          request: req,
          listener: res.listener,
        });
        navigate(`/app/session/${session.id}`);
        return;
      }
    }
    if (!matched) setStatus("no_match");
  };

  return (
    <PullToRefresh onRefresh={loadTopics}>
      <div className="space-y-6">
        {/* Crisis banner */}
        <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="text-destructive">
              If you're in immediate danger, call 112 or 199.
            </strong>{" "}
            SafeEars is not an emergency service.
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Get support now</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Hi {user?.nickname || "there"} — let's find someone to listen.
              </p>
            </div>
            {step > 1 && status === "idle" && (
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-4 w-4" /> Start over
              </Button>
            )}
          </div>

          {/* Stepper */}
          <div className="mt-5 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full ${step >= s ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          {status === "idle" && (
            <>
              {step === 1 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3">
                    What would you like support with?
                  </h3>
                  {loading ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-20 rounded-xl bg-muted animate-pulse"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {topics.map((t) => {
                        const Icon = getIcon(t.icon);
                        const sel = topic?.id === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setTopic(t)}
                            className={`text-left p-4 rounded-xl border transition-all ${sel ? "border-primary ring-2 ring-primary/30 bg-accent/40" : "border-border hover:border-primary/40"}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary">
                                <Icon className="h-5 w-5" />
                              </span>
                              <div>
                                <p className="font-medium text-sm">{t.name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {t.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-5 flex justify-end">
                    <Button disabled={!topic} onClick={() => setStep(2)}>
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3">
                    How would you like to talk?
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      {
                        v: "text",
                        icon: MessagesSquare,
                        label: "Text chat",
                        desc: "Type at your own pace",
                      },
                      {
                        v: "voice",
                        icon: Mic,
                        label: "Voice call",
                        desc: "Talk it out by voice",
                      },
                    ].map((o) => (
                      <button
                        key={o.v}
                        onClick={() => setType(o.v)}
                        className={`p-4 rounded-xl border text-left transition-all ${type === o.v ? "border-primary ring-2 ring-primary/30 bg-accent/40" : "border-border hover:border-primary/40"}`}
                      >
                        <o.icon className="h-6 w-6 text-primary" />
                        <p className="font-medium mt-2">{o.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {o.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button onClick={() => setStep(3)}>
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3">
                    How soon would you like support?
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {urgencyOptions.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => setUrgency(o.value)}
                        className={`p-4 rounded-xl border text-left transition-all ${urgency === o.value ? "border-primary ring-2 ring-primary/30 bg-accent/40" : "border-border hover:border-primary/40"}`}
                      >
                        <p className="font-medium">{o.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {o.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional: anything your listener should know? (kept private)"
                    className="mt-4 w-full rounded-xl bg-muted px-4 py-3 text-sm outline-none focus:ring-2 ring-primary/40 min-h-20"
                  />
                  <div className="mt-5 flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button onClick={requestSupport}>
                      Request support <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {status === "searching" && (
            <div className="mt-10 text-center py-8">
              <div className="mx-auto w-16 h-16 rounded-full brand-gradient grid place-items-center text-primary-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <h3 className="mt-5 font-semibold text-lg">
                Finding a listener for you…
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Topic: {topic?.name} · {type}
              </p>
              <div className="mt-5 inline-flex items-center gap-4 rounded-full bg-muted px-5 py-2 text-sm">
                <span>
                  Queue position: <strong>{queuePos}</strong>
                </span>
                <span>
                  Est. wait: <strong>~{waitSec}s</strong>
                </span>
              </div>
              <div className="mt-6">
                <Button variant="outline" onClick={reset}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {status === "matched" && (
            <div className="mt-10 text-center py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/15 text-success grid place-items-center">
                <Check className="h-8 w-8" />
              </div>
              <h3 className="mt-5 font-semibold text-lg">You're matched!</h3>
              <p className="text-sm text-muted-foreground">
                Opening your secure session…
              </p>
            </div>
          )}

          {status === "no_match" && (
            <div className="mt-10 text-center py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted text-muted-foreground grid place-items-center">
                <MessagesSquare className="h-8 w-8" />
              </div>
              <h3 className="mt-5 font-semibold text-lg">
                No listeners available right now
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                All our listeners are busy at the moment. Your request is saved
                — please try again shortly, or explore our calming resources
                while you wait.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/app/resources")}
                >
                  Browse resources
                </Button>
                <Button onClick={reset}>Try again</Button>
              </div>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="surface-card p-5">
            <p className="text-sm text-muted-foreground">Active plan</p>
            <p className="text-xl font-semibold mt-1">Free / Trial</p>
          </div>
          <div className="surface-card p-5">
            <p className="text-sm text-muted-foreground">Available listeners</p>
            <p className="text-xl font-semibold mt-1">Live now</p>
          </div>
          <div className="surface-card p-5">
            <p className="text-sm text-muted-foreground">Privacy</p>
            <p className="text-xl font-semibold mt-1 capitalize">
              {user?.privacy_level || "anonymous"}
            </p>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}
