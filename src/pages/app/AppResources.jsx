import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { apiClient } from "@/api/apiClient";
import { getIcon } from "@/lib/iconMap";
import PullToRefresh from "@/components/PullToRefresh";

const categories = [
  { id: "all", label: "All" },
  { id: "exercise", label: "Exercises" },
  { id: "self_help", label: "Self-help" },
  { id: "faq", label: "FAQ" },
  { id: "crisis", label: "Crisis" },
];

export default function AppResources() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(null);

  const loadArticles = async () => {
    const r = await apiClient.entities.ResourceArticle.list("sort_order", 50);
    setItems((r || []).filter((x) => x.is_public));
    setLoading(false);
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const filtered = useMemo(
    () => (cat === "all" ? items : items.filter((i) => i.category === cat)),
    [items, cat],
  );

  return (
    <PullToRefresh onRefresh={loadArticles}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Resources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Free tools and help — always available to you.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`min-h-[44px] rounded-full px-4 py-2.5 text-sm ${cat === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => {
              const Icon = getIcon(r.icon);
              return (
                <button
                  key={r.id}
                  onClick={() => setOpen(r)}
                  className="surface-card p-5 text-left hover:shadow-md transition-shadow"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-semibold">{r.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                    {r.summary}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div className="text-sm">
            <strong className="text-destructive">In danger now?</strong> Call{" "}
            <a href="tel:112" className="font-semibold underline">
              112
            </a>{" "}
            or{" "}
            <a href="tel:199" className="font-semibold underline">
              199
            </a>
            . SafeEars is not an emergency service.
          </div>
        </div>

        {open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setOpen(null)}
          >
            <div
              className="surface-card w-full max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-lg">{open.title}</h3>
                <button onClick={() => setOpen(null)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {open.summary}
              </p>
              <p className="mt-3 text-sm whitespace-pre-line">{open.body}</p>
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
