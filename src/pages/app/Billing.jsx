import React, { useEffect, useState } from "react";
import { Check, CreditCard, AlertCircle } from "lucide-react";
import { apiClient } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

const naira = (n) => "₦" + n.toLocaleString();

export default function Billing() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.entities.Plan.list("sort_order", 50)
      .then((p) => setPlans((p || []).filter((x) => x.is_active)))
      .finally(() => setLoading(false));
  }, []);

  // Demo subscription state — a real plan would be stored on Subscription entity.
  const currentPlan = "Free / Trial";
  const trialEnds = new Date(Date.now() + 5 * 86400000).toLocaleDateString();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Subscription & Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your plan, payment, and history.
        </p>
      </div>

      <div className="surface-card p-6 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Current plan</p>
          <p className="text-xl font-semibold mt-1">{currentPlan}</p>
          <p className="text-xs text-success mt-1">
            Free trial ends {trialEnds}
          </p>
        </div>
        <div className="flex items-center">
          <span className="rounded-full bg-success/10 text-success px-3 py-1 text-xs font-medium">
            Active
          </span>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Upgrade your plan</h2>
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {plans.map((p) => (
              <div key={p.id} className="surface-card p-5 flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.name === currentPlan && (
                    <span className="text-xs bg-muted rounded-full px-2 py-0.5">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold mt-2">
                  {p.price_ngn === 0 ? "Free" : naira(p.price_ngn)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /mo
                  </span>
                </p>
                <ul className="mt-3 space-y-1.5 text-sm flex-1">
                  {(p.features || []).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />{" "}
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={p.name === currentPlan ? "outline" : "default"}
                  disabled={p.name === currentPlan}
                  className="mt-4 rounded-full"
                >
                  {p.price_ngn === 0 ? "Free" : "Choose " + p.name}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="surface-card p-6">
        <h2 className="font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> Payment
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pay securely with Paystack or Flutterwave in Naira.
        </p>
        <div className="mt-3 rounded-xl bg-muted/50 p-4 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          Checkout, upgrade/downgrade, cancellation, and billing history are
          processed securely at payment time.
        </div>
      </div>
    </div>
  );
}
