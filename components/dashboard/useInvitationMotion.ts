"use client";

import { useEffect, useRef } from "react";

// Reveal content rather than containers so the gallery dialog stays fixed to
// the viewport and long sections appear gradually as they are read.
const revealSelector = [
  ".wa-cover-heading > *",
  ".wa-portrait",
  ".wa-no-photo > *",
  ".wa-panel > :not(.invite-countdown-clock):not(.wa-timeline)",
  ".wa-timeline > li",
  ".wa-section-photo",
  ".wa-photo-grid > figure",
  ".wa-photo-carousel",
  ".wa-footer > *",
  ".wedding-hero-copy > *",
  ".wedding-hero-photo",
  ".wedding-welcome > *",
  ".wedding-section-heading > *",
  ".wedding-section-body > *",
  ".wedding-finale > *",
  ".wedding-footer > *",
  ".invite-hero-content > *",
  ".invite-hero-side-note",
  ".invite-welcome > :not(.invite-decoration-frame)",
  ".invite-location-photo",
  ".invite-location-main-copy > *",
  ".invite-content-image:not(.invite-gallery-feature)",
  ".invite-section-decoration",
  ".invite-content-copy > :not(ul):not(ol)",
  ".invite-program-list > li",
  ".invite-gallery-tile",
  ".invite-parents-list > li",
  ".invite-countdown-panel > :not(.invite-countdown-clock):not(.invite-decoration-frame)",
  ".invite-countdown-unit",
  ".invite-website-footer > *",
].join(",");

export function useInvitationMotion() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    const view = root?.ownerDocument.defaultView;
    // The editor renders the invitation into its own iframe document.
    if (!root || !view || !view.IntersectionObserver || !root.animate) return;

    const preference = view.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet<Element>();
    const pending = new Set<HTMLElement>();
    const animations = new Map<HTMLElement, Animation>();

    const reveal = (element: HTMLElement, immediate = false) => {
      observer.unobserve(element);
      pending.delete(element);
      element.removeAttribute("data-invite-motion");
      if (immediate || preference.matches) {
        animations.get(element)?.cancel();
        animations.delete(element);
        return;
      }

      const siblings = Array.from(element.parentElement?.children ?? [])
        .filter((child) => child.matches(revealSelector) && child.getClientRects().length);
      const delay = Math.min(Math.max(0, siblings.indexOf(element)) * 65, 260);
      const isPhoto = element.matches(".invite-location-photo,.invite-content-image,.invite-gallery-tile,.wa-portrait,.wa-section-photo,.wa-photo-grid > figure,.wa-photo-carousel");
      const animation = element.animate([
        { opacity: 0, transform: isPhoto ? "scale(.985)" : "translateY(16px)" },
        { opacity: 1, transform: "none" },
      ], { duration: isPhoto ? 800 : 650, delay, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" });
      animations.set(element, animation);
      animation.onfinish = () => { animation.cancel(); animations.delete(element); };
    };

    const observer = new view.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      });
    }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });

    const register = () => {
      if (preference.matches) return;
      root.querySelectorAll<HTMLElement>(revealSelector).forEach((element) => {
        if (seen.has(element) || !element.getClientRects().length) return;
        seen.add(element);
        // Preserve content passed by scroll restoration or an anchor link.
        if (element.getBoundingClientRect().bottom <= 0) return;
        element.dataset.inviteMotion = "pending";
        pending.add(element);
        observer.observe(element);
      });
    };

    const showAll = () => {
      pending.forEach((element) => reveal(element, true));
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const onPreferenceChange = () => {
      if (preference.matches) showAll();
      else register();
    };
    const onFocus = (event: FocusEvent) => {
      const target = event.target as Element;
      // Keyboard destinations must be visible immediately, even mid-animation.
      pending.forEach((element) => { if (element.contains(target)) reveal(element, true); });
      animations.forEach((animation, element) => {
        if (element.contains(target)) { animation.cancel(); animations.delete(element); }
      });
    };

    register();
    // Support newly inserted sections/photos in the live editor without
    // restarting existing animations or rescanning on countdown text updates.
    const mutations = new view.MutationObserver((records) => {
      if (records.some((record) => Array.from(record.addedNodes).some((node) => node.nodeType === 1))) {
        pending.forEach((element) => { if (!root.contains(element)) reveal(element, true); });
        register();
      }
    });
    mutations.observe(root, { childList: true, subtree: true });
    preference.addEventListener("change", onPreferenceChange);
    root.addEventListener("focusin", onFocus);

    return () => {
      mutations.disconnect();
      observer.disconnect();
      showAll();
      preference.removeEventListener("change", onPreferenceChange);
      root.removeEventListener("focusin", onFocus);
    };
  }, []);

  return ref;
}
