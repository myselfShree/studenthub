'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import StudentHubLogo from '@/components/StudentHubLogo';
import StudentCharacter from '@/components/StudentCharacter';

/* ─────────────────────────────────────────────────────────────────────────────
   HOOK — Typewriter
───────────────────────────────────────────────────────────────────────────── */
function useTypewriter(text: string, speed = 38, startDelay = 700) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const delayTimer = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(delayTimer);
  }, [text, speed, startDelay]);

  return { displayed, done };
}

/* ─────────────────────────────────────────────────────────────────────────────
   HOOK — Mouse parallax (normalized -1 to 1)
───────────────────────────────────────────────────────────────────────────── */
function useMouseParallax() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    };

    const tick = () => {
      // Smooth lerp toward target
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.06;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.06;
      setPos({ x: currentRef.current.x, y: currentRef.current.y });
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return pos;
}

/* ─────────────────────────────────────────────────────────────────────────────
   LANDING PAGE
───────────────────────────────────────────────────────────────────────────── */
const TYPEWRITER_TEXT =
  "Your notes, tasks, habits, and files — unified in one calm workspace built for students who mean it.";

const PILL_BUTTONS = [
  { label: 'Start for free', href: '/register', primary: true },
  { label: 'Notes & AI', href: '/register', primary: false },
  { label: 'Habit tracker', href: '/register', primary: false },
  { label: 'File sharing', href: '/register', primary: false },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const mouse = useMouseParallax();
  const { displayed, done } = useTypewriter(TYPEWRITER_TEXT, 36, 900);
  const [pillsVisible, setPillsVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    const t = setTimeout(() => setPillsVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Parallax layers (multiply mouse offset by depth factor)
  const layer = (depth: number, axis: 'x' | 'y' = 'x') =>
    `${mouse[axis] * depth}px`;

  return (
    <div
      className="min-h-screen bg-[#11120D] text-[#FFFBF4] relative overflow-hidden selection:bg-[#565449] selection:text-[#FFFBF4]"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* ── Atmospheric grain texture overlay ── */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* ── Subtle warm radial gradient ── */}
      <div
        className="pointer-events-none fixed inset-0 z-[0]"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 60% 50%, rgba(86,84,73,0.18) 0%, transparent 70%)',
        }}
      />

      {/* ────────────────────────────────────────────────────────
          NAVBAR
      ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-5 sm:px-8 py-4 sm:py-5"
        style={{ borderBottom: '1px solid rgba(54,54,47,0.5)' }}
      >
        {/* Logo */}
        <Link href="/" className="transition-opacity hover:opacity-80">
          <StudentHubLogo size={26} textSize="text-sm tracking-wide" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 text-[13px] text-[#D8CFBC]">
          {['Notes', 'Tasks', 'Habits', 'Resources'].map((item, i, arr) => (
            <React.Fragment key={item}>
              <Link
                href="/register"
                className="px-2 py-1 hover:text-[#FFFBF4] transition-colors"
              >
                {item}
              </Link>
              {i < arr.length - 1 && (
                <span className="text-[#36362F] select-none">,</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-[13px] text-[#D8CFBC] hover:text-[#FFFBF4] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-[13px] text-[#11120D] bg-[#FFFBF4] hover:bg-[#D8CFBC] transition-colors px-4 py-2 rounded-full font-medium"
          >
            Get started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-1 z-30"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
        >
          <span
            className="w-6 h-[2px] bg-[#FFFBF4] block transition-all duration-300 origin-center"
            style={{
              transform: menuOpen
                ? 'translateY(7px) rotate(45deg)'
                : 'none',
            }}
          />
          <span
            className="w-6 h-[2px] bg-[#FFFBF4] block transition-all duration-300"
            style={{ opacity: menuOpen ? 0 : 1 }}
          />
          <span
            className="w-6 h-[2px] bg-[#FFFBF4] block transition-all duration-300 origin-center"
            style={{
              transform: menuOpen
                ? 'translateY(-7px) rotate(-45deg)'
                : 'none',
            }}
          />
        </button>
      </header>

      {/* Mobile menu overlay */}
      <div
        className="fixed inset-0 z-[15] bg-[#11120D]/96 backdrop-blur-sm flex flex-col justify-center px-8 gap-8 md:hidden transition-all duration-300"
        style={{
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
      >
        {['Notes', 'Tasks', 'Habits', 'Resources'].map((item) => (
          <Link
            key={item}
            href="/register"
            className="text-[32px] font-medium text-[#FFFBF4] hover:text-[#D8CFBC] transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            {item}
          </Link>
        ))}
        <Link
          href="/login"
          className="text-[20px] text-[#D8CFBC] underline underline-offset-4 hover:text-[#FFFBF4] transition-colors"
          onClick={() => setMenuOpen(false)}
        >
          Sign in
        </Link>
      </div>

      {/* ────────────────────────────────────────────────────────
          MAIN HERO — split layout
      ─────────────────────────────────────────────────────────── */}
      <main className="relative z-[2] min-h-screen flex flex-col md:flex-row items-center justify-between px-5 sm:px-8 md:px-10 lg:px-16 pt-24 pb-16 md:pt-0">
        
        {/* ── LEFT: Text content ── */}
        <div className="flex-1 max-w-xl md:max-w-lg lg:max-w-xl flex flex-col justify-center order-2 md:order-1 mt-8 md:mt-0">

          {/* Eyebrow label */}
          <p
            className="mb-5 sm:mb-6 text-[#8D8777] pointer-events-none select-none"
            style={{
              fontSize: 'clamp(11px, 1.4vw, 13px)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            Student Hub — Academic Workspace
          </p>

          {/* Main heading */}
          <h1
            className="mb-5 sm:mb-7 text-[#FFFBF4] font-display"
            style={{
              fontSize: 'clamp(36px, 5.5vw, 72px)',
              lineHeight: 1.08,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              fontFamily: "'Cinzel', 'Playfair Display', serif",
            }}
          >
            One place.<br />
            <span style={{ color: '#D8CFBC' }}>Every tool.</span>
          </h1>

          {/* Typewriter body text */}
          <div
            className="mb-6 sm:mb-8 text-[#D8CFBC]"
            style={{
              fontSize: 'clamp(14px, 1.8vw, 17px)',
              lineHeight: 1.7,
              fontWeight: 400,
              minHeight: '4em',
            }}
          >
            {displayed}
            {!done && (
              <span
                className="typewriter-cursor inline-block align-middle ml-[2px]"
                style={{
                  width: '2px',
                  height: '1.1em',
                  background: '#8E9B7A',
                  verticalAlign: 'middle',
                  display: 'inline-block',
                }}
              />
            )}
          </div>

          {/* Pill action buttons */}
          <div
            className="flex flex-wrap gap-y-2"
            style={{
              opacity: pillsVisible ? 1 : 0,
              transform: pillsVisible ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
          >
            {PILL_BUTTONS.map(({ label, href, primary }) => (
              <Link
                key={label}
                href={href}
                className="pill-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 0.25em 0.4em',
                  padding: '0.45em 1.2em',
                  borderRadius: '9999px',
                  fontSize: 'clamp(12px, 1.3vw, 14px)',
                  fontWeight: primary ? 600 : 400,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                  background: primary ? '#FFFBF4' : 'transparent',
                  color: primary ? '#11120D' : '#D8CFBC',
                  border: primary
                    ? '1px solid #FFFBF4'
                    : '1px solid #36362F',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = primary ? '#D8CFBC' : '#1C1C17';
                  el.style.color = primary ? '#11120D' : '#FFFBF4';
                  el.style.borderColor = primary ? '#D8CFBC' : '#565449';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = primary ? '#FFFBF4' : 'transparent';
                  el.style.color = primary ? '#11120D' : '#D8CFBC';
                  el.style.borderColor = primary ? '#FFFBF4' : '#36362F';
                }}
              >
                {label}
              </Link>
            ))}

            {/* Sign in text link */}
            <Link
              href="/login"
              className="flex items-center gap-1.5 ml-2 mt-1"
              style={{
                fontSize: 'clamp(12px, 1.3vw, 13px)',
                color: '#8D8777',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(141,135,119,0.4)',
                textUnderlineOffset: '3px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#D8CFBC';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#8D8777';
              }}
            >
              Already have an account? Sign in →
            </Link>
          </div>
        </div>

        {/* ── RIGHT: 3D Parallax Character ── */}
        <div
          className="flex-1 flex items-center justify-center order-1 md:order-2 relative"
          style={{
            minHeight: 'clamp(300px, 45vh, 560px)',
            maxWidth: '520px',
          }}
        >
          <StudentCharacter mouseX={mouse.x} mouseY={mouse.y} />
        </div>
      </main>

      {/* ── Footer strip ── */}
      <footer
        className="relative z-[2] flex items-center justify-between px-5 sm:px-8 py-4 text-[11px] text-[#8D8777]"
        style={{ borderTop: '1px solid rgba(54,54,47,0.5)' }}
      >
        <span>Student Hub — Built for students who mean it.</span>
        <span className="hidden sm:block" style={{ letterSpacing: '0.06em' }}>
          2026
        </span>
      </footer>
    </div>
  );
}
