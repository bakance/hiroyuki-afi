import crypto from "node:crypto";
import {
  buildWarmupBody,
  currentSlot,
  dayIndexFromStart,
  todayJst,
  todayJstFromDate
} from "./warmup-content.mjs";

const dryRun = boolEnv("AUTO_PUBLISH_DRY_RUN", false);
const platforms = csvEnv("AUTO_PUBLISH_PLATFORMS", "x,threads");
const startDate = process.env.WARMUP_START_DATE || todayJst();
const requestedSlot = process.env.WARMUP_SLOT || "";
const slot = requestedSlot ? { label: requestedSlot } : currentSlot();
const dayIndex = dayIndexFromStart(startDate);
const mediaUrl = process.env.WARMUP_MEDIA_URL || "";
const nowJst = todayJstFromDate(new Date());

if (!["morning", "evening", "night"].includes(slot.label)) {
  throw new Error(`Invalid WARMUP_SLOT: ${slot.label}`);
}

console.log(`Warm-up auto publish: date=${nowJst}, slot=${slot.label}, platforms=${platforms.join(",")}`);

let published = 0;
let skipped = 0;
let failed = 0;

for (const platform of platforms) {
  const text = buildWarmupBody(platform, slot.label, dayIndex);
  try {
    const result = await publish(platform, text);
    if (result.status === "skipped") {
      skipped += 1;
      console.log(`${platform}: skipped (${result.reason})`);
    } else {
      published += 1;
      const detail = result.detail ? ` (${result.detail})` : "";
      console.log(`${platform}: published${detail}`);
    }
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${platform}: failed (${redact(message)})`);
  }
}

console.log(`Auto publish complete: published=${published}, skipped=${skipped}, failed=${failed}, dryRun=${dryRun}`);
if (failed > 0) {
  process.exitCode = 1;
}

async function publish(platform, text) {
  if (dryRun) {
    return { status: "published", detail: "dry run" };
  }
  if (platform === "x") return publishX(text);
  if (platform === "threads") return publishThreads(text);
  if (platform === "pinterest") return publishPinterest(text);
  if (platform === "instagram") return publishInstagram(text);
  return { status: "skipped", reason: `unsupported platform ${platform}` };
}

async function publishX(text) {
  const credentials = {
    apiKey: process.env.X_API_KEY || "",
    apiSecret: process.env.X_API_SECRET || "",
    accessToken: process.env.X_ACCESS_TOKEN || "",
    accessSecret: process.env.X_ACCESS_SECRET || ""
  };
  if (!credentials.apiKey || !credentials.apiSecret || !credentials.accessToken || !credentials.accessSecret) {
    return {
      status: "skipped",
      reason: "X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, or X_ACCESS_SECRET missing"
    };
  }
  const body = JSON.stringify({ text });
  const urls = ["https://api.x.com/2/tweets", "https://api.twitter.com/2/tweets"];
  let lastUnauthorized = "";

  for (const url of urls) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: oauth1Header("POST", url, credentials),
        "content-type": "application/json"
      },
      body
    });
    if (response.ok) {
      const data = await response.json();
      const tweetId = data?.data?.id;
      return {
        status: "published",
        detail: tweetId ? `https://x.com/i/web/status/${tweetId}` : "X returned no post id"
      };
    }

    const message = await responseErrorMessage(response, `X post failed (${new URL(url).hostname})`);
    if (response.status !== 401) throw new Error(message);
    lastUnauthorized = message;
  }

  throw new Error(
    `${lastUnauthorized}. Check that X_API_KEY/X_API_SECRET belong to the same app as X_ACCESS_TOKEN/X_ACCESS_SECRET, then regenerate Access Token and Access Token Secret after enabling Read and write.`
  );
}

