import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  HeartHandshake,
  MessageCircle,
  Mic,
  ArrowRight,
  Star,
} from "lucide-react";
import { apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/PublicNav";
import Footer from "@/components/Footer";
import { getIcon } from "@/lib/iconMap";

export default function Landing() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.entities.SupportTopic.list()
      .then((t) => setTopics(t || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/50 to-background" />
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5" /> Anonymous & secure
            </span>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold leading-tight font-heading">
              You don't have to carry it alone.{" "}
              <span className="text-primary">Someone's ready to listen.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              SafeEars connects you with vetted peer listeners and licensed
              therapists across Nigeria — privately, by text or voice, whenever
              you need to be heard.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => navigate("/register")}
                className="rounded-full"
              >
                Get support now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/about")}
                className="rounded-full"
              >
                How it works
              </Button>
            </div>
            <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-4 w-4" /> Nickname-only
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" /> Text & voice
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4" /> Vetted listeners
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="surface-card soft-shadow p-6 rotate-1">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full brand-gradient text-primary-foreground">
                  A
                </span>
                <div>
                  <p className="text-sm font-medium">Amara · Listener</p>
                  <p className="text-xs text-success inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-success" />{" "}
                    Available now
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm">
                  Hi, I've been feeling really overwhelmed lately...
                </div>
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3 py-2 text-sm">
                  Thank you for sharing. I'm here with you. Would you like to
                  tell me what's been weighing on you most?
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm">
                  Honestly, just having someone listen helps.
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs">
                  <MessageCircle className="h-3.5 w-3.5" /> Text
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs">
                  <Mic className="h-3.5 w-3.5" /> Voice
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Crisis banner */}
      <section className="border-y border-destructive/30 bg-destructive/5">
        <div className="mx-auto max-w-6xl px-4 py-3 text-sm text-center">
          <strong className="text-destructive">In immediate danger?</strong>{" "}
          Call <span className="font-semibold">112</span> or{" "}
          <span className="font-semibold">199</span>. SafeEars is not an
          emergency service.{" "}
          <Link to="/safety" className="underline">
            Get safety info
          </Link>
        </div>
      </section>

      {/* Topics */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold">
            Whatever's on your mind, there's a topic for it
          </h2>
          <p className="mt-3 text-muted-foreground">
            Pick what fits. We'll match you with someone ready to listen.
          </p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl bg-muted animate-pulse"
                />
              ))
            : topics.map((t) => {
                const Icon = getIcon(t.icon);
                return (
                  <Link
                    to="/register"
                    key={t.id}
                    className="surface-card p-5 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {t.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {t.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      </section>

      {/* How */}
      <section className="bg-muted/30 border-y border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: HeartHandshake,
                title: "Choose & request",
                text: "Pick a topic, text or voice, and your urgency — then request support.",
              },
              {
                icon: ShieldCheck,
                title: "Matched & secured",
                text: "We match you with a vetted listener or therapist. You stay anonymous.",
              },
              {
                icon: MessageCircle,
                title: "Talk & breathe",
                text: "Have your session, leave feedback, and revisit your private history.",
              },
            ].map((s, i) => (
              <div key={i} className="surface-card p-6">
                <span className="grid h-12 w-12 place-items-center rounded-xl brand-gradient text-primary-foreground">
                  <s.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">
          Take the first step today
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          It takes less than a minute to get started. Your identity stays yours.
        </p>
        <Button
          size="lg"
          className="mt-6 rounded-full"
          onClick={() => navigate("/register")}
        >
          Create your free account <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </section>

      <Footer />
    </div>
  );
}
