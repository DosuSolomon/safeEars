import React from "react";
import PublicNav from "@/components/PublicNav";
import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Terms of Use</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <div className="mt-6 space-y-4 text-sm text-muted-foreground">
          <p>
            By using SafeEars, you agree to use the platform respectfully and
            honestly, and to treat listeners, therapists, and other users with
            care.
          </p>
          <h2 className="text-foreground font-semibold text-base">
            Support, not emergencies
          </h2>
          <p>
            SafeEars provides emotional-wellness support and is not a substitute
            for emergency or medical care. In an emergency, call 112 or 199.
          </p>
          <h2 className="text-foreground font-semibold text-base">
            Peer vs clinical care
          </h2>
          <p>
            Peer listeners are trained supporters, not licensed clinicians.
            Therapist sessions are provided by verified licensed professionals.
            SafeEars makes this distinction clear throughout.
          </p>
          <h2 className="text-foreground font-semibold text-base">
            Subscriptions
          </h2>
          <p>
            Plans are billed in Nigerian Naira. You can upgrade, downgrade, or
            cancel from your dashboard. Free crisis resources remain accessible
            to everyone.
          </p>
          <h2 className="text-foreground font-semibold text-base">Conduct</h2>
          <p>
            Abuse, harassment, or misuse will result in suspension. Safety
            reports and escalations are reviewed by our team.
          </p>
        </div>
      </article>
      <Footer />
    </div>
  );
}
