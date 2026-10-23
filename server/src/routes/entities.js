import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/authenticate.js";
import { safeUser } from "../lib/security.js";

const router = Router();

const entities = {
  User: {
    model: "user",
    fields: [
      "id", "email", "full_name", "email_verified", "role", "nickname", "bio",
      "support_topics", "communication_preference", "privacy_level",
      "theme_preference", "is_available", "profile_complete",
      "verification_status", "average_rating", "sessions_completed",
      "created_date", "updated_date",
    ],
  },
  SupportTopic: {
    model: "supportTopic",
    fields: ["id", "name", "description", "icon", "category", "is_active", "created_date", "updated_date"],
  },
  SessionRequest: {
    model: "sessionRequest",
    fields: [
      "id", "seeker_id", "seeker_nickname", "topic_id", "topic_name",
      "session_type", "urgency", "status", "matched_listener_id",
      "queue_position", "estimated_wait_seconds", "priority", "note",
      "created_date", "updated_date",
    ],
  },
  Session: {
    model: "session",
    fields: [
      "id", "request_id", "seeker_id", "seeker_nickname", "listener_id",
      "listener_name", "topic_id", "topic_name", "session_type", "status",
      "started_at", "ended_at", "duration_seconds", "messages", "rating",
      "feedback", "escalated", "created_date", "updated_date",
    ],
  },
  ListenerApplication: {
    model: "listenerApplication",
    fields: [
      "id", "applicant_id", "full_name", "email", "applied_role",
      "credentials", "expertise_topics", "availability", "bio",
      "agreed_safeguarding", "status", "review_notes", "reviewed_at",
      "reviewer_id", "created_date", "updated_date",
    ],
  },
  Plan: {
    model: "plan",
    fields: [
      "id", "name", "description", "price_ngn", "billing_cycle", "trial_days",
      "voice_minutes", "priority_matching", "instant_matching",
      "encrypted_access", "clinical_access", "features", "is_active",
      "sort_order", "created_date", "updated_date",
    ],
  },
  Subscription: {
    model: "subscription",
    fields: [
      "id", "user_id", "plan_id", "plan_name", "status", "started_at",
      "trial_ends_at", "renews_at", "price_ngn", "created_date", "updated_date",
    ],
  },
  Rating: {
    model: "rating",
    fields: [
      "id", "session_id", "seeker_id", "listener_id", "stars", "comment",
      "would_follow_up", "created_date", "updated_date",
    ],
  },
  SafetyReport: {
    model: "safetyReport",
    fields: [
      "id", "session_id", "reporter_id", "reason", "severity", "status",
      "notes", "created_date", "updated_date",
    ],
  },
  Notification: {
    model: "notification",
    fields: [
      "id", "user_id", "type", "title", "body", "read", "created_date",
      "updated_date",
    ],
  },
  ResourceArticle: {
    model: "resourceArticle",
    fields: [
      "id", "title", "category", "summary", "body", "icon", "is_public",
      "sort_order", "created_date", "updated_date",
    ],
  },
};

const ownershipFields = {
  Session: ["seeker_id", "listener_id"],
  SessionRequest: ["seeker_id", "matched_listener_id"],
  Subscription: ["user_id"],
  Notification: ["user_id"],
  Rating: ["seeker_id", "listener_id"],
  SafetyReport: ["reporter_id"],
  ListenerApplication: ["applicant_id"],
};

const publicFilters = {
  SupportTopic: { is_active: true },
  Plan: { is_active: true },
  ResourceArticle: { is_public: true },
};

router.use((req, res, next) => {
  const entityName = decodeURIComponent(req.path.split("/")[1] || "");
  if (req.method === "GET" && publicFilters[entityName]) {
    return next();
  }
  return authenticate(req, res, next);
});

const dateFields = new Set([
  "started_at",
  "ended_at",
  "trial_ends_at",
  "renews_at",
  "reviewed_at",
]);

