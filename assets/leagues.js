// Team League hub config. index.html renders this list and nothing else.
//
// status: "live" | "offseason" | "archive"
//   live       main card with an "Enter league" link
//   offseason  main card with a "Get notified" form and a results link
//   archive    Archive section only — no main card and no notify form
//
// Optional start / end ("YYYY-MM-DD", local dates) override status.
// "archive" is never overridden. Before start or after end the card is
// off-season; any other day inside the window is live. Leave both off
// to pin status by hand.
//
// accent: 6-digit hex. A thin left stripe on a main card. Archive rows ignore it.
window.TEAM_LEAGUES = [
  {
    id: "nba",
    name: "NBA 2025–26",
    icon: "🏀",
    status: "live",
    accent: "#F15A22",
    url: "https://michaelrippe.github.io/nbatl26/",
    season: "2025–26 season",
  },
  {
    id: "nhl",
    name: "NHL",
    icon: "🏒",
    status: "live",
    accent: "#A2AAAD",
    url: "https://michaelrippe.github.io/nhltl/",
    season: "Current season",
  },
  {
    id: "nfl",
    name: "NFL",
    icon: "🏈",
    status: "live",
    accent: "#00B140",
    url: "https://michaelrippe.github.io/nfltl/",
    season: "Current season",
  },
  {
    id: "mlb",
    name: "MLB",
    icon: "⚾",
    status: "offseason",
    accent: "#E31937",
    // Opening day flips this card to live. Add `end` when the last day
    // of the 2027 season is set; until then it stays live after it opens.
    start: "2027-03-24",
    url: "https://michaelrippe.github.io/mlbtl26/",
    season: "Opens Mar 24, 2027",
    resultsLabel: "2026 results",
  },
  {
    id: "nba-2024-25",
    name: "NBA 2024–25",
    icon: "🏀",
    status: "archive",
    url: "https://michaelrippe.github.io/nbatl/",
    season: "Final standings",
  },
  {
    id: "fantasy-mlb",
    name: "Fantasy MLB",
    icon: "⚾",
    status: "archive",
    url: "https://michaelrippe.github.io/fantasymlbtl/",
    season: "Final standings",
  },
];
