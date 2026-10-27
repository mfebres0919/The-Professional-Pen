/* ==========================================================================
   THE PROFESSIONAL PEN — HOMEPAGE SCRIPTS
   ========================================================================== */

/* ---------- Glowing particles ----------
   Soft dots in the brand green and a lighter mint (plus a few white specks)
   drift slowly upward behind any section with a .particles canvas (the hero
   and Greenlight or Pass). Each canvas pauses when it's off screen or the tab
   is hidden; with reduced motion it draws one still frame instead. */
document.querySelectorAll(".particles").forEach((canvas) => {
    if (!canvas.getContext) return;

    const ctx = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const colors = ["56, 229, 139", "56, 229, 139", "160, 245, 197", "255, 255, 255"];
    const sprites = {}; // one pre-drawn soft glow per color, reused every frame
    let particles = [];
    let width = 0;
    let height = 0;
    let running = false;
    let visible = true;
    let frame = 0;

    function makeParticle(anywhere) {
        const blurred = Math.random() < 0.18; // a few large, soft "out of focus" dots
        return {
            x: Math.random() * width,
            y: anywhere ? Math.random() * height : height + 10,
            r: blurred ? 4 + Math.random() * 6 : 0.6 + Math.random() * 1.8,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: blurred ? 0.08 + Math.random() * 0.1 : 0.25 + Math.random() * 0.55,
            speed: 0.08 + Math.random() * 0.3,
            sway: Math.random() * Math.PI * 2,
            swaySpeed: 0.004 + Math.random() * 0.01,
            twinkle: Math.random() * Math.PI * 2,
            blurred
        };
    }

    function glowSprite(color) {
        if (sprites[color]) return sprites[color];
        const size = 64;
        const sprite = document.createElement("canvas");
        sprite.width = sprite.height = size;
        const sctx = sprite.getContext("2d");
        const glow = sctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        glow.addColorStop(0, `rgba(${color}, 1)`);
        glow.addColorStop(1, `rgba(${color}, 0)`);
        sctx.fillStyle = glow;
        sctx.fillRect(0, 0, size, size);
        sprites[color] = sprite;
        return sprite;
    }

    function resize() {
        // Capped at 1.5x: sharp enough for small dots, far less work on Retina screens
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

        // Density scales with the area, capped so phones stay light
        const count = Math.min(75, Math.round((width * height) / 18000));
        particles = Array.from({ length: count }, () => makeParticle(true));
        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        for (const p of particles) {
            ctx.globalAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.twinkle));
            if (p.blurred) {
                ctx.drawImage(glowSprite(p.color), p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
            } else {
                ctx.fillStyle = `rgb(${p.color})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    function step() {
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.y -= p.speed;
            p.sway += p.swaySpeed;
            p.twinkle += 0.02;
            p.x += Math.sin(p.sway) * 0.25;
            if (p.y < -12) particles[i] = makeParticle(false);
        }
        draw();
        frame = requestAnimationFrame(step);
    }

    function update() {
        const shouldRun = visible && !document.hidden && !reducedMotion;
        if (shouldRun && !running) {
            running = true;
            frame = requestAnimationFrame(step);
        } else if (!shouldRun && running) {
            running = false;
            cancelAnimationFrame(frame);
        }
    }

    resize();
    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
            visible = entries[0].isIntersecting;
            update();
        }).observe(canvas);
    }
    document.addEventListener("visibilitychange", update);
    update();
});

/* ---------- Film strip ----------
   A second, hidden copy of the list follows the first so the strip can
   scroll by exactly half its width and loop without a jump. */
(function () {
    const track = document.querySelector(".film-strip-track");
    const list = track ? track.querySelector(".film-strip-list") : null;
    if (!list) return;

    const copy = list.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    track.appendChild(copy);
})();

/* ---------- Offers swipe row ----------
   On phones and tablets the cards scroll sideways; the dot under them
   follows whichever card is closest to the left edge. */
(function () {
    const grid = document.getElementById("offers-grid");
    const dots = document.querySelectorAll(".offers-dot");
    if (!grid || !dots.length) return;

    const cards = grid.querySelectorAll(".offer-card");
    let ticking = false;

    function update() {
        ticking = false;
        const left = grid.getBoundingClientRect().left + parseFloat(getComputedStyle(grid).scrollPaddingLeft || 0);
        let active = 0;
        let closest = Infinity;
        cards.forEach((card, i) => {
            const distance = Math.abs(card.getBoundingClientRect().left - left);
            if (distance < closest) {
                closest = distance;
                active = i;
            }
        });
        dots.forEach((dot, i) => dot.classList.toggle("is-active", i === active));
    }

    grid.addEventListener("scroll", () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });
})();

/* ---------- Greenlight or Pass ----------
   Ticking "for you" lines fills the verdict meter. At 4/4 the card is
   greenlit: the clapperboard snaps shut and a little confetti flies.
   The section's rows slide in and the PASS stamp slams down on scroll. */
(function () {
    const section = document.getElementById("verdict");
    const card = document.getElementById("greenlight");
    if (!section || !card) return;

    const inputs = card.querySelectorAll(".verdict-input");
    const count = document.getElementById("verdict-count");
    const status = document.getElementById("verdict-status");
    const confetti = card.querySelector(".verdict-confetti");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const messages = [
        "Check what sounds like you.",
        "Interesting… keep going.",
        "Now we’re talking.",
        "Heading for a greenlight…",
        "Greenlight! You’re exactly who we built TPP for."
    ];
    let greenlit = false;

    function clap() {
        card.classList.remove("is-clapping");
        void card.offsetWidth; // restart the animation
        card.classList.add("is-clapping");
    }

    function throwConfetti() {
        if (reducedMotion || !confetti) return;
        const colors = ["#000000", "#ffffff", "#000000", "#ffffff", "#38e58b"];
        for (let i = 0; i < 28; i++) {
            const piece = document.createElement("span");
            piece.className = "confetti-piece";
            piece.style.setProperty("--x", `${(Math.random() - 0.5) * 520}px`);
            piece.style.setProperty("--y", `${-160 - Math.random() * 320}px`);
            piece.style.setProperty("--r", `${(Math.random() - 0.5) * 720}deg`);
            piece.style.setProperty("--c", colors[i % colors.length]);
            confetti.appendChild(piece);
        }
        setTimeout(() => { confetti.textContent = ""; }, 1400);
    }

    function update() {
        let checked = 0;
        inputs.forEach((input) => {
            input.closest(".verdict-check").classList.toggle("is-checked", input.checked);
            if (input.checked) checked++;
        });
        card.style.setProperty("--progress", checked / inputs.length);
        count.textContent = `${checked}/${inputs.length}`;
        status.textContent = messages[checked];

        if (checked === inputs.length && !greenlit) {
            greenlit = true;
            card.classList.add("is-greenlit");
            clap();
            throwConfetti();
        } else if (checked < inputs.length && greenlit) {
            greenlit = false;
            card.classList.remove("is-greenlit");
        }
    }

    inputs.forEach((input) => input.addEventListener("change", update));

    // Scroll-in effects
    if (!("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("reveal-ready");
    const observer = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        section.classList.add("is-in");
        setTimeout(clap, 700);
        observer.disconnect();
    }, { threshold: 0.2 });
    observer.observe(section);
})();

/* ---------- Hero background photos ----------
   Crossfades to the next photo every 6 seconds while the hero is on screen.
   Only the first photo loads with the page; the rest load one step ahead.
   With reduced motion the first photo simply stays. */
(function () {
    const slides = document.querySelectorAll(".hero-slide");
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let current = 0;
    let timer = null;

    // Photos 2-4 only download when they're about to be shown
    function load(slide) {
        slide.querySelectorAll("[data-srcset]").forEach((el) => {
            el.srcset = el.dataset.srcset;
            el.removeAttribute("data-srcset");
        });
        slide.querySelectorAll("img[data-src]").forEach((img) => {
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
        });
    }

    function next() {
        slides[current].classList.remove("is-active");
        current = (current + 1) % slides.length;
        load(slides[current]);
        slides[current].classList.add("is-active");
        load(slides[(current + 1) % slides.length]); // get the next one ready
    }

    function play(on) {
        if (on) load(slides[1]);
        clearInterval(timer);
        timer = on ? setInterval(next, 6000) : null;
    }

    if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
            play(entries[0].isIntersecting && !document.hidden);
        }).observe(slides[0].parentElement);
    } else {
        play(true);
    }
    document.addEventListener("visibilitychange", () => play(!document.hidden));
})();
/* ---------- Success stories ----------
   The arrows and dots switch the quote and the matching photo on the green panel.
   Stories also rotate on their own every 8 seconds, pausing while the
   section is off screen, hovered or focused, or after the pause button.
   With reduced motion they don't rotate. */
(function () {
    const section = document.getElementById("stories");
    const stories = document.querySelectorAll(".story");
    const visuals = document.querySelectorAll(".story-visual");
    const dots = document.querySelectorAll(".story-dot");
    const pauseBtn = document.getElementById("story-pause");
    if (!section || !stories.length || !dots.length) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = 0;
    let timer = null;
    let paused = reducedMotion;
    let hovering = false;
    let visible = false;

    function show(index) {
        current = index;
        stories.forEach((story, i) => {
            story.hidden = i !== index;
            story.classList.toggle("is-active", i === index);
        });
        visuals.forEach((visual, i) => visual.classList.toggle("is-active", i === index));
        dots.forEach((dot, i) => {
            dot.classList.toggle("is-active", i === index);
            if (i === index) dot.setAttribute("aria-current", "true");
            else dot.removeAttribute("aria-current");
        });
    }

    function schedule() {
        clearInterval(timer);
        timer = null;
        if (paused || hovering || !visible || document.hidden) return;
        timer = setInterval(() => show((current + 1) % stories.length), 8000);
    }

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            show(index);
            schedule(); // restart the countdown after a manual pick
        });
    });

    const prev = document.getElementById("story-prev");
    const next = document.getElementById("story-next");
    if (prev) prev.addEventListener("click", () => { show((current - 1 + stories.length) % stories.length); schedule(); });
    if (next) next.addEventListener("click", () => { show((current + 1) % stories.length); schedule(); });

    if (pauseBtn) {
        if (reducedMotion) pauseBtn.hidden = true;
        pauseBtn.addEventListener("click", () => {
            paused = !paused;
            pauseBtn.setAttribute("aria-pressed", String(paused));
            pauseBtn.querySelector(".visually-hidden").textContent = paused ? "Play stories" : "Pause stories";
            schedule();
        });
    }

    section.addEventListener("mouseenter", () => { hovering = true; schedule(); });
    section.addEventListener("mouseleave", () => { hovering = false; schedule(); });
    section.addEventListener("focusin", () => { hovering = true; schedule(); });
    section.addEventListener("focusout", () => { hovering = false; schedule(); });
    document.addEventListener("visibilitychange", schedule);

    if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
            visible = entries[0].isIntersecting;
            schedule();
        }, { threshold: 0.3 }).observe(section);
    }
})();

/* ---------- Welcome video pop-up ----------
   The play button opens Shannan's Vimeo video in a dialog. The player is
   only created when it opens (nothing loads from Vimeo before that) and is
   removed on close, which also stops playback. Escape, the close button or
   a click on the dark backdrop closes it. */
(function () {
    const openBtn = document.getElementById("watch-play");
    const dialog = document.getElementById("video-dialog");
    const frame = document.getElementById("video-frame");
    const closeBtn = document.getElementById("video-close");
    if (!openBtn || !dialog || !frame || typeof dialog.showModal !== "function") return;

    openBtn.addEventListener("click", () => {
        const iframe = document.createElement("iframe");
        iframe.src = frame.dataset.src;
        iframe.title = "Welcome to The Professional Pen";
        iframe.allow = "autoplay; fullscreen; picture-in-picture";
        iframe.allowFullscreen = true;
        frame.appendChild(iframe);
        dialog.showModal();
        if (window.lenis) window.lenis.stop();
    });

    closeBtn.addEventListener("click", () => dialog.close());

    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("close", () => {
        frame.textContent = "";
        if (window.lenis) window.lenis.start();
        openBtn.focus();
    });
})();

/* ---------- FAQ ----------
   Opening one question closes the others, so the list stays short. */
(function () {
    const items = document.querySelectorAll(".faq-item");
    items.forEach((item) => {
        item.addEventListener("toggle", () => {
            if (!item.open) return;
            items.forEach((other) => {
                if (other !== item) other.open = false;
            });
        });
    });
})();

/* ---------- FAQ topic tabs ----------
   Standard tabs: click or use the arrow keys to switch topic; only the
   chosen topic's questions show. */
(function () {
    const tabs = [...document.querySelectorAll(".faq-tab")];
    if (!tabs.length) return;

    function select(tab, focus) {
        tabs.forEach((t) => {
            const on = t === tab;
            t.setAttribute("aria-selected", String(on));
            t.tabIndex = on ? 0 : -1;
            document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
        });
        if (focus) tab.focus();
    }

    tabs.forEach((tab, i) => {
        tab.addEventListener("click", () => select(tab, false));
        tab.addEventListener("keydown", (event) => {
            let next = null;
            if (event.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
            if (event.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
            if (event.key === "Home") next = tabs[0];
            if (event.key === "End") next = tabs[tabs.length - 1];
            if (next) {
                event.preventDefault();
                select(next, true);
            }
        });
    });
})();

/* ---------- Contact form ----------
   Checks the fields, then opens the visitor's email app with the message
   addressed to TPP and filled in. (Swap for a form service when the site
   goes live.) */
(function () {
    const form = document.getElementById("contact-form");
    if (!form) return;

    const status = document.getElementById("cf-status");
    const fields = {
        name: form.elements.name,
        email: form.elements.email,
        message: form.elements.message
    };

    function check(field) {
        const valid = field.checkValidity() && field.value.trim() !== "";
        field.setAttribute("aria-invalid", String(!valid));
        document.getElementById(`${field.id}-error`).hidden = valid;
        return valid;
    }

    Object.values(fields).forEach((field) => {
        field.addEventListener("blur", () => {
            if (field.value) check(field);
        });
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const invalid = Object.values(fields).filter((field) => !check(field));
        if (invalid.length) {
            invalid[0].focus();
            status.textContent = "";
            return;
        }
        const topic = form.elements.topic.value;
        const subject = `${topic}: message from ${fields.name.value.trim()}`;
        const body = `${fields.message.value.trim()}\n\n${fields.name.value.trim()}\n${fields.email.value.trim()}`;
        window.location.href = `mailto:info@theprofessionalpen.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        status.textContent = "Your email app should open with your message ready to send.";
    });
})();

