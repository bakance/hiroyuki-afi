const groups = [
  {
    name: "google-sheets",
    requiredNow: false,
    secrets: ["GOOGLE_SHEETS_ID", "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_PRIVATE_KEY"]
  },
  {
    name: "amazon",
    requiredNow: false,
    secrets: ["AMAZON_PARTNER_TAG", "AMAZON_CREATORS_API_SEARCH_URL", "AMAZON_CREATORS_API_TOKEN"]
  },
  {
    name: "rakuten",
    requiredNow: false,
    secrets: ["RAKUTEN_APPLICATION_ID", "RAKUTEN_ACCESS_KEY", "RAKUTEN_AFFILIATE_ID"]
  },
  {
    name: "x",
    requiredNow: false,
    secrets: ["X_OAUTH2_ACCESS_TOKEN"]
  },
  {
    name: "pinterest",
    requiredNow: false,
    secrets: ["PINTEREST_ACCESS_TOKEN", "PINTEREST_BOARD_ID"]
  },
  {
    name: "instagram",
    requiredNow: false,
    secrets: ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_USER_ID"]
  },
  {
    name: "threads",
    requiredNow: false,
    secrets: ["THREADS_ACCESS_TOKEN", "THREADS_USER_ID"]
  }
];

for (const group of groups) {
  console.log(`\n[${group.name}]`);
  for (const name of group.secrets) {
    console.log(`${name}: ${process.env[name] ? "configured" : "missing"}`);
  }
}

console.log("\nSecret values are never printed by this diagnostic.");
