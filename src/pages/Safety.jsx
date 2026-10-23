import React from "react";
import { Phone, AlertTriangle, ShieldAlert, Heart } from "lucide-react";
import PublicNav from "@/components/PublicNav";
import Footer from "@/components/Footer";

export default function Safety() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 text-destructive px-3 py-1 text-xs font-medium">
          <ShieldAlert className="h-3.5 w-3.5" /> Crisis & Safety
        </div>
        <h1 className="mt-4 text-3xl md:text-4xl font-bold">
          Your safety comes first
        </h1>
        <p className="mt-4 text-muted-foreground">
          SafeEars is a support platform, not an emergency or medical service.
          If you are in danger or thinking of harming yourself, please use the
          contacts below immediately.
        </p>

        <div className="mt-8 rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <h2 className="font-semibold text-destructive text-lg">
              Immediate help
            </h2>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <a
              href="tel:112"
              className="surface-card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
            >
              <Phone className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-semibold">112</p>
                <p className="text-xs text-muted-foreground">
                  National emergency
                </p>
              </div>
            </a>
            <a
              href="tel:199"
              className="surface-card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
            >
              <Phone className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-semibold">199</p>
                <p className="text-xs text-muted-foreground">
                  Police assistance
                </p>
              </div>
            </a>
            <a
              href="tel:08000000000"
              className="surface-card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
            >
              <Heart className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-semibold">0800 000 0000</p>
                <p className="text-xs text-muted-foreground">
                  Suicide prevention line
                </p>
              </div>
            </a>
          </div>
        </div>

        <div className="mt-8 surface-card p-6">
          <h2 className="font-semibold">What SafeEars can and can't do</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              ✓ Provide anonymous peer support and licensed therapy sessions.
            </li>
            <li>
              ✓ Offer calming resources, exercises, and self-help content.
            </li>
            <li>
              ✗ SafeEars is <strong>not</strong> an emergency, ambulance, or
              crisis-line service.
            </li>
            <li>
              ✗ Listeners are not a replacement for emergency care or medical
              treatment.
            </li>
          </ul>
        </div>

        <div className="mt-8 surface-card p-6">
          <h2 className="font-semibold">During a session</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Every session includes a <strong>Report & Escalate</strong> action.
            Use it any time you feel unsafe. Our safety team reviews reports and
            escalates serious incidents to trained responders.
          </p>
        </div>

        <div className="mt-8 surface-card p-6 bg-accent/40">
          <h2 className="font-semibold">You are not alone</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Reaching out is brave. Whatever you're carrying, support is
            available — from SafeEars and from the emergency services above.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
