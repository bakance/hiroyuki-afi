export const timeSlots = [
  { label: "morning", hour: 8, minute: 20 },
  { label: "evening", hour: 17, minute: 40 },
  { label: "night", hour: 21, minute: 15 }
];

export const warmupLines = {
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

export const platformSuffix = {
  x: ["今日も淡々といきます。", ""],
  pinterest: ["気になったものはボードに残していきます。", ""],
  instagram: ["淡々と記録していきます。", ""],
  threads: ["ゆるく観察していきます。", ""]
};

export function buildWarmupBody(platform, label, dayIndex) {
  const lines = warmupLines[label];
  const suffixes = platformSuffix[platform] || [""];
  return [lines[dayIndex % lines.length], suffixes[dayIndex % suffixes.length]]
    .filter(Boolean)
    .join("\n");
}

export function todayJst() {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

export function dayIndexFromStart(startDate, now = new Date()) {
  const start = new Date(`${startDate}T00:00:00+09:00`);
  const current = new Date(`${todayJstFromDate(now)}T00:00:00+09:00`);
  const diff = current.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export function todayJstFromDate(date) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(date);
}

export function currentSlot(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
    .formatToParts(now)
    .reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const slotMinutes = timeSlots.map((slot) => ({
    ...slot,
    total: slot.hour * 60 + slot.minute
  }));
  return slotMinutes.reduce((closest, slot) => {
    return Math.abs(slot.total - minutes) < Math.abs(closest.total - minutes) ? slot : closest;
  });
}

export function scheduledJst(date, dayOffset, hour, minute) {
  const base = new Date(`${date}T00:00:00+09:00`);
  base.setDate(base.getDate() + dayOffset);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  return `${year}-${month}-${day} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
