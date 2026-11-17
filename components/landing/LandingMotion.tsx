"use client";

import { useEffect, useRef, type ReactNode } from "react";

const revealTargets = ".how-intro, .steps > article, .benefits-heading, .benefit-card, .pricing-copy, .price-card, .home-faq-heading, .home-faq-group, .home-faq-support";

export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const main = root.current;
    if (!main || !window.IntersectionObserver || !Element.prototype.animate) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 760px)");
    const animations = new Map<Element, Animation>();
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver((entries) => {
      let order = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (preference.matches || entry.target.contains(document.activeElement)) continue;

        const animation = entry.target.animate(
          [
            { transform: `translateY(${mobile.matches ? 20 : 32}px) scale(.98)` },
            { transform: "none" },
          ],
          { duration: 700, delay: Math.min(order++, 2) * 110, easing: "cubic-bezier(.22, .68, 0, 1)", fill: "backwards" },
        );
        animations.set(entry.target, animation);
        animation.onfinish = () => {
          animation.cancel();
          animations.delete(entry.target);
        };
      }
    }, { threshold: 0, rootMargin: "0px 0px -64px 0px" });

    const register = (element: Element) => {
      if (seen.has(element)) return;
      seen.add(element);
      // Leave initially visible content untouched, including restored scroll positions.
      // Nothing is hidden while waiting for JavaScript or an observer callback.
      if (!preference.matches && element.getBoundingClientRect().top >= window.innerHeight) {
        observer.observe(element);
      }
    };
    main.querySelectorAll(revealTargets).forEach(register);

    const cancelAnimations = () => {
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const onPreferenceChange = () => {
      if (!preference.matches) return;
      observer.disconnect();
      cancelAnimations();
    };
    const onFocus = (event: FocusEvent) => {
      for (const [element, animation] of animations) {
        if (event.target instanceof Node && element.contains(event.target)) {
          animation.cancel();
          animations.delete(element);
        }
      }
    };
    preference.addEventListener("change", onPreferenceChange);
    main.addEventListener("focusin", onFocus);
    return () => {
      observer.disconnect();
      cancelAnimations();
      preference.removeEventListener("change", onPreferenceChange);
      main.removeEventListener("focusin", onFocus);
    };
  }, []);

  return <main ref={root} className="landing-home">{children}</main>;
}
