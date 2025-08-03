
"use client"

export function Logo() {
  return (
    <div className="flex items-center justify-center w-64 h-24">
      <svg viewBox="0 0 250 100" className="w-full h-full">
        {/* Background Shapes */}
        <circle cx="50" cy="50" r="48" fill="hsl(var(--primary))" fillOpacity="0.1" />
        <circle cx="50" cy="50" r="48" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" />
        <path d="M 90 20 L 110 50 L 90 80 Z" fill="hsl(var(--primary))" fillOpacity="0.2" />
        <path d="M 100 30 L 120 50 L 100 70 Z" fill="hsl(var(--primary))" fillOpacity="0.3" />

        {/* Kabaddi Player Outline */}
        <g stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Head */}
          <circle cx="50" cy="35" r="5" />
          {/* Body */}
          <path d="M 50 40 V 60" />
          {/* Arms */}
          <path d="M 35 45 L 50 50 L 65 45" />
          <path d="M 30 42 L 20 35" />
          {/* Legs */}
          <path d="M 50 60 L 40 75" />
          <path d="M 50 60 L 60 75" />
        </g>
        
        {/* Text */}
        <text x="110" y="45" fontFamily="Inter, sans-serif" fontSize="24" fontWeight="900" fill="hsl(var(--accent))">
          Kabaddi
        </text>
        <text x="112" y="70" fontFamily="Inter, sans-serif" fontSize="18" fontWeight="500" fill="hsl(var(--primary))" opacity="0.9">
          Pro Score
        </text>
      </svg>
    </div>
  );
}