const entitySchemas = {
  User: z.object({
    role: z.enum(["admin", "seeker", "listener", "therapist"]),
    communication_preference: z.enum(["text", "voice"]),
    privacy_level: z.enum(["anonymous", "pseudonymous"]),
    theme_preference: z.enum(["light", "dark", "contrast"]),
    support_topics: z.array(z.string()).max(100),
    is_available: z.boolean(),
    profile_complete: z.boolean(),
    verification_status: z.enum(["pending", "approved", "rejected", "suspended"]),
  }).partial(),
  SupportTopic: z.object({
    category: z.enum(["emotional", "relationships", "stress", "grief", "faith", "other"]),
    is_active: z.boolean(),
  }).partial(),
  SessionRequest: z.object({
    session_type: z.enum(["text", "voice"]),
    urgency: z.enum(["low", "medium", "high", "crisis"]),
    status: z.enum(["searching", "matched", "awaiting", "active", "completed", "cancelled", "escalated"]),
    priority: z.boolean(),
  }).partial(),
  Session: z.object({
    session_type: z.enum(["text", "voice"]),
    status: z.enum(["active", "completed", "cancelled", "escalated"]),
    messages: z.array(z.object({
      from: z.enum(["seeker", "listener"]),
      text: z.string().max(10_000),
      at: z.string().datetime(),
    })).max(500),
    escalated: z.boolean(),
  }).partial(),
  ListenerApplication: z.object({
    applied_role: z.enum(["listener", "therapist"]),
    status: z.enum(["pending", "approved", "rejected", "suspended"]),
    expertise_topics: z.array(z.string()).max(100),
    agreed_safeguarding: z.boolean(),
  }).partial(),
  Plan: z.object({
    billing_cycle: z.enum(["one_time", "monthly", "quarterly"]),
    trial_days: z.number().int().min(0),
    voice_minutes: z.number().int().min(0),
    priority_matching: z.boolean(),
    instant_matching: z.boolean(),
    encrypted_access: z.boolean(),
    clinical_access: z.boolean(),
    features: z.array(z.string()).max(100),
    is_active: z.boolean(),
  }).partial(),
  Subscription: z.object({
    status: z.enum(["trial", "active", "cancelled", "past_due", "expired"]),
  }).partial(),
  Rating: z.object({
    stars: z.number().int().min(1).max(5),
    would_follow_up: z.boolean(),
  }).partial(),
  SafetyReport: z.object({
    severity: z.enum(["low", "medium", "high", "critical"]),
    status: z.enum(["open", "reviewing", "resolved", "escalated"]),
  }).partial(),
  Notification: z.object({
    read: z.boolean(),
  }).partial(),
  ResourceArticle: z.object({
    category: z.enum(["exercise", "self_help", "faq", "crisis"]),
    is_public: z.boolean(),
  }).partial(),
};

const integerFields = new Set([
  "queue_position",
  "estimated_wait_seconds",
  "duration_seconds",
  "trial_days",
  "voice_minutes",
  "sort_order",
  "sessions_completed",
  "stars",
]);

function normalizeData(data) {
  const normalized = { ...data };
  for (const [key, value] of Object.entries(normalized)) {
    if (dateFields.has(key) && typeof value === "string") {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw Object.assign(new Error(`Invalid date value for ${key}.`), { status: 400 });
      }
      normalized[key] = date;
    } else if (integerFields.has(key) && typeof value === "number") {
      if (!Number.isSafeInteger(value)) {
        throw Object.assign(new Error(`${key} must be a whole number.`), { status: 400 });
      }
      normalized[key] = Math.trunc(value);
    }
  }
  return normalized;
}

function validateEntityData(entity, data) {
  return entitySchemas[entity].parse(data);
}

function parsePayload(entity, body) {
  const payload = z.record(z.unknown()).parse(body);
  const fields = new Set(
    entities[entity].fields.filter(
      (field) => !["id", "created_date", "updated_date"].includes(field),
    ),
  );
  const unsupportedFields = Object.keys(payload).filter(
    (field) => !fields.has(field),
  );
  if (unsupportedFields.length) {
    throw Object.assign(
      new Error(`Unsupported field: ${unsupportedFields.join(", ")}.`),
      { status: 400 },
    );
  }
  return payload;
}

