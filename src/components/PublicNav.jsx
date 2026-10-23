import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/resources", label: "Resources" },
  { to: "/safety", label: "Crisis & Safety" },
];

export default function PublicNav() {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const go = (to) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full brand-gradient text-primary-foreground">
            <Heart className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold font-heading">SafeEars</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {publicLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                location.pathname === l.to
                  ? "text-primary font-medium bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <Button size="sm" onClick={() => navigate("/app")}>
              Go to dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Get started
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1">
          {publicLinks.map((l) => (
            <button
              key={l.to}
              onClick={() => go(l.to)}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted"
            >
              {l.label}
            </button>
          ))}
          <div className="pt-2 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => go("/login")}
            >
              Log in
            </Button>
            <Button className="flex-1" onClick={() => go("/register")}>
              Get started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
