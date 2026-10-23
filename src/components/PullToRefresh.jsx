import React, { useEffect, useRef, useState } from "react";
import { Loader2, ChevronDown } from "lucide-react";

const THRESHOLD = 70;
const MAX = 110;

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullRef = useRef(0);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };
    const onTouchMove = (e) => {
      if (!pulling.current || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0 && window.scrollY <= 0) {
        const d = Math.min(delta * 0.5, MAX);
        pullRef.current = d;
        setPull(d);
      }
    };
    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullRef.current > THRESHOLD) {
        setRefreshing(true);
        setPull(THRESHOLD);
        try {
          await onRefresh?.();
        } finally {
          setRefreshing(false);
          setPull(0);
          pullRef.current = 0;
        }
      } else {
        setPull(0);
        pullRef.current = 0;
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [refreshing, onRefresh]);

  const ready = pull >= THRESHOLD;

  return (
    <>
      <div
        className="flex items-center justify-center overflow-hidden text-primary transition-[height] duration-150 ease-out"
        style={{ height: pull }}
      >
        {refreshing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ChevronDown
            className={`h-5 w-5 transition-transform duration-200 ${ready ? "rotate-180" : ""}`}
          />
        )}
      </div>
      {children}
    </>
  );
}
