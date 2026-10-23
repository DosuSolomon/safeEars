import React, { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import { apiClient } from "@/api/apiClient";

const roleBadge = {
  seeker: "bg-accent text-primary",
  listener: "bg-primary/10 text-primary",
  therapist: "bg-primary/10 text-primary",
  admin: "bg-primary text-primary-foreground",
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.entities.User.list("-created_date", 100).then((u) => {
      setUsers(u || []);
      setLoading(false);
    });
  }, []);

  const filtered = users.filter((u) =>
    [u.full_name, u.nickname, u.email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All support seekers, listeners, therapists, and admins.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-full bg-muted pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/40"
        />
      </div>

      {loading ? (
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="surface-card p-10 text-center text-sm text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2" /> No users found.
        </div>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40"
                >
                  <td className="p-3 font-medium">
                    {u.full_name || u.nickname || "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {u.email || "—"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-xs rounded-full px-2.5 py-1 ${roleBadge[u.role] || "bg-muted"}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-xs">
                    {u.verification_status || "—"}
                  </td>
                  <td className="p-3">{(u.average_rating || 0).toFixed(1)}★</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
