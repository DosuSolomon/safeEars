import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Star, ArrowRight } from "lucide-react";
import { apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/PublicNav";
import Footer from "@/components/Footer";

const naira = (n) => "₦" + n.toLocaleString();

export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.entities.Plan.list("sort_order", 50)
      .then((p) => setPlans((p || []).filter((x) => x.is_active)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-medium text-primary">Pricing</span>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold">
            Simple plans, in Naira
          </h1>
          <p className="mt-3 text-muted-foreground">
            Start with a free trial. Upgrade any time. Free crisis resources are
            always accessible.
          </p>
        </div>

        {loading ? (
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const featured = plan.name === "Platinum";
              return (
                <div
                  key={plan.id}
                  className={`relative surface-card p-6 flex flex-col ${featured ? "ring-2 ring-primary" : ""}`}
                >
                  {featured && (
                    <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-medium">
                      <Star className="h-3 w-3" /> Most popular
                    </span>
                  )}
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground min-h-[40px]">
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      {plan.price_ngn === 0 ? "Free" : naira(plan.price_ngn)}
                    </span>
                    {plan.price_ngn > 0 && (
                      <span className="text-sm text-muted-foreground">/mo</span>
                    )}
                  </div>
                  {plan.trial_days > 0 && (
                    <p className="mt-2 text-xs text-success">
                      {plan.trial_days}-day free trial
                    </p>
                  )}
                  <ul className="mt-5 space-y-2 text-sm flex-1">
                    {(plan.features || []).map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />{" "}
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 rounded-full"
                    variant={featured ? "default" : "outline"}
                    onClick={() => navigate("/register")}
                  >
                    {plan.price_ngn === 0
                      ? "Start free"
                      : "Choose " + plan.name}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 surface-card p-6 bg-accent/40">
          <h3 className="font-semibold">Payment in Nigeria</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We support Paystack and Flutterwave for secure Naira payments.
            Manage, upgrade, downgrade, or cancel any time from your dashboard.
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prices and limits are managed by SafeEars admins and may change. Free
          crisis resources remain available to everyone.
        </p>
      </section>
      <Footer />
    </div>
  );
}
