import React, { useEffect, useState } from "react";
import { Save, Check } from "lucide-react";
import { apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";

const naira = (n) => "₦" + (n || 0).toLocaleString();

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    apiClient.entities.Plan.list("sort_order", 50).then((p) => {
      setPlans(p || []);
      setLoading(false);
    });
  }, []);

  const updateField = (id, field, value) => {
    setPlans((ps) =>
      ps.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const save = async (plan) => {
    setSaving(plan.id);
    await apiClient.entities.Plan.update(plan.id, {
      price_ngn: plan.price_ngn,
      voice_minutes: plan.voice_minutes,
      trial_days: plan.trial_days,
      is_active: plan.is_active,
    });
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Plans & Pricing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit prices, limits, and trial duration. Changes apply to new
          subscriptions.
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="surface-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                <button
                  onClick={() => updateField(p.id, "is_active", !p.is_active)}
                  className={`text-xs rounded-full px-2.5 py-1 ${p.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                >
                  {p.is_active ? "Active" : "Inactive"}
                </button>
              </div>
              <label className="block text-sm">
                <span className="text-muted-foreground">Price (₦/mo)</span>
                <input
                  type="number"
                  value={p.price_ngn}
                  onChange={(e) =>
                    updateField(p.id, "price_ngn", Number(e.target.value))
                  }
                  className="mt-1 w-full rounded-xl bg-muted px-3 py-2 outline-none focus:ring-2 ring-primary/40"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="text-muted-foreground">Voice min</span>
                  <input
                    type="number"
                    value={p.voice_minutes}
                    onChange={(e) =>
                      updateField(p.id, "voice_minutes", Number(e.target.value))
                    }
                    className="mt-1 w-full rounded-xl bg-muted px-3 py-2 outline-none focus:ring-2 ring-primary/40"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-muted-foreground">Trial days</span>
                  <input
                    type="number"
                    value={p.trial_days}
                    onChange={(e) =>
                      updateField(p.id, "trial_days", Number(e.target.value))
                    }
                    className="mt-1 w-full rounded-xl bg-muted px-3 py-2 outline-none focus:ring-2 ring-primary/40"
                  />
                </label>
              </div>
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => save(p)}
                disabled={saving === p.id}
              >
                {saving === p.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}{" "}
                Save
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
