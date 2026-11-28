/**
 * Team League share control.
 * Mobile: Web Share API when available. Otherwise a share sheet:
 * desktop modal, mobile bottom sheet.
 * Channels: X, Text, Email, Copy link.
 */
(function () {
  "use strict";

  var TITLE = "Team League";
  var TEXT =
    "Draft whole pro teams with friends. Most combined wins takes it. Free to play.";
  var FALLBACK_URL = "https://playteamleague.com/";
  var MQ_SHEET = "(max-width: 719px)";

  var state = {
    open: false,
    lastFocus: null,
    scrollY: 0,
    dragging: false,
    startY: 0,
    dragY: 0
  };

  function shareUrl() {
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href) return canonical.href;
    if (/(^|\.)playteamleague\.com$/i.test(location.hostname)) {
      return location.origin + "/";
    }
    return FALLBACK_URL;
  }

  function packed(url) {
    return TEXT + " " + url;
  }

  function isSheet() {
    try {
      return window.matchMedia(MQ_SHEET).matches;
    } catch (err) {
      return false;
    }
  }

  function isMobileShare() {
    if (!navigator.share) return false;
    var params = new URLSearchParams(location.search);
    if (params.get("mode") === "fallback") return false;
    if (navigator.userAgentData && typeof navigator.userAgentData.mobile === "boolean") {
      return navigator.userAgentData.mobile;
    }
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "")) return true;
    try {
      return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    } catch (err) {
      return false;
    }
  }

  function prefersReducedMotion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (err) {
      return false;
    }
  }

  function toast(message) {
    var el = document.getElementById("tl-share-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "tl-share-toast";
      el.className = "tl-share-toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("is-on");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      el.classList.remove("is-on");
    }, 3200);
  }

  function focusEl(el) {
    if (!el || typeof el.focus !== "function") return;
    try {
      el.focus({ preventScroll: true });
    } catch (err) {
      el.focus();
    }
  }

  function copyViaExec(value) {
    return new Promise(function (resolve, reject) {
      var previous = document.activeElement;
      var area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "0";
      area.style.left = "0";
      area.style.opacity = "0";
      document.body.appendChild(area);
      focusEl(area);
      area.select();
      try {
        if (document.execCommand("copy")) resolve();
        else reject(new Error("copy failed"));
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(area);
        focusEl(previous);
      }
    });
  }

  function copyText(value) {
    if (navigator.clipboard && window.isSecureContext && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(value).catch(function () {
        return copyViaExec(value);
      });
    }
    return copyViaExec(value);
  }

  function hrefs(url) {
    var encoded = encodeURIComponent(packed(url));
    return {
      x: "https://x.com/intent/post?text=" + encoded,
      sms: "sms:?&body=" + encoded,
      email:
        "mailto:?subject=" + encodeURIComponent(TITLE) + "&body=" + encoded
    };
  }

  function refreshHrefs(panel) {
    var map = hrefs(shareUrl());
    Object.keys(map).forEach(function (key) {
      var link = panel.querySelector('[data-share="' + key + '"]');
      if (link && link.tagName === "A") {
        link.href = map[key];
        if (key !== "sms" && key !== "email") {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        } else {
          link.removeAttribute("target");
        }
      }
    });
  }

  function isShown(el) {
    return el.getClientRects().length > 0;
  }

  function focusables(root) {
    var nodes = root.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    return Array.prototype.filter.call(nodes, function (el) {
      return isShown(el) || el === document.activeElement;
    });
  }

  function lockScroll() {
    state.scrollY = window.scrollY;
    var gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = gap > 0 ? gap + "px" : "";
    document.body.style.position = "fixed";
    document.body.style.top = "-" + state.scrollY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }

  function unlockScroll() {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, state.scrollY);
  }

  function setInert(on) {
    var hosts = document.querySelectorAll("[data-share-inert]");
    for (var i = 0; i < hosts.length; i += 1) {
      if (on) hosts[i].setAttribute("inert", "");
      else hosts[i].removeAttribute("inert");
    }
  }

  function bind(root) {
    var trigger = root.querySelector("[data-share-trigger]");
    var overlay = document.querySelector("[data-share-overlay]");
    if (!trigger || !overlay) return;

    var backdrop = overlay.querySelector("[data-share-backdrop]");
    var dialog = overlay.querySelector("[data-share-dialog]");
    var closer = overlay.querySelector("[data-share-close]");
    if (!backdrop || !dialog) return;

    function openPanel() {
      if (state.open) return;
      state.open = true;
      state.lastFocus = document.activeElement;
      refreshHrefs(overlay);
      lockScroll();
      setInert(true);
      trigger.setAttribute("aria-expanded", "true");
      overlay.hidden = false;
      dialog.style.transform = "";
      var focusTarget = closer || dialog;
      requestAnimationFrame(function () {
        overlay.classList.add("is-ready");
        void overlay.getBoundingClientRect();
        focusEl(focusTarget);
        requestAnimationFrame(function () {
          overlay.classList.add("is-open");
          if (focusTarget && document.activeElement !== focusTarget) focusEl(focusTarget);
        });
      });
    }

    function finishClose() {
      overlay.hidden = true;
      overlay.classList.remove("is-ready");
      dialog.style.transform = "";
      setInert(false);
      unlockScroll();
      focusEl(state.lastFocus);
    }

    function closePanel() {
      if (!state.open) return;
      state.open = false;
      state.dragging = false;
      trigger.setAttribute("aria-expanded", "false");
      overlay.classList.remove("is-open");
      if (prefersReducedMotion()) {
        finishClose();
        return;
      }
      var done = false;
      function end() {
        if (done) return;
        done = true;
        dialog.removeEventListener("transitionend", end);
        backdrop.removeEventListener("transitionend", end);
        finishClose();
      }
      dialog.addEventListener("transitionend", end);
      backdrop.addEventListener("transitionend", end);
      setTimeout(end, 280);
    }

    trigger.addEventListener("click", function () {
      if (isMobileShare()) {
        navigator
          .share({ title: TITLE, text: TEXT, url: shareUrl() })
          .then(function () {
            toast("Shared");
          })
          .catch(function (err) {
            if (err && err.name === "AbortError") return;
            openPanel();
          });
        return;
      }
      if (state.open) closePanel();
      else openPanel();
    });

    if (closer) closer.addEventListener("click", closePanel);
    backdrop.addEventListener("click", closePanel);

    overlay.addEventListener("click", function (event) {
      var action = event.target.closest("[data-share]");
      if (!action || !overlay.contains(action)) return;
      var kind = action.getAttribute("data-share");
      if (kind !== "copy") return;
      event.preventDefault();
      copyText(shareUrl())
        .then(function () {
          toast("Link copied");
        })
        .catch(function () {
          toast("Could not copy");
        });
    });

    document.addEventListener("keydown", function (event) {
      if (!state.open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
        return;
      }
      if (event.key !== "Tab") return;
      var items = focusables(dialog);
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    function onPointerMove(event) {
      if (!state.dragging) return;
      state.dragY = Math.max(0, event.clientY - state.startY);
      dialog.style.transform = "translateY(" + state.dragY + "px)";
      backdrop.style.opacity = String(Math.max(0.15, 1 - state.dragY / 320));
    }

    function onPointerUp() {
      if (!state.dragging) return;
      state.dragging = false;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      backdrop.style.opacity = "";
      if (state.dragY > 96) {
        dialog.style.transform = "";
        closePanel();
      } else {
        dialog.style.transform = "";
      }
    }

    dialog.addEventListener("pointerdown", function (event) {
      if (!isSheet() || !state.open) return;
      var handle = event.target.closest("[data-share-handle]");
      var head = event.target.closest("[data-share-head]");
      if (!handle && !head) return;
      if (event.target.closest("button, a")) return;
      state.dragging = true;
      state.startY = event.clientY;
      state.dragY = 0;
      dialog.style.transition = "none";
      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    });

    dialog.addEventListener("transitionend", function () {
      if (!state.dragging) dialog.style.transition = "";
    });

    var params = new URLSearchParams(location.search);
    if (params.get("panel") === "open") openPanel();
    if (params.get("toast") === "copied") toast("Link copied");
  }

  function boot() {
    var nodes = document.querySelectorAll("[data-share-root]");
    for (var i = 0; i < nodes.length; i += 1) bind(nodes[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
