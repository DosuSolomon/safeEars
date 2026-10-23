import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/PublicNav";
import Footer from "@/components/Footer";

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <span className="text-sm font-medium text-primary">How it works</span>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold">
          Support that meets you where you are
        </h1>
        <p className="mt-4 text-muted-foreground">
          SafeEars makes emotional support simple, private, and available across
          Nigeria. Here's what to expect.
        </p>

        <div className="mt-10 space-y-8">
          {[
            {
              n: 1,
              title: "Create an anonymous account",
              text: "Sign up with just a nickname. No real name required. Choose your privacy level and communication preference.",
            },
            {
              n: 2,
              title: "Pick what you need",
              text: "Select a support topic, whether you'd like text or voice, and your urgency. We'll find the right person.",
            },
            {
              n: 3,
              title: "Get matched",
              text: "We match you with an available vetted listener or licensed therapist based on topic, availability, and your plan.",
            },
            {
              n: 4,
              title: "Talk securely",
              text: "Open your session, talk by text or voice, and use safety actions if needed. Sessions are private.",
            },
            {
              n: 5,
              title: "Reflect & continue",
              text: "Leave feedback, rate your session, and revisit your private history any time.",
            },
          ].map((s) => (
            <div key={s.n} className="flex gap-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full brand-gradient text-primary-foreground font-semibold text-sm">
                {s.n}
              </span>
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid sm:grid-cols-2 gap-4">
          <div className="surface-card p-5">
            <Users className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold">Peer Listeners</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Trained, vetted community listeners for everyday support — not
              clinical care.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {[
                "Anonymous text & voice",
                "Trained & safeguarding-checked",
                "Great for everyday stress",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="surface-card p-5">
            <Stethoscope className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold">Licensed Therapists</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Verified clinical professionals for deeper, structured support.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {[
                "Clinical, professional care",
                "Credentials verified by admin",
                "Longer, structured sessions",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 surface-card p-6 bg-accent/40">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h3 className="mt-3 font-semibold text-lg">Privacy first, always</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Use a nickname, share only what you choose, and keep your history
            private. Listeners never see your real identity. SafeEars is not an
            emergency service — if you're in danger, call 112 or 199.
          </p>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="rounded-full"
            onClick={() => navigate("/register")}
          >
            Get started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full"
            onClick={() => navigate("/pricing")}
          >
            See pricing
          </Button>
        </div>
      </article>
      <Footer />
    </div>
  );
}
