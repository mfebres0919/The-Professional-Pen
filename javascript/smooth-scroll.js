/* ==========================================================================
   THE PROFESSIONAL PEN — SMOOTH SCROLLING
   Lenis eases mouse-wheel / trackpad scrolling (touch stays native).
   In-page links glide too, stopping below the sticky header.
   Off for reduced motion. Shared as window.lenis.
   ========================================================================== */
(function () {
    if (typeof Lenis === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
        duration: 0.45,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
    });
    window.lenis = lenis;

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const header = document.getElementById("header");
    document.addEventListener("click", (event) => {
        const link = event.target.closest('a[href^="#"]');
        if (!link) return;
        const id = link.getAttribute("href").slice(1);
        const target = id ? document.getElementById(id) : null;
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, { offset: -(header ? header.offsetHeight : 72) });
    });

    // Freeze smooth scrolling while the phone menu is open
    new MutationObserver(() => {
        document.body.classList.contains("menu-open") ? lenis.stop() : lenis.start();
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
})();
