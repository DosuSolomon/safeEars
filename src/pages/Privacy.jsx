import React from "react";
import PublicNav from "@/components/PublicNav";
import Footer from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <article className="mx-auto max-w-3xl px-4 py-12 prose-sm">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <div className="mt-6 space-y-4 text-sm text-muted-foreground">
          <p>
            SafeEars is designed around privacy. You can use the platform with a
            nickname only — you are never required to share your real name.
          </p>
          <h2 className="text-foreground font-semibold text-base">
            What we collect
          </h2>
          <p>
            We collect only what's essential: an email for account access, a
            nickname, your support topics, communication and privacy
            preferences, and session data needed to provide support.
          </p>
          <h2 className="text-foreground font-semibold text-base">
            How listeners see you
          </h2>
          <p>
            Listeners and therapists see your nickname and the topic you
            selected — not your real identity or contact details. Session notes
            are restricted to authorised roles.
          </p>
          <h2 className="text-foreground font-semibold text-base">
            Data & sessions
          </h2>
          <p>
            Session content is stored to let you revisit your private history.
            You can manage your preferences and theme in Settings at any time.
          </p>
          <h2 className="text-foreground font-semibold text-base">
            Limitations
          </h2>
          <p>
            SafeEars is not an emergency service. If you are in immediate
            danger, call 112 or 199.
          </p>
        </div>
      </article>
      <Footer />
    </div>
  );
}
