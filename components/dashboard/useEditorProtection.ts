"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { EditorPersistence } from "@/lib/editor-persistence";

export function useEditorProtection(options: ConstructorParameters<typeof EditorPersistence>[0]) {
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  const [controller] = useState(() => new EditorPersistence(options));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getServerSnapshot);
  useEffect(() => {
    let storage: Storage | null = null;
    try { storage = window.localStorage; } catch { /* Private/blocked storage still permits server saves. */ }
    controller.start({ storage, uuid: () => crypto.randomUUID(), now: () => Date.now(), online: () => navigator.onLine });
    const backup = () => controller.backup();
    const retry = () => controller.retry();
    window.addEventListener("pagehide", backup);
    window.addEventListener("popstate", backup);
    window.addEventListener("online", retry);
    document.addEventListener("visibilitychange", backup);
    return () => {
      controller.stop();
      window.removeEventListener("pagehide", backup);
      window.removeEventListener("popstate", backup);
      window.removeEventListener("online", retry);
      document.removeEventListener("visibilitychange", backup);
    };
  }, [controller]);
  useEffect(() => {
    if (!controller.shouldWarn()) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!controller.shouldWarn()) return;
      controller.backup(); event.preventDefault(); event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [controller, state]);
  const confirmNavigation = (event: { preventDefault(): void }, href: string) => {
    if (!controller.shouldWarn()) return;
    controller.backup();
    event.preventDefault(); setDestination(href);
  };
  return { controller, state, confirmNavigation, navigation: {
    destination, stay: () => setDestination(null), leave: () => { if (destination) { setDestination(null); router.push(destination); } },
  } };
}
