/* ==========================================================================
   THE PROFESSIONAL PEN — GLOBAL SCRIPTS
   Phone menu and header state, shared by every page.
   ========================================================================== */

/* ---------- Phone menu ----------
   The toggle opens a full-screen panel; Escape, a link tap or growing the
   window to desktop width closes it again. */
(function () {
    const toggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("site-menu");
    if (!toggle || !menu) return;

    const header = document.getElementById("header");
    const desktop = window.matchMedia("(min-width: 75rem)");

    function setOpen(open) {
        if (open && header) {
            menu.style.setProperty("--menu-top", `${header.getBoundingClientRect().bottom}px`);
        }
        toggle.setAttribute("aria-expanded", String(open));
        menu.classList.toggle("is-open", open);
        document.body.classList.toggle("menu-open", open);
        document.documentElement.classList.toggle("menu-open", open);
    }

    toggle.addEventListener("click", () => {
        setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", (event) => {
        if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menu.classList.contains("is-open")) {
            setOpen(false);
            toggle.focus();
        }
    });

    desktop.addEventListener("change", (event) => {
        if (event.matches) setOpen(false);
    });
})();

/* ---------- Header: thin line under it once the page has scrolled ---------- */
(function () {
    const header = document.getElementById("header");
    if (!header) return;

    function update() {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
})();

/* ---------- Heading underlines ----------
   Draws each green underline once its heading is mostly on screen. */
(function () {
    const marks = document.querySelectorAll(".title-mark");
    if (!marks.length) return;

    if (!("IntersectionObserver" in window)) {
        marks.forEach((mark) => mark.classList.add("is-drawn"));
        return;
    }

    document.documentElement.classList.add("draw-ready");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-drawn");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.8 });
    marks.forEach((mark) => observer.observe(mark));
})();

/* ---------- Highlight the nav link for the section on screen ----------
   Each nav link points at a section; whichever section crosses the middle
   of the screen gets its link marked active (aria-current too). */
(function () {
    const links = [...document.querySelectorAll(".nav-link[href^='#']")];
    const sections = links
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);
    if (!sections.length || !("IntersectionObserver" in window)) return;

    function setActive(id) {
        links.forEach((link) => {
            const on = link.getAttribute("href") === `#${id}`;
            link.classList.toggle("is-active", on);
            if (on) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
        });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(entry.target.id);
        });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((section) => observer.observe(section));

    // Above the first section (the hero), nothing is highlighted
    const first = sections[0];
    window.addEventListener("scroll", () => {
        if (first.getBoundingClientRect().top > window.innerHeight * 0.5) setActive("");
    }, { passive: true });
})();

/* ---------- Back to top ----------
   Shows once the visitor is a screen or so down the page; the link itself
   jumps to the top (smooth-scroll.js makes it glide). */
(function () {
    const button = document.getElementById("back-to-top");
    if (!button) return;

    function update() {
        button.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.9);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });

    button.addEventListener("click", (event) => {
        event.preventDefault();
        if (window.lenis) window.lenis.scrollTo(0);
        else window.scrollTo({ top: 0, behavior: "smooth" });
    });
})();
