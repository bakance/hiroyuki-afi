import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildWarmupBody, scheduledJst, timeSlots, todayJst } from "./warmup-content.mjs";

const platforms = csvEnv("WARMUP_PLATFORMS", "x,pinterest,instagram,threads");
const days = intEnv("WARMUP_DAYS", 7);
const postsPerDay = intEnv("WARMUP_POSTS_PER_DAY", 3);
const startDate = process.env.WARMUP_START_DATE || todayJst();
const output = process.env.WARMUP_OUTPUT || "generated/manual-posts.md";

const slots = timeSlots.slice(0, postsPerDay);

const posts = [];
for (let day = 0; day < days; day += 1) {
  for (const slot of slots) {
    for (const platform of platforms) {
      const body = buildWarmupBody(platform, slot.label, day);
      posts.push({
        platform,
        label: slot.label,
        scheduledJst: scheduledJst(startDate, day, slot.hour, slot.minute),
        body
      });
    }
  }
}

mkdirSync(resolve(output, ".."), { recursive: true });
writeFileSync(resolve(output), render(posts));
console.log(`Generated ${posts.length} warm-up drafts: ${output}`);

function render(posts) {
  const sections = posts.map((post, index) => [
    `## ${index + 1}. ${post.platform} / ${post.label}`,
    "",
    `- Scheduled JST: ${post.scheduledJst}`,
    "- Link: none",
    "- Hashtags: none",
    "",
    "### Copy",
    "",
    "```text",
    post.body,
    "```",
    "",
    "### Manual Steps",
    "",
    "```text",
    `${post.platform}を開く`,
    "",
    "本文を貼り付け:",
    post.body,
    "",
    "リンク、商品名、ハッシュタグは入れない",
    "",
    "投稿ボタンを押す",
    "```"
  ].join("\n"));

  return [
    "# Warmup Manual Posting Bundle",
    "",
    "APIキーや秘密情報は含めていません。",
    "初期1週間は、リンクなし・商品名なし・ハッシュタグなしで運用します。",
    "",
    ...sections,
    ""
  ].join("\n");
}

function csvEnv(name, fallback) {
  return (process.env[name] || fallback).split(",").map((value) => value.trim()).filter(Boolean);
}

function intEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(value) ? value : fallback;
}
