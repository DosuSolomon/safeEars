import { apiClient } from "@/api/apiClient";

// Find an available, approved listener or therapist.
export async function findAvailableListener(preferRole) {
  const roleFilter = preferRole === "therapist" ? "therapist" : null;
  let listeners;
  try {
    listeners = await apiClient.entities.User.list("-average_rating", 100);
  } catch (e) {
    // Listing other users may be restricted to admins; in that case no live match.
    return null;
  }
  listeners = (listeners || []).filter(
    (u) =>
      u.is_available &&
      u.verification_status === "approved" &&
      (u.role === "listener" || u.role === "therapist") &&
      (!roleFilter || u.role === roleFilter),
  );
  return listeners[0] || null;
}

export async function createSessionRequest({
  seeker,
  topic,
  sessionType,
  urgency,
  note,
  plan,
}) {
  const priority = plan?.priority_matching || urgency === "crisis";
  const req = await apiClient.entities.SessionRequest.create({
    seeker_id: seeker.id,
    seeker_nickname: seeker.nickname || "Anonymous",
    topic_id: topic.id,
    topic_name: topic.name,
    session_type: sessionType,
    urgency,
    priority,
    note: note || "",
    status: "searching",
  });
  return req;
}

export async function attemptMatch(request, preferRole) {
  const listener = await findAvailableListener(preferRole);
  if (!listener) return { matched: false, request };
  await apiClient.entities.SessionRequest.update(request.id, {
    status: "awaiting",
    matched_listener_id: listener.id,
  });
  await apiClient.entities.Notification.create({
    user_id: listener.id,
    type: "session_request",
    title: "New session request",
    body: `${request.seeker_nickname} wants to talk about ${request.topic_name}.`,
    read: false,
  });
  return { matched: true, listener };
}

export async function openSession({ request, listener }) {
  const session = await apiClient.entities.Session.create({
    request_id: request.id,
    seeker_id: request.seeker_id,
    seeker_nickname: request.seeker_nickname,
    listener_id: listener.id,
    listener_name: listener.nickname || listener.full_name || "Listener",
    topic_id: request.topic_id,
    topic_name: request.topic_name,
    session_type: request.session_type,
    status: "active",
    started_at: new Date().toISOString(),
    messages: [],
  });
  await apiClient.entities.SessionRequest.update(request.id, { status: "active" });
  return session;
}