function parseFilters(input, entity) {
  if (input === undefined) return {};
  let filters = input;
  if (typeof input === "string") {
    try {
      filters = JSON.parse(input);
    } catch {
      throw Object.assign(new Error("Filters must be valid JSON."), { status: 400 });
    }
  }
  const parsed = z.record(z.unknown()).parse(filters);
  const allowed = new Set(entities[entity].fields);
  const unsupportedFields = Object.keys(parsed).filter(
    (field) => !allowed.has(field),
  );
  if (unsupportedFields.length) {
    throw Object.assign(
      new Error(`Unsupported filter: ${unsupportedFields.join(", ")}.`),
      { status: 400 },
    );
  }
  return Object.fromEntries(
    Object.entries(parsed),
  );
}

function makeWhere(entity, filters, user) {
  const and = [];
  if (Object.keys(filters).length) and.push(filters);
  if (!user) {
    and.push(publicFilters[entity] || { id: "__no_access__" });
  } else if (user.role !== "admin") {
    if (entity === "User") {
      and.push({
        role: { in: ["listener", "therapist"] },
        is_available: true,
        verification_status: "approved",
      });
    } else if (ownershipFields[entity]) {
      and.push({
        OR: ownershipFields[entity].map((field) => ({ [field]: user.id })),
      });
    } else if (publicFilters[entity]) {
      and.push(publicFilters[entity]);
    } else {
      and.push({ id: "__no_access__" });
    }
  }
  return and.length ? { AND: and } : {};
}

function parseLimit(value) {
  if (value === undefined) return 100;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw Object.assign(new Error("Limit must be an integer between 1 and 100."), { status: 400 });
  }
  return limit;
}

function parseSort(value, entity) {
  if (!value) return { created_date: "desc" };
  const descending = value.startsWith("-");
  const field = descending ? value.slice(1) : value;
  if (!entities[entity].fields.includes(field)) {
    throw Object.assign(new Error("Unsupported sort field."), { status: 400 });
  }
  return { [field]: descending ? "desc" : "asc" };
}

function expose(entity, records, user) {
  if (entity === "User" && user?.role !== "admin") {
    const entries = Array.isArray(records) ? records : [records];
    const sanitized = entries.map((record) => {
      const safe = safeUser(record);
      delete safe.email;
      delete safe.email_verified;
      delete safe.full_name;
      return safe;
    });
    return Array.isArray(records) ? sanitized : sanitized[0];
  }
  if (entity === "User") {
    return Array.isArray(records)
      ? records.map(safeUser)
      : safeUser(records);
  }
  return records;
}

function requireEntity(entityName, res) {
  const entity = entities[entityName];
  if (!entity) {
    res.status(404).json({ error: { message: "Unknown entity." } });
    return null;
  }
  return entity;
}

router.get("/:entity", async (req, res, next) => {
  try {
    const entity = requireEntity(req.params.entity, res);
    if (!entity) return;
    const filters = parseFilters(req.query.filters, req.params.entity);
    const records = await prisma[entity.model].findMany({
      where: makeWhere(req.params.entity, filters, req.user),
      orderBy: parseSort(req.query.sort, req.params.entity),
      take: parseLimit(req.query.limit),
    });
    return res.json(expose(req.params.entity, records, req.user));
  } catch (error) {
    return next(error);
  }
});

router.get("/:entity/:id", async (req, res, next) => {
  try {
    const entity = requireEntity(req.params.entity, res);
    if (!entity) return;
    const record = await prisma[entity.model].findFirst({
      where: {
        AND: [
          { id: req.params.id },
          makeWhere(req.params.entity, {}, req.user),
        ],
      },
    });
    if (!record) {
      return res.status(404).json({ error: { message: "Record not found." } });
    }
    return res.json(expose(req.params.entity, record, req.user));
  } catch (error) {
    return next(error);
  }
});

