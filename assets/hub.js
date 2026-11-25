(function () {
  function parseDay(value, endOfDay) {
    if (value == null || value === "") return null;
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
    if (!match) return null;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var date = endOfDay
      ? new Date(year, month - 1, day, 23, 59, 59, 999)
      : new Date(year, month - 1, day, 0, 0, 0, 0);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  function resolveStatus(league, now) {
    var current = now instanceof Date ? now : new Date();
    if (!league || league.status === "archive") return "archive";
    var start = parseDay(league.start, false);
    var end = parseDay(league.end, true);
    if (start || end) {
      var time = current.getTime();
      if (start && time < start.getTime()) return "offseason";
      if (end && time > end.getTime()) return "offseason";
      return "live";
    }
    return league.status === "live" ? "live" : "offseason";
  }

  function safeUrl(value) {
    try {
      var url = new URL(value);
      if (url.protocol === "https:" || url.protocol === "http:") return url.href;
    } catch (err) {
      return "";
    }
    return "";
  }

  function interestSite(id) {
    var slug = String(id || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return "teamleague-hub-" + slug;
  }

  function field(labelText, name, type, options) {
    var label = document.createElement("label");
    label.className = "field";
    var caption = document.createElement("span");
    caption.className = "field-label";
    caption.append(document.createTextNode(labelText + " "));
    if (options.hint) {
      var hint = document.createElement("span");
      hint.className = "hint";
      hint.textContent = options.hint;
      caption.appendChild(hint);
    }
    var input = document.createElement("input");
    input.name = name;
    input.type = type;
    if (options.maxLength) input.maxLength = options.maxLength;
    if (options.autocomplete) input.autocomplete = options.autocomplete;
    if (options.required) input.required = true;
    if (options.inputMode) input.inputMode = options.inputMode;
    if (type === "email") {
      input.autocapitalize = "none";
      input.spellcheck = false;
    }
    label.append(caption, input);
    return label;
  }

  function createInterestForm(site, submitLabel, ariaLabel) {
    var form = document.createElement("form");
    form.className = "interest-form";
    form.method = "post";
    form.noValidate = true;
    form.dataset.interest = "";
    form.dataset.site = site;
    form.setAttribute("aria-label", ariaLabel);

    var trap = document.createElement("div");
    trap.className = "hp";
    trap.setAttribute("aria-hidden", "true");
    var trapLabel = document.createElement("label");
    trapLabel.textContent = "Website";
    var trapInput = document.createElement("input");
    trapInput.type = "text";
    trapInput.name = "website";
    trapInput.tabIndex = -1;
    trapInput.autocomplete = "off";
    trapLabel.appendChild(trapInput);
    trap.appendChild(trapLabel);

    var button = document.createElement("button");
    button.type = "submit";
    button.className = "button button-primary";
    button.textContent = submitLabel;

    var error = document.createElement("p");
    error.className = "form-error";
    error.dataset.error = "";
    error.setAttribute("role", "alert");
    error.hidden = true;

    form.append(
      trap,
      field("Name", "name", "text", {
        maxLength: 60,
        autocomplete: "name",
        hint: "(optional)",
      }),
      field("Email", "email", "email", {
        maxLength: 120,
        autocomplete: "email",
        required: true,
        inputMode: "email",
        hint: "(required)",
      }),
      button,
      error
    );
    return form;
  }

  function renderCard(league, status) {
    var article = document.createElement("article");
    article.className = "card";
    article.dataset.league = league.id || "";
    article.dataset.status = status;

    var top = document.createElement("div");
    top.className = "card-top";

    var icon = document.createElement("span");
    icon.className = "icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = league.icon || "🏆";

    var title = document.createElement("h3");
    title.textContent = league.name || "League";

    var pill = document.createElement("span");
    pill.className = "pill pill-" + status;
    pill.textContent = status === "live" ? "In season" : "Off-season";

    top.append(icon, title, pill);

    var note = document.createElement("p");
    note.className = "note";
    note.textContent = league.season || "";

    var body = document.createElement("div");
    body.className = "card-body";
    body.append(top, note);

    var action = document.createElement("div");
    action.className = "card-action";

    if (status === "live") {
      var href = safeUrl(league.url);
      if (href) {
        var enter = document.createElement("a");
        enter.className = "button button-primary";
        enter.href = href;
        enter.textContent = "Enter league";
        action.appendChild(enter);
      }
    } else {
      action.appendChild(
        createInterestForm(
          interestSite(league.id),
          "Get notified",
          "Get notified when " + (league.name || "this league") + " opens"
        )
      );
      var resultsHref = safeUrl(league.resultsUrl || league.url);
      if (resultsHref) {
        var results = document.createElement("a");
        results.className = "results-link";
        results.href = resultsHref;
        results.textContent = league.resultsLabel || "Last season's results";
        action.appendChild(results);
      }
    }

    article.append(body, action);
    return article;
  }

  function renderArchiveItem(league) {
    var item = document.createElement("li");
    item.dataset.league = league.id || "";
    var href = safeUrl(league.url);
    var row = document.createElement(href ? "a" : "div");
    if (href) row.href = href;

    var icon = document.createElement("span");
    icon.className = "icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = league.icon || "🏆";

    var text = document.createElement("span");
    text.className = "archive-text";
    var name = document.createElement("span");
    name.className = "archive-name";
    name.textContent = league.name || "League";
    text.appendChild(name);
    if (league.season) {
      var season = document.createElement("span");
      season.className = "archive-note";
      season.textContent = league.season;
      text.appendChild(season);
    }

    var action = document.createElement("span");
    action.className = "archive-action";
    action.textContent = "Results";

    row.append(icon, text, action);
    item.appendChild(row);
    return item;
  }

  function mountGeneral() {
    var slot = document.getElementById("general-interest");
    if (!slot) return;
    slot.replaceChildren(
      createInterestForm("teamleague-hub", "Notify me", "Updates for next season")
    );
  }

  function renderLeagues() {
    var cards = document.getElementById("league-cards");
    var archive = document.getElementById("archive-list");
    var archiveSection = document.getElementById("archive");
    if (!cards || !archive || !archiveSection) return;

    if (!Array.isArray(window.TEAM_LEAGUES)) {
      var unavailable = document.createElement("p");
      unavailable.className = "lede";
      unavailable.textContent = "League list is unavailable.";
      cards.replaceChildren(unavailable);
      archiveSection.hidden = true;
      return;
    }

    var current = [];
    var archived = [];
    window.TEAM_LEAGUES.forEach(function (league) {
      var status = resolveStatus(league);
      if (status === "archive") archived.push(league);
      else current.push({ league: league, status: status });
    });

    if (!current.length) {
      var empty = document.createElement("p");
      empty.className = "lede";
      empty.textContent = "No leagues are listed right now.";
      cards.replaceChildren(empty);
    } else {
      cards.replaceChildren.apply(
        cards,
        current.map(function (item) {
          return renderCard(item.league, item.status);
        })
      );
    }

    if (!archived.length) {
      archive.replaceChildren();
      archiveSection.hidden = true;
      return;
    }

    archiveSection.hidden = false;
    archive.replaceChildren.apply(
      archive,
      archived.map(renderArchiveItem)
    );
  }

  function boot() {
    mountGeneral();
    renderLeagues();
    window.TeamLeagueInterest.init();
  }

  window.TeamLeagueHub = {
    resolveStatus: resolveStatus,
    boot: boot,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
