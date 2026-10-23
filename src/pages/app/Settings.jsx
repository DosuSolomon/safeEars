import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Check, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { apiClient } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [commPref, setCommPref] = useState(
    user?.communication_preference || "text",
  );
  const [privacy, setPrivacy] = useState(user?.privacy_level || "anonymous");
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    setTheme(user?.theme_preference || "light");
  }, []);

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await apiClient.entities.User.delete(user.id);
      await logout(false);
      navigate("/login", { replace: true });
    } catch (e) {
      setDeleteError(
        "We couldn't delete your account right now. Please try again or contact support.",
      );
      setDeleting(false);
    }
  };

  const save = async () => {
    await apiClient.auth.updateMe({
      nickname,
      bio,
      communication_preference: commPref,
      privacy_level: privacy,
      theme_preference: theme,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile, privacy, and appearance.
        </p>
      </div>

      <div className="surface-card p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div>
          <label className="text-sm font-medium">Nickname</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Choose a nickname"
            className="mt-1 w-full rounded-xl bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/40"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Bio / About</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short note about you (optional)"
            className="mt-1 w-full rounded-xl bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/40 min-h-20"
          />
        </div>
      </div>

      <div className="surface-card p-6 space-y-4">
        <h2 className="font-semibold">Communication & Privacy</h2>
        <div>
          <label className="text-sm font-medium">Preferred session type</label>
          <div className="mt-2 flex gap-2">
            {[
              ["text", "Text"],
              ["voice", "Voice"],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setCommPref(v)}
                className={`min-h-[44px] rounded-full px-5 py-2.5 text-sm ${commPref === v ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Privacy level</label>
          <div className="mt-2 flex gap-2">
            {[
              ["anonymous", "Anonymous"],
              ["pseudonymous", "Pseudonymous"],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setPrivacy(v)}
                className={`min-h-[44px] rounded-full px-5 py-2.5 text-sm ${privacy === v ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-card p-6 space-y-4">
        <h2 className="font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Your theme applies everywhere and is saved for next time.
        </p>
        <ThemeToggle />
      </div>

      <Button onClick={save} className="rounded-full">
        {saved ? (
          <>
            <Check className="h-4 w-4 mr-1.5" /> Saved
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-1.5" /> Save changes
          </>
        )}
      </Button>

      <div className="surface-card p-6 space-y-3 border-destructive/30">
        <h2 className="font-semibold text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground">
          Deleting your account is permanent. Your sessions, ratings, and
          profile data will be removed and cannot be recovered.
        </p>
        <Button
          variant="destructive"
          className="rounded-full"
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="h-4 w-4 mr-1.5" /> Delete account
        </Button>
      </div>

      {showDelete && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => !deleting && setShowDelete(false)}
        >
          <div
            className="surface-card w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-lg">Delete account?</h3>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              This action cannot be undone. All your data will be permanently
              erased. Are you absolutely sure?
            </p>
            {deleteError && (
              <p className="mt-3 text-sm text-destructive">{deleteError}</p>
            )}
            <div className="mt-5 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={deleting}
                onClick={() => setShowDelete(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleting}
                onClick={deleteAccount}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />{" "}
                    Deleting…
                  </>
                ) : (
                  "Yes, delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
