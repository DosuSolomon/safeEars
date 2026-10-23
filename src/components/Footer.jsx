import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full brand-gradient text-primary-foreground">
              <Heart className="h-4 w-4" />
            </span>
            <span className="font-semibold font-heading">SafeEars</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Anonymous, secure emotional-wellness support across Nigeria.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-foreground">
                How it works
              </Link>
            </li>
            <li>
              <Link to="/pricing" className="hover:text-foreground">
                Pricing
              </Link>
            </li>
            <li>
              <Link to="/resources" className="hover:text-foreground">
                Resources
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Support</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/safety" className="hover:text-foreground">
                Crisis & Safety
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-foreground">
                Terms of Use
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">In an emergency</h4>
          <p className="mt-3 text-sm text-muted-foreground">
            Call <span className="font-semibold text-foreground">112</span> or{" "}
            <span className="font-semibold text-foreground">199</span>. SafeEars
            is not an emergency service.
          </p>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>
            © {new Date().getFullYear()} SafeEars. All rights reserved.
          </span>
          <span>Made with care for Nigeria.</span>
        </div>
      </div>
    </footer>
  );
}
