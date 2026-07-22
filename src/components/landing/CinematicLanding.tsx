"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLogin } from "@/hooks/use-login";
import styles from "./landing.module.css";

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
};

type ScenePhase = "landing" | "landingLeaving" | "authEntering" | "auth";

type CardConfig = {
  title: string;
  mode: "login" | "register";
  description: string[];
};

function Card({ title, description, onClick, delay }: { title: string; description: string[]; onClick?: () => void; delay: number }) {
  const [transform, setTransform] = useState("");
  const cardRectRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    cardRectRef.current = event.currentTarget.getBoundingClientRect();
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRectRef.current ?? event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const rx = -(y - rect.height / 2) / 18;
    const ry = (x - rect.width / 2) / 16;

    event.currentTarget.style.setProperty('--gx', `${(x / rect.width) * 100}%`);
    event.currentTarget.style.setProperty('--gy', `${(y / rect.height) * 100}%`);

    setTransform(`rotateX(${rx}deg) rotateY(${ry}deg) translateY(-16px) scale(1.04)`);
  };

  return (
    <div
      className={styles.card}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTransform("")}
      onClick={onClick}
      style={{ transform, animationDelay: `${delay}ms` }}
    >
      <div className={styles.cardContent}>
        <div className={styles.big}>{title}</div>
        <div className={styles.small}>
          {description.map((line, index) => (
            <span
              key={`${title}-${index}`}
              className={index === description.length - 1 ? styles.cardAction : undefined}
              style={{ display: "block" }}
            >
              {line}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function LandingScene({ isExiting, onExitComplete, onStart }: { isExiting: boolean; onExitComplete: () => void; onStart: () => void }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [magnet, setMagnet] = useState({ x: 0, y: 0 });

  const RADIUS = 120;
  const STRENGTH = 0.4;

  const handleMagneticMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist < RADIUS) {
      const factor = (1 - dist / RADIUS) * STRENGTH;
      setMagnet({ x: dx * factor, y: dy * factor });
    }
  };

  const handleMagneticLeave = () => setMagnet({ x: 0, y: 0 });

  return (
    <div className={`${styles.scene} ${styles.landingScene} ${isExiting ? styles.landingSceneExiting : ""}`} onAnimationEnd={isExiting ? onExitComplete : undefined}>
      <div className={styles.title}>ARQUIVO 001</div>
      <div className={styles.subtitle}>Meme-sis</div>
      <div
        ref={wrapRef}
        className={styles.magWrap}
        onMouseMove={handleMagneticMove}
        onMouseLeave={handleMagneticLeave}
        style={{ transform: `translate(${magnet.x}px, ${magnet.y}px)` }}
      >
        <button type="button" className={styles.enter} onClick={onStart}>
          <span
            className={styles.enterLabel}
            style={{ transform: `translate(${magnet.x * 0.4}px, ${magnet.y * 0.4}px)` }}
          >
            INICIAR
          </span>
        </button>
      </div>
    </div>
  );
}

function AuthScene({ cards, onCardClick, onEnterComplete }: { cards: CardConfig[]; onCardClick: (mode: "login" | "register") => void; onEnterComplete: () => void }) {
  return (
    <div className={`${styles.scene} ${styles.authScene}`} onAnimationEnd={onEnterComplete}>
      <div className={styles.cards}>
        {cards.map((card, index) => (
          <Card key={card.title} title={card.title} description={card.description} onClick={() => onCardClick(card.mode)} delay={index * 90} />
        ))}
      </div>
    </div>
  );
}

export default function CinematicLanding() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<ScenePhase>("landing");
  const { openLoginModal, openLoadingExperience, isAuthenticated, isLoginModalOpen } = useLogin();

  useEffect(() => {
    if (!isAuthenticated) {
      setPhase("landing");
    }
  }, [isAuthenticated]);

  const cards = useMemo<CardConfig[]>(
    () => [
      {
        title: "CRIAR CONTA",
        mode: "register",
        description: [
          "Você está entrando em um documento vivo.",
          "Cada contribuição ajuda a ampliar",
          "o significado da obra para quem vier depois.",
          "──────────────",
          "Nenhum texto termina na última linha.",
          "CRIAR CONTA",
        ],
      },
      {
        title: "ENTRAR",
        mode: "login",
        description: [
          "Algumas histórias merecem ser revisitadas.",
          "Continue explorando, comentando e",
          "descobrindo novos significados.",
          "──────────────",
          "Toda leitura revela uma nova perspectiva.",
          "ENTRAR",
        ],
      },
    ],
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      const points: Particle[] = [];
      for (let i = 0; i < 90; i += 1) {
        points.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: Math.random() * 2 + 1,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
        });
      }
      return points;
    };

    resize();
    const pts = createParticles();
    window.addEventListener("resize", resize);

    let animationFrame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) {
          p.vx *= -1;
        }
        if (p.y < 0 || p.y > canvas.height) {
          p.vy *= -1;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,.45)";
        ctx.fill();
      });

      animationFrame = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const handleStart = () => {
    if (isAuthenticated) {
      openLoadingExperience();
      return;
    }

    setPhase("authEntering");
  };

  const handleLandingExitComplete = () => {
    setPhase("authEntering");
  };

  const handleAuthEnterComplete = () => {
    setPhase("auth");
  };

  const handleCardClick = (mode: "login" | "register") => {
    if (isAuthenticated) {
      openLoadingExperience();
      return;
    }

    openLoginModal(undefined, "Você precisa estar conectado para continuar.", mode, "landing");
  };

  return (
    <div className={`${styles.root} ${isLoginModalOpen ? styles.dimmed : ""}`}>
      <div className={styles.bgGlow} />
      <canvas ref={canvasRef} className={styles.canvas} />

      {phase === "landing" || phase === "landingLeaving" ? (
        <LandingScene isExiting={phase === "landingLeaving"} onExitComplete={handleLandingExitComplete} onStart={handleStart} />
      ) : null}

      {phase === "authEntering" || phase === "auth" ? (
        <AuthScene cards={cards} onCardClick={handleCardClick} onEnterComplete={handleAuthEnterComplete} />
      ) : null}
    </div>
  );
}
