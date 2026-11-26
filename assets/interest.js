// Shared notify forms. POST only — this file never reads /interest.
(function () {
  var ENDPOINT = "https://mlbtl26-default-rtdb.firebaseio.com/interest.json";
  var STORAGE_KEY = "tl_interest";
  var THANKS = "You're on the list. Thanks!";
  var SAVE_ERROR = "Couldn't save right now. Try again later.";
  var EMAIL_ERROR = "Enter a valid email address.";

  function remembers() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch (err) {
      return false;
    }
  }

  function remember() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (err) {
      // Private mode can block storage. The thanks message still shows.
    }
  }

  function isValidEmail(email) {
    return email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function thanksNode() {
    var note = document.createElement("p");
    note.className = "interest-thanks";
    note.setAttribute("role", "status");
    note.tabIndex = -1;
    note.textContent = THANKS;
    return note;
  }

  function replaceWithThanks(form, moveFocus) {
    var note = thanksNode();
    form.replaceWith(note);
    if (moveFocus) note.focus();
  }

  function errorNode(form) {
    return form.querySelector("[data-error]");
  }

  function setError(form, message) {
    var node = errorNode(form);
    if (!node) return;
    node.textContent = message || "";
    node.hidden = !message;
  }

  function siteFor(form) {
    return form.getAttribute("data-site") || "teamleague-hub";
  }

  async function onSubmit(form) {
    var honeypot = form.querySelector('input[name="website"]');
    if (honeypot && honeypot.value.trim() !== "") {
      replaceWithThanks(form, true);
      return;
    }

    var nameInput = form.querySelector('input[name="name"]');
    var emailInput = form.querySelector('input[name="email"]');
    var name = ((nameInput && nameInput.value) || "").trim().slice(0, 60);
    var email = ((emailInput && emailInput.value) || "").trim().toLowerCase();

    if (!isValidEmail(email)) {
      setError(form, EMAIL_ERROR);
      if (emailInput) {
        emailInput.setAttribute("aria-invalid", "true");
        emailInput.focus();
      }
      return;
    }

    if (emailInput) emailInput.removeAttribute("aria-invalid");
    setError(form, "");

    var button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    form.setAttribute("aria-busy", "true");

    try {
      var response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        cache: "no-store",
        body: JSON.stringify({
          name: name,
          email: email,
          site: siteFor(form),
          ts: { ".sv": "timestamp" },
        }),
      });
      if (!response.ok) throw new Error("Save failed");
      remember();
      replaceWithThanks(form, true);
    } catch (err) {
      setError(form, SAVE_ERROR);
      if (button) button.disabled = false;
      form.removeAttribute("aria-busy");
    }
  }

  function bind(form) {
    if (form.dataset.bound === "1") return;
    form.dataset.bound = "1";
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      onSubmit(form);
    });
  }

  function init(root) {
    var scope = root || document;
    var forms = scope.querySelectorAll("form[data-interest]");
    Array.prototype.forEach.call(forms, function (form) {
      if (remembers()) replaceWithThanks(form, false);
      else bind(form);
    });
  }

  window.TeamLeagueInterest = {
    init: init,
    endpoint: ENDPOINT,
  };
})();
