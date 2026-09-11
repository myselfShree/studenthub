'use client';

import React from 'react';

interface StudentCharacterProps {
  mouseX: number; // -1 to 1
  mouseY: number; // -1 to 1
}

/**
 * StudentCharacter — A fully CSS/SVG illustrated student character with
 * multi-layer parallax depth. Each anatomical layer moves at a different
 * rate relative to mouse position, creating an illusion of 3D depth.
 *
 * Layers (back → front, increasing depth sensitivity):
 *   1. Background halo / ambient light
 *   2. Shadow + desk surface
 *   3. Body / jacket
 *   4. Head (main rotation + tilt)
 *   5. Face features (eyes track mouse most aggressively)
 *   6. Accessories (glasses, backpack straps)
 *   7. Floating UI elements (notes, icons)
 */
export default function StudentCharacter({ mouseX, mouseY }: StudentCharacterProps) {
  // Depth multipliers for each parallax layer
  const D = {
    ambient: 6,
    body: 10,
    head: 16,
    face: 22,
    eyes: 28,
    accessories: 14,
    floatA: -20,
    floatB: -14,
    floatC: -28,
  };

  const tx = (d: number) => `translateX(${mouseX * d}px)`;
  const ty = (d: number) => `translateY(${mouseY * d}px)`;
  const t = (d: number) => `translate(${mouseX * d}px, ${mouseY * d}px)`;

  // Eye position within socket (eyes track mouse the most)
  const eyeOffX = mouseX * 4;
  const eyeOffY = mouseY * 3;

  // Head tilt & rotation
  const headRotate = mouseX * 6;
  const headTiltY = mouseY * 4;

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none">
      
      {/* ── Ambient glow behind character ── */}
      <div
        className="absolute rounded-full"
        style={{
          width: 340,
          height: 340,
          background:
            'radial-gradient(circle, rgba(142,155,122,0.12) 0%, rgba(86,84,73,0.08) 40%, transparent 70%)',
          filter: 'blur(20px)',
          transform: t(D.ambient),
          transition: 'transform 0.05s linear',
        }}
      />

      {/* ── Main SVG character ── */}
      <svg
        viewBox="0 0 320 440"
        width="320"
        height="440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 2 }}
      >
        <defs>
          <radialGradient id="skinGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#F5DEB3" />
            <stop offset="100%" stopColor="#DEB887" />
          </radialGradient>
          <radialGradient id="jacketGrad" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#2A2A22" />
            <stop offset="100%" stopColor="#1A1A14" />
          </radialGradient>
          <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8E9B7A" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8E9B7A" stopOpacity="0" />
          </radialGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.5" />
          </filter>
          <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <clipPath id="headClip">
            <ellipse cx="160" cy="130" rx="70" ry="78" />
          </clipPath>
        </defs>

        {/* ── LAYER 1: Ground shadow ── */}
        <ellipse
          cx="160"
          cy="430"
          rx="80"
          ry="10"
          fill="rgba(0,0,0,0.4)"
          style={{ transform: t(D.body), transition: 'transform 0.05s linear' }}
        />

        {/* ── LAYER 2: Body / Jacket ── */}
        <g
          style={{
            transform: `translate(${mouseX * D.body}px, ${mouseY * D.body}px)`,
            transition: 'transform 0.05s linear',
            filter: 'url(#softShadow)',
          }}
        >
          {/* Shoulders */}
          <ellipse cx="160" cy="310" rx="92" ry="36" fill="#23231C" />
          {/* Jacket body */}
          <rect x="68" y="295" width="184" height="120" rx="12" fill="url(#jacketGrad)" />
          {/* Jacket lapels */}
          <path d="M160 300 L130 340 L160 355 L190 340 Z" fill="#1A1A14" />
          <line x1="160" y1="300" x2="160" y2="415" stroke="#2D2D25" strokeWidth="1" />
          {/* Shirt collar */}
          <path d="M145 298 L160 320 L175 298" fill="#FFFBF4" stroke="#E8E0D0" strokeWidth="0.5" />
          {/* Jacket pocket */}
          <rect x="85" y="330" width="28" height="20" rx="3" fill="none" stroke="#36362F" strokeWidth="1.5" />
          {/* Pocket detail — small sage square */}
          <rect x="89" y="335" width="20" height="3" rx="1.5" fill="#8E9B7A" opacity="0.6" />
          {/* Arms */}
          <rect x="58" y="295" width="38" height="110" rx="18" fill="#23231C" />
          <rect x="224" y="295" width="38" height="110" rx="18" fill="#23231C" />
          {/* Cuffs */}
          <rect x="58" y="385" width="38" height="20" rx="10" fill="#2D2D25" />
          <rect x="224" y="385" width="38" height="20" rx="10" fill="#2D2D25" />
          {/* Hands */}
          <ellipse cx="77" cy="413" rx="18" ry="14" fill="url(#skinGrad)" />
          <ellipse cx="243" cy="413" rx="18" ry="14" fill="url(#skinGrad)" />
        </g>

        {/* ── LAYER 3: Neck ── */}
        <rect
          x="147"
          y="195"
          width="26"
          height="30"
          rx="8"
          fill="url(#skinGrad)"
          style={{
            transform: `translate(${mouseX * D.head}px, ${mouseY * D.head}px)`,
            transition: 'transform 0.05s linear',
          }}
        />

        {/* ── LAYER 4: Head (rotates toward mouse) ── */}
        <g
          style={{
            transform: `translate(${mouseX * D.head}px, ${mouseY * D.head}px) rotate(${headRotate}deg)`,
            transformOrigin: '160px 160px',
            transition: 'transform 0.05s linear',
          }}
        >
          {/* Head shape */}
          <ellipse cx="160" cy="142" rx="70" ry="78" fill="url(#skinGrad)" />
          {/* Ear left */}
          <ellipse cx="92" cy="145" rx="10" ry="14" fill="url(#skinGrad)" />
          <ellipse cx="92" cy="145" rx="5" ry="8" fill="#C8A882" opacity="0.5" />
          {/* Ear right */}
          <ellipse cx="228" cy="145" rx="10" ry="14" fill="url(#skinGrad)" />
          <ellipse cx="228" cy="145" rx="5" ry="8" fill="#C8A882" opacity="0.5" />

          {/* Hair — editorial cut, swept */}
          <ellipse cx="160" cy="80" rx="72" ry="40" fill="#1A1210" />
          <ellipse cx="160" cy="72" rx="68" ry="32" fill="#201816" />
          {/* Hair front */}
          <path
            d="M110 100 Q130 68 160 72 Q190 68 210 100 Q190 95 160 92 Q130 95 110 100Z"
            fill="#1A1210"
          />
          {/* Hair side sweep */}
          <path d="M90 110 Q88 90 102 78 Q95 100 94 118Z" fill="#1A1210" />
          <path d="M230 110 Q232 90 218 78 Q225 100 226 118Z" fill="#1A1210" />
        </g>

        {/* ── LAYER 5: Face features (track mouse more) ── */}
        <g
          style={{
            transform: `translate(${mouseX * D.face}px, ${mouseY * D.face}px)`,
            transition: 'transform 0.05s linear',
          }}
        >
          {/* Eyebrows */}
          <path
            d="M125 118 Q137 112 148 116"
            stroke="#3D2B1A"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ transform: `translateY(${mouseY * -2}px)` }}
          />
          <path
            d="M172 116 Q183 112 195 118"
            stroke="#3D2B1A"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ transform: `translateY(${mouseY * -2}px)` }}
          />

          {/* Eye sockets */}
          <ellipse cx="138" cy="138" rx="16" ry="14" fill="white" />
          <ellipse cx="182" cy="138" rx="16" ry="14" fill="white" />

          {/* Pupils — these track the mouse most */}
          <circle
            cx={138 + eyeOffX}
            cy={138 + eyeOffY}
            r="8"
            fill="#2A1A0A"
            style={{ transition: 'cx 0.04s linear, cy 0.04s linear' }}
          />
          <circle
            cx={182 + eyeOffX}
            cy={138 + eyeOffY}
            r="8"
            fill="#2A1A0A"
            style={{ transition: 'cx 0.04s linear, cy 0.04s linear' }}
          />
          {/* Eye shine */}
          <circle cx={140 + eyeOffX} cy={135 + eyeOffY} r="2.5" fill="white" />
          <circle cx={184 + eyeOffX} cy={135 + eyeOffY} r="2.5" fill="white" />

          {/* Lower eyelid line */}
          <path d="M123 146 Q138 150 153 146" stroke="#C8A882" strokeWidth="1" fill="none" opacity="0.6" />
          <path d="M167 146 Q182 150 197 146" stroke="#C8A882" strokeWidth="1" fill="none" opacity="0.6" />

          {/* Nose */}
          <path d="M156 152 Q152 168 157 172 Q160 174 163 172 Q168 168 164 152" stroke="#C8A882" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Mouth — slight smile */}
          <path
            d="M144 186 Q160 196 176 186"
            stroke="#A0785A"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Subtle blush */}
          <ellipse cx="118" cy="168" rx="14" ry="8" fill="#FF9E7A" opacity="0.13" />
          <ellipse cx="202" cy="168" rx="14" ry="8" fill="#FF9E7A" opacity="0.13" />
        </g>

        {/* ── LAYER 6: Glasses (accessories) ── */}
        <g
          style={{
            transform: `translate(${mouseX * D.accessories}px, ${mouseY * D.accessories}px)`,
            transition: 'transform 0.05s linear',
          }}
        >
          {/* Left frame */}
          <rect x="116" y="126" width="44" height="28" rx="8" fill="none" stroke="#36362F" strokeWidth="2.5" />
          {/* Right frame */}
          <rect x="160" y="126" width="44" height="28" rx="8" fill="none" stroke="#36362F" strokeWidth="2.5" />
          {/* Bridge */}
          <line x1="160" y1="140" x2="160" y2="140" stroke="#36362F" strokeWidth="2.5" />
          {/* Arms */}
          <line x1="116" y1="140" x2="92" y2="140" stroke="#36362F" strokeWidth="2" strokeLinecap="round" />
          <line x1="204" y1="140" x2="228" y2="140" stroke="#36362F" strokeWidth="2" strokeLinecap="round" />
          {/* Lens tint */}
          <rect x="117" y="127" width="42" height="26" rx="7" fill="#8E9B7A" opacity="0.08" />
          <rect x="161" y="127" width="42" height="26" rx="7" fill="#8E9B7A" opacity="0.08" />
        </g>

        {/* ── Backpack strap (right) ── */}
        <path
          d="M220 290 Q235 260 225 220 Q218 200 215 290"
          stroke="#36362F"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          style={{
            transform: `translate(${mouseX * D.accessories}px, ${mouseY * D.accessories}px)`,
            transition: 'transform 0.05s linear',
          }}
        />
      </svg>

      {/* ── FLOATING ELEMENTS (move opposite to mouse = far distance) ── */}

      {/* Floating note card — top left */}
      <div
        className="absolute rounded-xl border border-[#36362F] bg-[#1C1C17] p-3"
        style={{
          top: '8%',
          left: '2%',
          width: 100,
          transform: t(D.floatA),
          transition: 'transform 0.08s linear',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div className="text-[9px] text-[#8D8777] uppercase tracking-wider mb-1.5 font-medium">Note</div>
        <div className="space-y-1.5">
          <div className="h-1.5 rounded-full bg-[#36362F] w-full" />
          <div className="h-1.5 rounded-full bg-[#36362F] w-4/5" />
          <div className="h-1.5 rounded-full bg-[#8E9B7A]/40 w-3/5" />
        </div>
      </div>

      {/* Floating streak badge — top right */}
      <div
        className="absolute rounded-full border border-[#565449] bg-[#24241E] px-3 py-1.5 flex items-center gap-2"
        style={{
          top: '12%',
          right: '0%',
          transform: t(D.floatB),
          transition: 'transform 0.08s linear',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        <span style={{ fontSize: 14 }}>🔥</span>
        <span className="text-[11px] text-[#D8CFBC] font-medium whitespace-nowrap">14-day streak</span>
      </div>

      {/* Floating task pill — bottom left */}
      <div
        className="absolute rounded-lg border border-[#36362F] bg-[#1C1C17] p-2.5"
        style={{
          bottom: '14%',
          left: '0%',
          width: 116,
          transform: t(D.floatC),
          transition: 'transform 0.08s linear',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div className="text-[9px] text-[#8D8777] uppercase tracking-wider mb-2 font-medium">Today</div>
        {['Calculus notes', 'Physics brief', 'Lab report'].map((task, i) => (
          <div key={task} className="flex items-center gap-1.5 mb-1">
            <div
              className="w-2.5 h-2.5 rounded-sm border flex-shrink-0"
              style={{
                borderColor: i === 0 ? '#8E9B7A' : '#36362F',
                background: i === 0 ? '#282F24' : 'transparent',
              }}
            >
              {i === 0 && (
                <svg viewBox="0 0 10 10" width="10" height="10">
                  <path d="M2 5l2.5 2.5L8 3" stroke="#8E9B7A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <span
              className="text-[9px] truncate"
              style={{ color: i === 0 ? '#8D8777' : '#D8CFBC', textDecoration: i === 0 ? 'line-through' : 'none' }}
            >
              {task}
            </span>
          </div>
        ))}
      </div>

      {/* Floating QR hint — bottom right */}
      <div
        className="absolute rounded-xl border border-[#36362F] bg-[#24241E] p-2.5 flex items-center gap-2"
        style={{
          bottom: '8%',
          right: '2%',
          transform: t(D.floatA),
          transition: 'transform 0.08s linear',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Mini QR pattern */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="2" y="2" width="10" height="10" rx="2" fill="#36362F" />
          <rect x="4" y="4" width="6" height="6" rx="1" fill="#8E9B7A" opacity="0.7" />
          <rect x="16" y="2" width="10" height="10" rx="2" fill="#36362F" />
          <rect x="18" y="4" width="6" height="6" rx="1" fill="#8E9B7A" opacity="0.7" />
          <rect x="2" y="16" width="10" height="10" rx="2" fill="#36362F" />
          <rect x="4" y="18" width="6" height="6" rx="1" fill="#8E9B7A" opacity="0.7" />
          <rect x="16" y="16" width="4" height="4" rx="1" fill="#565449" />
          <rect x="22" y="16" width="4" height="4" rx="1" fill="#565449" />
          <rect x="16" y="22" width="4" height="4" rx="1" fill="#565449" />
        </svg>
        <span className="text-[10px] text-[#D8CFBC] whitespace-nowrap">Share files</span>
      </div>
    </div>
  );
}