/* ---------- Footer year ---------- */
(function () {
    const year = document.getElementById("footer-year");
    if (year) year.textContent = new Date().getFullYear();
})();

/* ---------- Newsletter signup ----------
   Checks the address, then opens the visitor's email app with a signup
   request to TPP. (Connect to her email platform when the site goes live.) */
(function () {
    const form = document.getElementById("newsletter-form");
    if (!form) return;
    const input = form.elements.email;
    const status = document.getElementById("nl-status");

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const valid = input.checkValidity() && input.value.trim() !== "";
        input.setAttribute("aria-invalid", String(!valid));
        if (!valid) {
            status.textContent = "Please enter a valid email address.";
            input.focus();
            return;
        }
        const body = `Please add ${input.value.trim()} to The Professional Pen newsletter.`;
        window.location.href = `mailto:info@theprofessionalpen.com?subject=${encodeURIComponent("Newsletter signup")}&body=${encodeURIComponent(body)}`;
        status.textContent = "Your email app should open with your signup ready to send.";
    });
})();

/* ---------- Scroll fades ----------
   Each section's content fades in as it scrolls into view and back out as it
   leaves, so it plays again on the way back. The hero is left alone (it's on
   screen when the page opens). Off with reduced motion. */
(function () {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    // [selector, direction, stagger in seconds between matches]
    const groups = [
        [".offers .section-header", "up", 0],
        [".offer-card", "up", 0.12],
        [".verdict .section-header", "up", 0],
        [".verdict-card--greenlight", "left", 0],
        [".verdict-card--pass", "right", 0],
        [".verdict-cta", "up", 0],
        [".stories-content", "left", 0],
        [".story-frame", "right", 0],
        [".about-media", "left", 0],
        [".about-content", "right", 0],
        [".watch-content", "up", 0],
        [".faq-main", "left", 0],
        [".faq-figure", "right", 0],
        [".final-cta-top", "up", 0],
        [".final-cta-content", "up", 0],
        [".contact-figure", "left", 0],
        [".contact-main", "right", 0],
        [".newsletter-inner", "up", 0],
        [".footer-top", "up", 0]
    ];

    const targets = [];
    groups.forEach(([selector, direction, stagger]) => {
        document.querySelectorAll(selector).forEach((element, i) => {
            element.dataset.fade = direction;
            element.style.setProperty("--fade-delay", `${i * stagger}s`);
            targets.push(element);
        });
    });
    document.documentElement.classList.add("fade-ready");

    // Shown once ~12% is on screen; fades back out as it leaves
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            entry.target.classList.toggle("is-shown", entry.intersectionRatio >= 0.12);
        });
    }, { threshold: [0, 0.12], rootMargin: "0px 0px -6% 0px" });
    targets.forEach((element) => observer.observe(element));
})();
