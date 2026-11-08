"use client";
import { useEffect } from "react";
import { trackLandingEvent } from "@/lib/client-analytics";
export function LandingAnalytics() {
  useEffect(() => { trackLandingEvent("landing_view"); }, []);
  return null;
}
