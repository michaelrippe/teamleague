// Live leader for each in-season league. Reads public standings only.
// Never requests /interest or /signups.
(function () {
  var DASH = "\u2013";

  var NBA_ABBR = {
    ATL: "Hawks", BOS: "Celtics", BKN: "Nets", CHA: "Hornets", CHI: "Bulls",
    CLE: "Cavaliers", DAL: "Mavericks", DEN: "Nuggets", DET: "Pistons",
    GS: "Warriors", GSW: "Warriors", HOU: "Rockets", IND: "Pacers",
    LAC: "Clippers", LAL: "Lakers", MEM: "Grizzlies", MIA: "Heat", MIL: "Bucks",
    MIN: "Timberwolves", NO: "Pelicans", NOP: "Pelicans", NY: "Knicks", NYK: "Knicks",
    OKC: "Thunder", ORL: "Magic", PHI: "76ers", PHX: "Suns", PHO: "Suns",
    POR: "Blazers", SAC: "Kings", SA: "Spurs", SAS: "Spurs", TOR: "Raptors",
    UTAH: "Jazz", UTA: "Jazz", WSH: "Wizards", WAS: "Wizards",
  };
  var NHL_ABBR = {
    ANA: "Ducks", BOS: "Bruins", BUF: "Sabres", CGY: "Flames", CAR: "Hurricanes",
    CHI: "Blackhawks", COL: "Avalanche", CBJ: "Blue Jackets", DAL: "Stars",
    DET: "Red Wings", EDM: "Oilers", FLA: "Panthers", LAK: "Kings", LA: "Kings",
    MIN: "Wild", MTL: "Canadiens", NSH: "Predators", NJD: "Devils", NJ: "Devils",
    NYI: "Islanders", NYR: "Rangers", OTT: "Senators", PHI: "Flyers", PIT: "Penguins",
    SJS: "Sharks", SJ: "Sharks", SEA: "Kraken", STL: "Blues", TBL: "Lightning",
    TB: "Lightning", TOR: "Maple Leafs", UTA: "Mammoth", UTAH: "Mammoth",
    VAN: "Canucks", VGK: "Golden Knights", VEG: "Golden Knights", WSH: "Capitals",
    WAS: "Capitals", WPG: "Jets",
  };
  var NFL_ABBR = {
    ARI: "Cardinals", ATL: "Falcons", BAL: "Ravens", BUF: "Bills", CAR: "Panthers",
    CHI: "Bears", CIN: "Bengals", CLE: "Browns", DAL: "Cowboys", DEN: "Broncos",
    DET: "Lions", GB: "Packers", HOU: "Texans", IND: "Colts", JAX: "Jaguars",
    KC: "Chiefs", LV: "Raiders", LAC: "Chargers", LAR: "Rams", MIA: "Dolphins",
    MIN: "Vikings", NE: "Patriots", NO: "Saints", NYG: "Giants", NYJ: "Jets",
    PHI: "Eagles", PIT: "Steelers", SF: "49ers", SEA: "Seahawks", TB: "Buccaneers",
    TEN: "Titans", WSH: "Commanders", WAS: "Commanders",
  };

  var NBA_ROSTER = [
    { name: "Swaggy", teams: ["Thunder", "Nuggets", "Heat", "Pacers", "Magic", "Wizards", "Pelicans"] },
    { name: "Gallup", teams: ["Spurs", "Timberwolves", "Rockets", "Warriors", "Clippers", "Suns", "Grizzlies"] },
    { name: "Gainzy", teams: ["Knicks", "Cavaliers", "Pistons", "Hawks", "Hornets", "Mavericks", "Bucks"] },
    { name: "Rippe", teams: ["Celtics", "76ers", "Raptors", "Lakers", "Blazers", "Jazz", "Bulls"] },
  ];
  var NHL_ROSTER = [
    { name: "Rippe", teams: ["Lightning", "Golden Knights", "Mammoth", "Sharks", "Senators", "Rangers", "Blue Jackets", "Islanders"] },
    { name: "Gainzy", teams: ["Avalanche", "Wild", "Canadiens", "Bruins", "Flyers", "Jets", "Kraken", "Canucks"] },
    { name: "Swaggy", teams: ["Panthers", "Oilers", "Sabres", "Maple Leafs", "Ducks", "Kings", "Penguins", "Red Wings"] },
    { name: "Gallup", teams: ["Hurricanes", "Stars", "Capitals", "Devils", "Blues", "Predators", "Flames", "Blackhawks"] },
  ];
  var NFL_ROSTER = [
    { name: "Swaggy", teams: ["Rams", "Chiefs", "Eagles", "49ers", "Steelers", "Commanders", "Panthers", "Browns"] },
    { name: "G$", teams: ["Ravens", "Lions", "Bengals", "Packers", "Vikings", "Giants", "Falcons", "Jets"] },
    { name: "Gainzy", teams: ["Broncos", "Patriots", "Texans", "Cowboys", "Colts", "Saints", "Raiders", "Titans"] },
    { name: "Rippe", teams: ["Seahawks", "Bills", "Chargers", "Bears", "Jaguars", "Buccaneers", "Dolphins", "Cardinals"] },
  ];

  function list(value) {
    if (!value) return null;
    if (Array.isArray(value)) return value;
    if (typeof value === "object") {
      return Object.keys(value)
        .sort(function (a, b) {
          return Number(a) - Number(b);
        })
        .map(function (key) {
          return value[key];
        });
    }
    return null;
  }

  function nbaRoster(data) {
    if (!data || typeof data !== "object") return NBA_ROSTER;
    var managers = list(data.managers);
    var draftOrder = list(data.draftOrder);
    var draftManagers = list(data.draftManagers);
    var draftPicks = list(data.draftPicks);
    var drafting = !!data.draftMode || (draftOrder && data.draftLocked === false);
    if (drafting && draftManagers && draftPicks && draftManagers.length === draftPicks.length) {
      return draftManagers.map(function (name, index) {
        return { name: String(name || ""), teams: draftPicks[index] || [] };
      });
    }
    if (managers && managers.length) {
      var rows = managers
        .map(function (manager) {
          if (!manager || typeof manager !== "object") return null;
          return { name: String(manager.name || ""), teams: manager.teams || [] };
        })
        .filter(function (manager) {
          return manager && manager.name && manager.teams.length;
        });
      if (rows.length) return rows;
    }
    return NBA_ROSTER;
  }

  function walk(node, out, meta) {
    if (!node || typeof node !== "object") return;
    if (node.standings) {
      if (node.standings.season != null) meta.seasons.push(Number(node.standings.season));
      if (node.standings.seasonType != null) meta.types.push(Number(node.standings.seasonType));
      (node.standings.entries || []).forEach(function (entry) {
        out.push(entry);
      });
    }
    (node.children || []).forEach(function (child) {
      walk(child, out, meta);
    });
  }

  function statNumber(stats, name) {
    var stat = stats[name];
    if (!stat || stat.value == null || stat.value === "") return null;
    var value = Number(stat.value);
    return isFinite(value) ? Math.round(value) : null;
  }

  function parseStandings(data, abbr, season, minimum) {
    if (!data || !data.season || Number(data.season.year) !== season) return null;
    var entries = [];
    var meta = { seasons: [], types: [] };
    walk(data, entries, meta);
    if (meta.seasons.some(function (year) { return year !== season; })) return null;
    if (!meta.types.length || meta.types.some(function (type) { return type !== 2; })) return null;
    var records = {};
    entries.forEach(function (entry) {
      var team = entry.team || {};
      var name = abbr[(team.abbreviation || "").toUpperCase()];
      if (!name) return;
      var stats = {};
      (entry.stats || []).forEach(function (item) {
        stats[item.name] = item;
      });
      var wins = statNumber(stats, "wins");
      var losses = statNumber(stats, "losses");
      if (wins == null || losses == null) return;
      var otl = statNumber(stats, "otLosses");
      if (otl == null) otl = statNumber(stats, "overtimeLosses");
      records[name] = {
        w: wins,
        l: losses,
        otl: otl || 0,
        t: statNumber(stats, "ties") || 0,
      };
    });
    return Object.keys(records).length >= minimum ? records : null;
  }

  function recordText(row, lossesOf) {
    var text = row.wins + DASH + lossesOf(row);
    if (row.ties) text += DASH + row.ties;
    return text;
  }

  function rank(roster, records, lossesOf) {
    var rows = [];
    for (var i = 0; i < roster.length; i++) {
      var manager = roster[i];
      var wins = 0;
      var losses = 0;
      var ties = 0;
      var best = -1;
      var teams = manager.teams || [];
      if (!teams.length) return null;
      for (var t = 0; t < teams.length; t++) {
        var rec = records[teams[t]];
        if (!rec) return null;
        wins += rec.w;
        losses += rec.l + (rec.otl || 0);
        ties += rec.t || 0;
        if (rec.w > best) best = rec.w;
      }
      rows.push({ name: manager.name, wins: wins, losses: losses, ties: ties, best: best });
    }
    rows.sort(function (a, b) {
      return b.wins - a.wins || b.best - a.best || a.name.localeCompare(b.name);
    });
    var top = rows[0];
    var tied = rows.filter(function (row) {
      return row.wins === top.wins && row.best === top.best;
    });
    var sameRecord = tied.every(function (row) {
      return row.losses === top.losses && row.ties === top.ties;
    });
    return {
      name: tied.map(function (row) { return row.name; }).join(" · "),
      record: sameRecord
        ? recordText(top, lossesOf)
        : tied.map(function (row) { return recordText(row, lossesOf); }).join(" · "),
    };
  }

  function lossesOf(row) {
    return row.losses;
  }

  var LEAGUES = {
    nba: {
      espn: "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=2027&seasontype=2",
      season: 2027,
      minimum: 30,
      abbr: NBA_ABBR,
      roster: NBA_ROSTER,
      rosterUrl: "https://mlbtl26-default-rtdb.firebaseio.com/nbatl26/game.json",
    },
    nhl: {
      espn: "https://site.api.espn.com/apis/v2/sports/hockey/nhl/standings?season=2027&seasontype=2",
      season: 2027,
      minimum: 32,
      abbr: NHL_ABBR,
      roster: NHL_ROSTER,
    },
    nfl: {
      espn: "https://site.api.espn.com/apis/v2/sports/football/nfl/standings?season=2026&seasontype=2",
      season: 2026,
      minimum: 32,
      abbr: NFL_ABBR,
      roster: NFL_ROSTER,
    },
  };

  function readJson(url) {
    return fetch(url, { cache: "no-store", credentials: "omit" }).then(function (response) {
      if (!response.ok) throw new Error("read failed");
      return response.json();
    });
  }

  function paint(id, leader) {
    if (!leader || !leader.name || !leader.record) return;
    var nodes = document.querySelectorAll("[data-scoreboard='" + id + "']");
    Array.prototype.forEach.call(nodes, function (node) {
      node.replaceChildren();
      var label = document.createElement("span");
      label.className = "leader-k";
      label.textContent = "Leader";
      var name = document.createElement("span");
      name.className = "leader-name";
      name.textContent = leader.name;
      var record = document.createElement("span");
      record.className = "leader-rec";
      record.textContent = leader.record;
      node.append(label, document.createTextNode(" "), name, document.createTextNode(" "), record);
      node.hidden = false;
    });
  }

  function load(id) {
    var league = LEAGUES[id];
    if (!league) return Promise.resolve();
    var rosterPromise = league.rosterUrl
      ? readJson(league.rosterUrl).then(nbaRoster).catch(function () { return league.roster; })
      : Promise.resolve(league.roster);
    return Promise.all([rosterPromise, readJson(league.espn)]).then(function (parts) {
      var records = parseStandings(parts[1], league.abbr, league.season, league.minimum);
      if (!records) return;
      paint(id, rank(parts[0], records, lossesOf));
    });
  }

  function mount() {
    Object.keys(LEAGUES).forEach(function (id) {
      load(id).catch(function () {});
    });
  }

  window.TeamLeagueScoreboard = { mount: mount };
})();
