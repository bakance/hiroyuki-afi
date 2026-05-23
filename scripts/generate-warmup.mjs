import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const platforms = csvEnv("WARMUP_PLATFORMS", "x,pinterest,instagram,threads");
const days = intEnv("WARMUP_DAYS", 7);
const postsPerDay = intEnv("WARMUP_POSTS_PER_DAY", 3);
const startDate = process.env.WARMUP_START_DATE || todayJst();
const output = process.env.WARMUP_OUTPUT || "generated/manual-posts.md";

const slots = [
  { label: "morning", hour: 8, minute: 20 },
  { label: "evening", hour: 17, minute: 40 },
  { label: "night", hour: 21, minute: 15 }
].slice(0, postsPerDay);

const warmupLines = {
  morning: [
    "おはようございます。今日も、なくても困らないものを冷静に眺めていきます。",
    "おはようございます。便利と無駄の境界線、だいたい朝は少し曖昧です。",
    "おはようございます。必要性はさておき、気になるものは気になります。"
  ],
  evening: [
    "夕方ですね。今日も、生活に必須ではないものほど妙に記憶に残ります。",
    "おつかれさまです。使う理由より、欲しくなる理由のほうが先に来る日があります。",
    "夕方の観察です。人はたまに、用途よりも雰囲気で物を欲しがります。"
  ],
  night: [
    "こんばんは。夜は判断力が少し甘くなるので、変なものが魅力的に見えます。",
    "今日もおつかれさまでした。必要ないのに気になるもの、だいたい明日も気になります。",
    "こんばんは。買う理由を探し始めた時点で、少し負けている気がします。"
  ]
};

const platformSuffix = {
  x: ["今日も淡々といきます。", ""],
  pinterest: ["気になったものはボードに残していきます。", ""],
  instagram: ["淡々と記録していきます。", ""],
  threads: ["ゆるく観察していきます。", ""]
};

const posts = [];
for (let day = 0; day < days; day += 1) {
  for (const slot of slots) {
    for (const platform of platforms) {
      const body = buildBody(platform, slot.label, day);
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

function buildBody(platform, label, day) {
  const lines = warmupLines[label];
  const suffixes = platformSuffix[platform] || [""];
  return [lines[day % lines.length], suffixes[day % suffixes.length]].filter(Boolean).join("\n");
}

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

function todayJst() {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

function scheduledJst(date, dayOffset, hour, minute) {
  const base = new Date(`${date}T00:00:00+09:00`);
  base.setDate(base.getDate() + dayOffset);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  return `${year}-${month}-${day} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