router.post("/:entity", async (req, res, next) => {
  try {
    const entityName = req.params.entity;
    const entity = requireEntity(entityName, res);
    if (!entity) return;
    if (entityName === "User") {
      return res.status(403).json({ error: { message: "Use the registration endpoint to create accounts." } });
    }
    const data = validateEntityData(
      entityName,
      normalizeData(parsePayload(entityName, req.body)),
    );
    if (entityName === "SessionRequest" && req.user.role !== "admin") {
      const topic = await prisma.supportTopic.findFirst({
        where: { id: data.topic_id, is_active: true },
      });
      if (!topic) {
        return res.status(400).json({ error: { message: "Select an active support topic." } });
      }
      data.topic_name = topic.name;
    }
    if (req.user.role !== "admin") {
      const ownerField = {
        SessionRequest: "seeker_id",
        SafetyReport: "reporter_id",
        Subscription: "user_id",
        Rating: "seeker_id",
        ListenerApplication: "applicant_id",
      }[entityName];
      if (ownerField) {
        if (data[ownerField] && data[ownerField] !== req.user.id) {
          return res.status(403).json({ error: { message: "Cannot create records for another account." } });
        }
        data[ownerField] = req.user.id;
        if (entityName === "SessionRequest") {
          data.status = "searching";
          data.matched_listener_id = null;
          data.seeker_nickname = req.user.nickname || "Anonymous";
        }
      } else if (entityName === "Session") {
        if (![data.seeker_id, data.listener_id].includes(req.user.id)) {
          return res.status(403).json({ error: { message: "You must participate in this session." } });
        }
        if (req.user.role === "seeker" && data.seeker_id !== req.user.id) {
          return res.status(403).json({ error: { message: "Invalid session owner." } });
        }
        if (req.user.role === "listener" || req.user.role === "therapist") {
          if (data.listener_id !== req.user.id) {
            return res.status(403).json({ error: { message: "Invalid session listener." } });
          }
        }
        const relatedRequest = await prisma.sessionRequest.findFirst({
          where: {
            id: data.request_id,
            seeker_id: data.seeker_id,
            matched_listener_id: data.listener_id,
            status: "awaiting",
          },
        });
        if (!relatedRequest) {
          return res.status(400).json({ error: { message: "Session request is no longer available." } });
        }
        data.status = "active";
      } else if (entityName === "Notification") {
        const relatedRequest = await prisma.sessionRequest.findFirst({
          where: {
            seeker_id: req.user.id,
            matched_listener_id: data.user_id,
            status: "awaiting",
          },
        });
        if (!relatedRequest) {
          return res.status(403).json({ error: { message: "Cannot notify this account." } });
        }
        data.type = "session_request";
        data.title = "New session request";
        data.body = `${relatedRequest.seeker_nickname || "Someone"} wants to talk about ${relatedRequest.topic_name || "a support topic"}.`;
      } else if (entityName === "Subscription") {
        return res.status(403).json({ error: { message: "Subscription changes must be created by an administrator." } });
      } else {
        return res.status(403).json({ error: { message: "Administrator access required." } });
      }
    }
    if (entityName === "Rating" && req.user.role !== "admin") {
      if (data.seeker_id !== req.user.id) {
        return res.status(403).json({ error: { message: "Only the session seeker can submit a rating." } });
      }
      const ratedSession = await prisma.session.findFirst({
        where: {
          id: data.session_id,
          seeker_id: req.user.id,
          listener_id: data.listener_id,
          status: "completed",
        },
      });
      if (!ratedSession) {
        return res.status(400).json({ error: { message: "Only completed sessions can be rated." } });
      }
    }
    if (entityName === "SafetyReport" && req.user.role !== "admin") {
      const reportedSession = data.session_id
        ? await prisma.session.findFirst({
            where: {
              id: data.session_id,
              OR: [
                { seeker_id: req.user.id },
                { listener_id: req.user.id },
              ],
            },
          })
        : null;
      if (!reportedSession) {
        return res.status(400).json({ error: { message: "A report must reference one of your sessions." } });
      }
    }
    if (entityName === "ListenerApplication" && data.applicant_id === undefined) {
      data.applicant_id = req.user.id;
    }
    if (entityName === "ListenerApplication" && req.user.role !== "admin") {
      data.email = req.user.email;
      data.full_name = data.full_name || req.user.full_name || req.user.nickname || "Applicant";
      data.status = "pending";
      data.review_notes = null;
      data.reviewed_at = null;
      data.reviewer_id = null;
    }
    let record;
    if (entityName === "Session" && req.user.role !== "admin") {
      record = await prisma.$transaction(async (transaction) => {
        const claimedRequest = await transaction.sessionRequest.updateMany({
          where: {
            id: data.request_id,
            seeker_id: data.seeker_id,
            matched_listener_id: data.listener_id,
            status: "awaiting",
          },
          data: { status: "active" },
        });
        if (claimedRequest.count !== 1) {
          throw Object.assign(new Error("Session request is no longer available."), { status: 409 });
        }
        return transaction.session.create({ data });
      });
    } else {
      record = await prisma[entity.model].create({ data });
    }
    return res.status(201).json(expose(entityName, record, req.user));
  } catch (error) {
    return next(error);
  }
});