async function publishThreads(text) {
  const token = process.env.THREADS_ACCESS_TOKEN;
  const configuredUserId = process.env.THREADS_USER_ID || "";
  if (!token) return { status: "skipped", reason: "THREADS_ACCESS_TOKEN missing" };

  const userId = await resolveThreadsUserId(token, configuredUserId);
  if (!userId) return { status: "skipped", reason: "THREADS_USER_ID missing and could not be resolved" };

  const create = await formPost(`https://graph.threads.net/v1.0/${userId}/threads`, token, {
    media_type: "TEXT",
    text
  });
  const creationId = create.id;
  if (!creationId) throw new Error("Threads container creation returned no id");
  const published = await formPost(`https://graph.threads.net/v1.0/${userId}/threads_publish`, token, {
    creation_id: creationId
  });
  return {
    status: "published",
    detail: published.id ? `threads_post_id=${published.id}` : "Threads returned no post id"
  };
}

async function publishPinterest(text) {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  const boardId = process.env.PINTEREST_BOARD_ID;
  if (!token || !boardId) return { status: "skipped", reason: "PINTEREST_ACCESS_TOKEN or PINTEREST_BOARD_ID missing" };
  if (!mediaUrl.startsWith("https://")) return { status: "skipped", reason: "WARMUP_MEDIA_URL missing" };

  const response = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      board_id: boardId,
      title: "それ、要ります？研究所",
      description: text,
      media_source: {
        source_type: "image_url",
        url: mediaUrl
      }
    })
  });
  await assertOk(response, "Pinterest pin failed");
  const data = await response.json();
  return {
    status: "published",
    detail: data.id ? `pinterest_pin_id=${data.id}` : "Pinterest returned no pin id"
  };
}

async function publishInstagram(text) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  const version = process.env.META_API_VERSION || "v24.0";
  if (!token || !userId) return { status: "skipped", reason: "INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_USER_ID missing" };
  if (!mediaUrl.startsWith("https://")) return { status: "skipped", reason: "WARMUP_MEDIA_URL missing" };

  const media = await formPost(`https://graph.facebook.com/${version}/${userId}/media`, token, {
    image_url: mediaUrl,
    caption: text
  });
  const creationId = media.id;
  if (!creationId) throw new Error("Instagram media creation returned no id");
  const published = await formPost(`https://graph.facebook.com/${version}/${userId}/media_publish`, token, {
    creation_id: creationId
  });
  return {
    status: "published",
    detail: published.id ? `instagram_media_id=${published.id}` : "Instagram returned no media id"
  };
}

async function formPost(url, token, values) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...values, access_token: token })
  });
  await assertOk(response, `${url} failed`);
  return response.json();
}

async function assertOk(response, prefix) {
  if (response.ok) return;
  throw new Error(await responseErrorMessage(response, prefix));
}

async function responseErrorMessage(response, prefix) {
  const text = await response.text();
  return `${prefix}: ${response.status} ${redact(text)}`;
}

async function resolveThreadsUserId(token, configuredUserId) {
  const response = await fetch(`https://graph.threads.net/v1.0/me?${new URLSearchParams({
    fields: "id",
    access_token: token
  })}`);
  if (response.ok) {
    const data = await response.json();
    if (data.id) return data.id;
  }
  if (configuredUserId && configuredUserId !== "me") return configuredUserId;
  throw new Error(
    `${await responseErrorMessage(response, "Threads /me failed")}. Check that the Threads access token is for the target Threads account and has the required posting permissions.`
  );
}

function csvEnv(name, fallback) {
  return (process.env[name] || fallback)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function boolEnv(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

function redact(value) {
  return value
    .replace(/access_token=[^&\s"]+/g, "access_token=[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [redacted]")
    .replace(/"access_token"\s*:\s*"[^"]+"/g, '"access_token":"[redacted]"');
}

function oauth1Header(method, url, credentials) {
  const params = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.accessToken,
    oauth_version: "1.0"
  };
  const signatureBase = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(
      Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${percentEncode(key)}=${percentEncode(value)}`)
        .join("&")
    )
  ].join("&");
  const signingKey = `${percentEncode(credentials.apiSecret)}&${percentEncode(credentials.accessSecret)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(signatureBase).digest("base64");
  return `OAuth ${Object.entries({ ...params, oauth_signature: signature })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`)
    .join(", ")}`;
}

function percentEncode(value) {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}
