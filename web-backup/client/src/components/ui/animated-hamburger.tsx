import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { forwardRef, ForwardedRef } from "react";

interface AnimatedHamburgerProps {
  isOpen: boolean;
  onClick: () => void;
}

export const AnimatedHamburger = forwardRef(
  ({ isOpen, onClick }: AnimatedHamburgerProps, ref: ForwardedRef<HTMLButtonElement>) => {
    const lineHeight = 2;
    const lineSpacing = 6;

    return (
      <Button
        ref={ref}
        variant="secondary"
        size="icon"
        onClick={onClick}
        className="relative"
      >
        {/* Top line */}
        <motion.span
          className="absolute bg-current rounded-full"
          style={{
            width: 18,
            height: lineHeight,
            top: `calc(50% - ${lineSpacing}px)`,
          }}
          initial={false}
          animate={{
            rotate: isOpen ? 45 : 0,
            y: isOpen ? lineSpacing : 0,
          }}
          transition={{ duration: 0.3 }}
        />
        {/* Middle line */}
        <motion.span
          className="absolute bg-current rounded-full"
          style={{
            width: 18,
            height: lineHeight,
            top: "50%",
            y: "-50%",
          }}
          initial={false}
          animate={{
            opacity: isOpen ? 0 : 1,
            x: isOpen ? 8 : 0,
          }}
          transition={{ duration: 0.3 }}
        />
        {/* Bottom line */}
        <motion.span
          className="absolute bg-current rounded-full"
          style={{
            width: 18,
            height: lineHeight,
            bottom: `calc(50% - ${lineSpacing}px)`,
          }}
          initial={false}
          animate={{
            rotate: isOpen ? -45 : 0,
            y: isOpen ? -lineSpacing : 0,
          }}
          transition={{ duration: 0.3 }}
        />
      </Button>
    );
  }
);

AnimatedHamburger.displayName = "AnimatedHamburger";