router.patch("/:entity/:id", async (req, res, next) => {
  try {
    const entityName = req.params.entity;
    const entity = requireEntity(entityName, res);
    if (!entity) return;
    const record = await prisma[entity.model].findFirst({
      where: {
        AND: [
          { id: req.params.id },
          makeWhere(entityName, {}, req.user),
        ],
      },
    });
    if (!record) {
      return res.status(404).json({ error: { message: "Record not found." } });
    }
    if (req.user.role !== "admin") {
      if (entityName === "User" && record.id !== req.user.id) {
        return res.status(403).json({ error: { message: "Cannot update another account." } });
      }
      if (entityName === "Session" && "status" in req.body && req.body.status === "active") {
        return res.status(403).json({ error: { message: "Session state cannot be reactivated." } });
      }
      if (entityName === "SessionRequest" && "status" in req.body) {
        const allowedStatuses =
          record.seeker_id === req.user.id
            ? ["awaiting", "completed", "cancelled"]
            : ["active", "cancelled", "completed"];
        if (record.status === "active" && req.body.status === "active") {
          allowedStatuses.push("active");
        }
        if (!allowedStatuses.includes(req.body.status)) {
          return res.status(403).json({ error: { message: "Invalid request state transition." } });
        }
      }
    }
    if (entityName === "User" && req.user.role !== "admin") {
      return res.status(403).json({ error: { message: "Update your profile through the account endpoint." } });
    }
    let data = validateEntityData(
      entityName,
      normalizeData(parsePayload(entityName, req.body)),
    );
    if (req.user.role !== "admin") {
      const allowedFields = {
        Session: ["messages", "status", "ended_at", "duration_seconds", "rating", "feedback", "escalated"],
        SessionRequest: ["status", "matched_listener_id"],
        Notification: ["read"],
      }[entityName] || [];
      data = Object.fromEntries(
        Object.entries(data).filter(([field]) => allowedFields.includes(field)),
      );
      if (!allowedFields.length) {
        return res.status(403).json({ error: { message: "Administrator access required." } });
      }
      if (entityName === "Session" && req.user.id !== record.seeker_id) {
        delete data.rating;
        delete data.feedback;
      }
      if (entityName === "Session" && record.status !== "active") {
        delete data.messages;
        delete data.status;
        delete data.ended_at;
        delete data.duration_seconds;
        delete data.escalated;
      }
      if (entityName === "Session" && "rating" in data && record.status !== "completed") {
        return res.status(400).json({ error: { message: "Only completed sessions can be rated." } });
      }
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: { message: "No supported fields supplied." } });
    }
    if (entityName === "SessionRequest" && req.user.role !== "admin" && "matched_listener_id" in data) {
      if (data.matched_listener_id === "") {
        if (
          record.matched_listener_id !== req.user.id ||
          data.status !== "cancelled"
        ) {
          return res.status(403).json({ error: { message: "Only the assigned listener can decline a request." } });
        }
        data.matched_listener_id = null;
      } else if (
        record.seeker_id !== req.user.id ||
        !["searching", "awaiting"].includes(record.status) ||
        data.status !== "awaiting"
      ) {
        return res.status(403).json({ error: { message: "Only the seeker can match an active request." } });
      }
    }
    if (
      entityName === "SessionRequest" &&
      req.user.role !== "admin" &&
      "matched_listener_id" in data &&
      data.matched_listener_id
    ) {
      const listener = await prisma.user.findFirst({
        where: {
          id: data.matched_listener_id,
          role: { in: ["listener", "therapist"] },
          is_available: true,
          verification_status: "approved",
        },
      });
      if (!listener) {
        return res.status(400).json({ error: { message: "The selected listener is unavailable." } });
      }
    }
    if (entityName === "Session" && Array.isArray(data.messages) && data.messages.length > 500) {
      return res.status(400).json({ error: { message: "Session message limit reached." } });
    }
    if (
      entityName === "Session" &&
      req.user.role !== "admin" &&
      Array.isArray(data.messages)
    ) {
      const previousMessages = Array.isArray(record.messages)
        ? record.messages
        : [];
      const isAppendOnly =
        data.messages.length >= previousMessages.length &&
        previousMessages.every(
          (message, index) =>
            JSON.stringify(message) === JSON.stringify(data.messages[index]),
        );
      if (!isAppendOnly) {
        return res.status(409).json({ error: { message: "Session messages changed; refresh and try again." } });
      }
      const sender = req.user.id === record.seeker_id ? "seeker" : "listener";
      const newMessages = data.messages.slice(previousMessages.length);
      if (newMessages.some((message) => message.from !== sender)) {
        return res.status(403).json({ error: { message: "Cannot send messages as another participant." } });
      }
    }
    const updated = await prisma[entity.model].update({
      where: { id: req.params.id },
      data,
    });
    return res.json(expose(entityName, updated, req.user));
  } catch (error) {
    return next(error);
  }
});

