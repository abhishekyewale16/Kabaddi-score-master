
"use client"

export function Logo() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dots" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.5" fill="rgba(255,255,255,0.5)" />
        </pattern>
      </defs>

      <circle cx="100" cy="80" r="80" fill="#f0f0f0" />
      
      <g transform="translate(0, 10)">
        <path d="M 100,20 L 160,120 L 40,120 Z" fill="#8B0000" />
        <path d="M 100,20 L 160,120 L 40,120 Z" fill="url(#dots)" />

        <path
          fill="#4a4a4a"
          d="M100 35 a 10 10 0 1 0 0.1 0 Z
             M107 48 l -14 0 l 0 20 l -5 0 l 0 18 l 5 0 l 0 5 l 5 -5 l 0 -15 l 10 0 l -10 -23 Z
             M93 48 l -5 -5 l -10 10 l -5 15 l 5 5 Z
             M103 80 l 0 15 l 5 5 l 10 -10 l 0 -10 Z
             M92 90 l 5 10 l 0 8 l -5 0 Z
             M108 90 l 0 10 l 5 8 l 5 -2 l 0 -16 Z"
        />
        
        <path
            stroke="#4a4a4a"
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            d="M 100 45
               A 12 12 0 1 1 100 30
               A 12 12 0 1 1 100 45
               L 100 65
               L 90 65
               L 90 90
               L 85 105
               L 95 105
               M 100 65
               L 110 65
               L 110 80
               L 120 95
               L 120 80
               M 90 65
               L 80 75
               L 80 85
               L 90 90"
        />
        
        <g transform="translate(10,0)">
            <path
            d="M 90 45 
                L 85 40
                L 85 55
                L 80 60"
            stroke="#4a4a4a"
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            />
            <path
            d="M 90 45
                L 93 42"
            stroke="#4a4a4a"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            />
        </g>
      </g>
      
      <text x="100" y="170" fontFamily="Inter, sans-serif" fontSize="28" fontWeight="bold" textAnchor="middle" fill="#4a4a4a">Kabaddi</text>
      <text x="100" y="195" fontFamily="Inter, sans-serif" fontSize="24" fontWeight="normal" textAnchor="middle" fill="#6a6a6a">Pro Score</text>
    </svg>
  )
}
