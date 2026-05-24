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

for (const platform of platforms) {
  const text = buildWarmupBody(platform, slot.label, dayIndex);
  try {
    const result = await publish(platform, text);
    if (result.status === "skipped") {
      skipped += 1;
      console.log(`${platform}: skipped (${result.reason})`);
    } else {
      published += 1;
      console.log(`${platform}: published`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${platform}: ${redact(message)}`);
  }
}

console.log(`Auto publish complete: published=${published}, skipped=${skipped}, dryRun=${dryRun}`);

async function publish(platform, text) {
  if (dryRun) {
    return { status: "published" };
  }
  if (platform === "x") return publishX(text);
  if (platform === "threads") return publishThreads(text);
  if (platform === "pinterest") return publishPinterest(text);
  if (platform === "instagram") return publishInstagram(text);
  return { status: "skipped", reason: `unsupported platform ${platform}` };
}

async function publishX(text) {
  const token = process.env.X_OAUTH2_ACCESS_TOKEN;
  if (!token) return { status: "skipped", reason: "X_OAUTH2_ACCESS_TOKEN missing" };
  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ text })
  });
  await assertOk(response, "X post failed");
  return { status: "published" };
}

async function publishThreads(text) {
  const token = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;
  if (!token || !userId) return { status: "skipped", reason: "THREADS_ACCESS_TOKEN or THREADS_USER_ID missing" };

  const create = await formPost(`https://graph.threads.net/v1.0/${userId}/threads`, token, {
    media_type: "TEXT",
    text
  });
  const creationId = create.id;
  if (!creationId) throw new Error("Threads container creation returned no id");
  await formPost(`https://graph.threads.net/v1.0/${userId}/threads_publish`, token, {
    creation_id: creationId
  });
  return { status: "published" };
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
  return { status: "published" };
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
  await formPost(`https://graph.facebook.com/${version}/${userId}/media_publish`, token, {
    creation_id: creationId
  });
  return { status: "published" };
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
  const text = await response.text();
  throw new Error(`${prefix}: ${response.status} ${redact(text)}`);
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
