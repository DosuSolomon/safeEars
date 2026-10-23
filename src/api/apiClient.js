/// <reference path="./vite-env.d.ts" />

/** @typedef {any} ApiRecord */

/**
 * @typedef {object} EntityClient
 * @property {(sort?: string, limit?: number) => Promise<ApiRecord[]>} list
 * @property {(filters: object, sort?: string, limit?: number) => Promise<ApiRecord[]>} filter
 * @property {(id: string) => Promise<ApiRecord>} get
 * @property {(data: object) => Promise<ApiRecord>} create
 * @property {(id: string, data: object) => Promise<ApiRecord>} update
 * @property {(id: string) => Promise<void>} delete
 * @property {(callback: (event: object) => void) => () => void} subscribe
 */

/**
 * @typedef {object} AuthClient
 * @property {() => boolean} hasToken
 * @property {() => Promise<ApiRecord>} me
 * @property {(email: string, password: string) => Promise<ApiRecord>} loginViaEmailPassword
 * @property {(data: object) => Promise<ApiRecord>} register
 * @property {(data: object) => Promise<ApiRecord>} verifyOtp
 * @property {(email: string) => Promise<ApiRecord>} resendOtp
 * @property {(email: string) => Promise<ApiRecord>} resetPasswordRequest
 * @property {(data: object) => Promise<ApiRecord>} resetPassword
 * @property {(data: object) => Promise<ApiRecord>} updateMe
 * @property {(token: string) => void} setToken
 * @property {(redirect?: boolean) => void} logout
 * @property {(returnTo?: string) => void} redirectToLogin
 * @property {(provider: string, returnTo?: string) => void} loginWithProvider
 */

/**
 * @typedef {object} ApiClient
 * @property {AuthClient} auth
 * @property {Record<string, EntityClient>} entities
 */

const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const TOKEN_KEY = "safeears_access_token";
const POLL_INTERVAL_MS = 5000;

function readInitialToken() {
  if (typeof window === "undefined") return null;
  const storedToken = window.localStorage.getItem(TOKEN_KEY);
  if (storedToken) return storedToken;
  const url = new URL(window.location.href);
  const token = url.searchParams.get("access_token");
  if (token) {
    url.searchParams.delete("access_token");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
    window.localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

let accessToken = readInitialToken();

const setToken = (token) => {
  accessToken = token || null;
  if (typeof localStorage !== "undefined") {
    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
};

async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", "Bearer " + accessToken);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
  });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      result?.error?.message ||
        result?.message ||
        `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return result;
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const encodeQuery = (values) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) {
      params.set(
        key,
        typeof value === "object" ? JSON.stringify(value) : String(value),
      );
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
};

function createEntityClient(entityName) {
  const endpoint = `/entities/${encodeURIComponent(entityName)}`;
  return {
    list: (sort, limit) =>
      request(`${endpoint}${encodeQuery({ sort, limit })}`),
    filter: (filters, sort, limit) =>
      request(`${endpoint}${encodeQuery({ filters, sort, limit })}`),
    get: (id) => request(`${endpoint}/${encodeURIComponent(id)}`),
    create: (data) => request(endpoint, { method: "POST", body: data }),
    update: (id, data) =>
      request(`${endpoint}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: data,
      }),
    delete: (id) =>
      request(`${endpoint}/${encodeURIComponent(id)}`, { method: "DELETE" }),
    subscribe: (callback) => {
      let stopped = false;
      let previousSnapshot;
      const poll = async () => {
        try {
          const records = await request(`${endpoint}${encodeQuery({ limit: 100 })}`);
          const snapshot = JSON.stringify(records);
          if (previousSnapshot !== undefined && snapshot !== previousSnapshot) {
            callback({ type: "update", data: records });
          }
          previousSnapshot = snapshot;
        } catch (error) {
          console.error(`Subscription polling failed for ${entityName}:`, error);
        }
        if (!stopped) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      };

      let timer = setTimeout(poll, 0);
      return () => {
        stopped = true;
        clearTimeout(timer);
      };
    },
  };
}

const entityClients = /** @type {Record<string, EntityClient>} */ (
  new Proxy(
    {},
    {
      get: (_target, entityName) =>
        typeof entityName === "string" ? createEntityClient(entityName) : undefined,
    },
  )
);

/** @type {ApiClient} */
export const apiClient = {
  auth: {
    hasToken: () => Boolean(accessToken),
    me: () => request("/auth/me"),
    loginViaEmailPassword: async (email, password) => {
      const result = await request("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setToken(result.access_token);
      return result;
    },
    register: (data) => request("/auth/register", { method: "POST", body: data }),
    verifyOtp: (data) =>
      request("/auth/verify-otp", { method: "POST", body: data }),
    resendOtp: (email) =>
      request("/auth/resend-otp", { method: "POST", body: { email } }),
    resetPasswordRequest: (email) =>
      request("/auth/password-reset/request", {
        method: "POST",
        body: { email },
      }),
    resetPassword: (data) =>
      request("/auth/password-reset/confirm", {
        method: "POST",
        body: data,
      }),
    updateMe: (data) => request("/auth/me", { method: "PATCH", body: data }),
    setToken,
    logout: (redirect = false) => {
      setToken(null);
      if (redirect && typeof window !== "undefined") {
        window.location.assign("/login");
      }
    },
    redirectToLogin: (returnTo = "/") => {
      if (typeof window === "undefined") return;
      let target = "/";
      try {
        const url = new URL(returnTo, window.location.origin);
        if (url.origin === window.location.origin) {
          target = `${url.pathname}${url.search}${url.hash}`;
        }
      } catch (error) {
        console.error("Invalid login return URL:", error);
      }
      window.location.assign(
        `/login${target === "/" ? "" : `?returnTo=${encodeURIComponent(target)}`}`,
      );
    },
    loginWithProvider: (provider, returnTo = "/") => {
      if (typeof window === "undefined") return;
      if (provider !== "google") {
        throw new Error(`Unsupported identity provider: ${provider}`);
      }
      const target = new URL(`${API_URL}/auth/google`, window.location.origin);
      target.searchParams.set("returnTo", returnTo);
      window.location.assign(target.toString());
    },
  },
  entities: entityClients,
};
