import React, { useRef } from "react";
import { motion } from "framer-motion";

/**
 * Wraps a routed page with a direction-aware slide transition.
 * `direction` is resolved from the history action (PUSH = forward, POP = back,
 * REPLACE/RELOAD = fade). The transform is cleared once the enter animation
 * settles so that descendant `position: fixed` elements (sticky header, bottom
 * tab bar) remain anchored to the viewport at rest instead of the transformed
 * wrapper — important for the native WebView shell.
 */
export default function PageTransition({
  children,
  direction,
  variants,
  transition,
}) {
  const ref = useRef(null);

  return (
    <motion.div
      ref={ref}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      onAnimationComplete={() => {
        if (ref.current) ref.current.style.transform = "none";
      }}
    >
      {children}
    </motion.div>
  );
}
