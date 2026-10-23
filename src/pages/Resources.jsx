import React, { useEffect, useMemo, useState } from "react";
import { Phone, AlertTriangle, X } from "lucide-react";
import { apiClient } from "@/api/apiClient";
import PublicNav from "@/components/PublicNav";
import Footer from "@/components/Footer";
import { getIcon } from "@/lib/iconMap";

const categories = [
  { id: "all", label: "All" },
  { id: "exercise", label: "Calming exercises" },
  { id: "self_help", label: "Self-help" },
  { id: "faq", label: "FAQ" },
  { id: "crisis", label: "Crisis" },
];

export default function Resources() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(null);

  useEffect(() => {
    apiClient.entities.ResourceArticle.list("sort_order", 50)
      .then((r) => setItems((r || []).filter((x) => x.is_public)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (cat === "all" ? items : items.filter((i) => i.category === cat)),
    [items, cat],
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="max-w-2xl">
          <span className="text-sm font-medium text-primary">
            Resource library
          </span>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold">
            Tools, knowledge, and help
          </h1>
          <p className="mt-3 text-muted-foreground">
            Free calming exercises, self-help reading, FAQs, and crisis contacts
            — available to everyone.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                cat === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* Crisis callout */}
        <div className="mt-10 rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive">
                If you're in immediate danger
              </h3>
              <p className="mt-2 text-sm">
                SafeEars is not an emergency service. If you or someone else is
                in danger right now, please:
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  href="tel:112"
                  className="inline-flex items-center gap-2 rounded-full bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium"
                >
                  <Phone className="h-4 w-4" /> Call 112
                </a>
                <a
                  href="tel:199"
                  className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm font-medium"
                >
                  <Phone className="h-4 w-4" /> Call 199
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="surface-card w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
                  {(() => {
                    const I = getIcon(open.icon);
                    return <I className="h-5 w-5" />;
                  })()}
                </span>
                <h3 className="font-semibold text-lg">{open.title}</h3>
              </div>
              <button onClick={() => setOpen(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{open.summary}</p>
            <p className="mt-3 text-sm whitespace-pre-line">{open.body}</p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