router.delete("/:entity/:id", async (req, res, next) => {
  try {
    const entityName = req.params.entity;
    const entity = requireEntity(entityName, res);
    if (!entity) return;
    if (entityName !== "User" && req.user.role !== "admin") {
      return res.status(403).json({ error: { message: "Administrator access required." } });
    }
    if (entityName === "User" && req.user.role !== "admin" && req.params.id !== req.user.id) {
      return res.status(403).json({ error: { message: "Cannot delete another account." } });
    }
    const record = await prisma[entity.model].findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!record) {
      return res.status(404).json({ error: { message: "Record not found." } });
    }
    if (entityName === "User") {
      await prisma.$transaction(async (transaction) => {
        const sessions = await transaction.session.findMany({
          where: { OR: [{ seeker_id: req.params.id }, { listener_id: req.params.id }] },
          select: { id: true },
        });
        const sessionIds = sessions.map((session) => session.id);
        await transaction.safetyReport.deleteMany({
          where: {
            OR: [
              { reporter_id: req.params.id },
              { session_id: { in: sessionIds } },
            ],
          },
        });
        await transaction.session.deleteMany({
          where: { OR: [{ seeker_id: req.params.id }, { listener_id: req.params.id }] },
        });
        await transaction.sessionRequest.deleteMany({
          where: { OR: [{ seeker_id: req.params.id }, { matched_listener_id: req.params.id }] },
        });
        await transaction.rating.deleteMany({
          where: { OR: [{ seeker_id: req.params.id }, { listener_id: req.params.id }] },
        });
        await transaction.subscription.deleteMany({ where: { user_id: req.params.id } });
        await transaction.notification.deleteMany({ where: { user_id: req.params.id } });
        await transaction.listenerApplication.deleteMany({ where: { applicant_id: req.params.id } });
        await transaction.listenerApplication.updateMany({
          where: { reviewer_id: req.params.id },
          data: { reviewer_id: null },
        });
        await transaction.user.delete({ where: { id: req.params.id } });
      });
    } else {
      await prisma[entity.model].delete({ where: { id: req.params.id } });
    }
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
