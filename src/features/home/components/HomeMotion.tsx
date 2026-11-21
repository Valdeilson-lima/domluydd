"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  MotionConfig,
  animate,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function HomeMotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Barra ultrafina de progresso de leitura acoplada à base do header sticky. */
export function HomeScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-primary"
    />
  );
}

export interface HomeNavItem {
  id: string;
  label: string;
}

/** Navegação com rolagem suave controlada por curva easing + indicador deslizante da seção ativa. */
export function HomeNav({ items }: { items: HomeNavItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");
  const shouldReduceMotion = useReducedMotion();
  const scrollAnimRef = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top) -
              Math.abs(b.boundingClientRect.top)
          );
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: [0, 0.15, 0.4],
      }
    );

    elements.forEach((el) => observer.observe(el));

    const handleTopCheck = () => {
      if (window.scrollY < 160) {
        setActiveId("");
      }
    };
    window.addEventListener("scroll", handleTopCheck, { passive: true });
    handleTopCheck();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleTopCheck);
      scrollAnimRef.current?.stop();
    };
  }, [items]);

  const handleAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();

    setActiveId(id);
    window.history.replaceState(null, "", `#${id}`);

    const headerOffset = 76;
    const targetY = Math.max(
      0,
      target.getBoundingClientRect().top + window.scrollY - headerOffset
    );

    if (shouldReduceMotion) {
      window.scrollTo({ top: targetY, behavior: "instant" });
      return;
    }

    scrollAnimRef.current?.stop();

    const cancelOnUserInput = () => {
      scrollAnimRef.current?.stop();
      cleanupListeners();
    };
    const cleanupListeners = () => {
      window.removeEventListener("wheel", cancelOnUserInput);
      window.removeEventListener("touchstart", cancelOnUserInput);
      window.removeEventListener("keydown", cancelOnUserInput);
    };

    window.addEventListener("wheel", cancelOnUserInput, { passive: true });
    window.addEventListener("touchstart", cancelOnUserInput, { passive: true });
    window.addEventListener("keydown", cancelOnUserInput, { passive: true });

    const distance = Math.abs(targetY - window.scrollY);
    const duration = Math.min(0.85, Math.max(0.45, distance / 1800));

    scrollAnimRef.current = animate(window.scrollY, targetY, {
      duration,
      ease: SMOOTH_EASE,
      onUpdate: (latest) => {
        window.scrollTo({ top: latest, behavior: "instant" });
      },
      onComplete: cleanupListeners,
      onStop: cleanupListeners,
    });
  };

  return (
    <nav
      aria-label="Navegação principal"
      className="hidden items-center gap-1 text-sm font-semibold md:flex"
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => handleAnchorClick(e, item.id)}
            aria-current={isActive ? "location" : undefined}
            className={`relative rounded-lg px-3.5 py-2 transition-colors duration-200 ${
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="home-nav-pill"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 -z-10 rounded-lg bg-primary/10"
              />
            )}
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

/** Coluna de texto do hero com entrada escalonada suave. */
export function HomeHeroStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.075,
            delayChildren: 0.04,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HomeHeroItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: SMOOTH_EASE },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Card de fotografia do hero com entrada suave + parallax discreto vinculado à rolagem. */
export function HomeHeroMedia({
  children,
  footer,
  className,
}: {
  children: ReactNode;
  footer: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [0, 28]
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [1, 1] : [1, 1.05]
  );

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18, scale: 0.975 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.12, ease: SMOOTH_EASE }}
      className={className}
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-foreground/8">
        <div className="aspect-4/3 w-full overflow-hidden bg-secondary">
          <motion.div style={{ y, scale }} className="size-full">
            {children}
          </motion.div>
        </div>
        {footer}
      </div>
    </motion.div>
  );
}

/** Revelação suave de blocos ao entrar na tela durante a rolagem. */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 22,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.55, delay, ease: SMOOTH_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Grid com entrada escalonada (stagger) dos cards ao aparecerem na tela. */
export function StaggerGrid({
  children,
  className,
  stagger = 0.07,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  liftOnHover = false,
}: {
  children: ReactNode;
  className?: string;
  liftOnHover?: boolean;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.48, ease: SMOOTH_EASE },
        },
      }}
      whileHover={
        liftOnHover
          ? {
              y: -4,
              transition: { type: "spring", stiffness: 360, damping: 26 },
            }
          : undefined
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
