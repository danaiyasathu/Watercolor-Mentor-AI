// Generates realistic SVG data URLs for sample artworks for quick testing
export const getSampleArtworkDataUrl = (type: 'flat_wash' | 'graded_wash' | 'wet_on_wet' | 'shapes' | 'color_wheel' | 'landscape' | 'composition' | 'capstone'): string => {
  // We can return high quality SVG base64 representations
  const svgs: Record<string, string> = {
    flat_wash: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#fdfbf7"/>
      <rect x="50" y="50" width="500" height="130" rx="8" fill="#3b82f6" opacity="0.85"/>
      <text x="60" y="40" font-family="sans-serif" font-size="14" fill="#64748b">1. Flat Wash (สีเรียบสม่ำเสมอ)</text>
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:0.95" />
          <stop offset="30%" style="stop-color:#3b82f6;stop-opacity:0.8" />
          <stop offset="70%" style="stop-color:#93c5fd;stop-opacity:0.5" />
          <stop offset="100%" style="stop-color:#eff6ff;stop-opacity:0.2" />
        </linearGradient>
      </defs>
      <rect x="50" y="220" width="500" height="130" rx="8" fill="url(#grad1)"/>
      <text x="60" y="210" font-family="sans-serif" font-size="14" fill="#64748b">2. Graded Wash (ไล่น้ำหนักจากเข้มไปอ่อน)</text>
    </svg>`,
    graded_wash: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#fdfbf7"/>
      <defs>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#0284c7;stop-opacity:0.95" />
          <stop offset="50%" style="stop-color:#38bdf8;stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:#e0f2fe;stop-opacity:0.1" />
        </linearGradient>
      </defs>
      <rect x="60" y="80" width="480" height="240" rx="12" fill="url(#grad2)"/>
      <text x="60" y="60" font-family="sans-serif" font-size="16" fill="#475569">Graded Wash Study — Cobalt Blue</text>
    </svg>`,
    wet_on_wet: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#fdfbf7"/>
      <rect x="40" y="80" width="240" height="240" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
      <circle cx="160" cy="200" r="70" fill="#ef4444" opacity="0.9"/>
      <text x="60" y="60" font-family="sans-serif" font-size="14" fill="#64748b">Wet-on-Dry (ขอบคมชัด)</text>
      
      <rect x="320" y="80" width="240" height="240" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
      <defs>
        <radialGradient id="softBleed" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#ec4899;stop-opacity:0.85" />
          <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:0.6" />
          <stop offset="85%" style="stop-color:#60a5fa;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#fdfbf7;stop-opacity:0" />
        </radialGradient>
      </defs>
      <circle cx="440" cy="200" r="90" fill="url(#softBleed)"/>
      <text x="340" y="60" font-family="sans-serif" font-size="14" fill="#64748b">Wet-on-Wet (ขอบฟุ้งละมุน)</text>
    </svg>`,
    shapes: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#fdfbf7"/>
      <defs>
        <radialGradient id="sphereGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" style="stop-color:#fed7aa;stop-opacity:0.9" />
          <stop offset="60%" style="stop-color:#f97316;stop-opacity:0.85" />
          <stop offset="100%" style="stop-color:#9a3412;stop-opacity:0.95" />
        </radialGradient>
        <linearGradient id="triGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#a7f3d0" />
          <stop offset="100%" style="stop-color:#065f46" />
        </linearGradient>
      </defs>
      <circle cx="140" cy="200" r="65" fill="url(#sphereGrad)"/>
      <polygon points="300,120 240,270 360,270" fill="url(#triGrad)"/>
      <path d="M 460,130 C 490,180 520,220 500,260 C 480,290 440,290 420,260 C 400,220 430,180 460,130 Z" fill="#0ea5e9" opacity="0.8"/>
      <text x="50" y="340" font-family="sans-serif" font-size="14" fill="#64748b">3 Basic 3D Shapes (Sphere, Triangle, Organic Drop)</text>
    </svg>`,
    color_wheel: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#fdfbf7"/>
      <rect x="50" y="100" width="85" height="180" rx="8" fill="#f59e0b"/>
      <rect x="150" y="100" width="85" height="180" rx="8" fill="#10b981"/>
      <rect x="250" y="100" width="85" height="180" rx="8" fill="#8b5cf6"/>
      <rect x="350" y="100" width="85" height="180" rx="8" fill="#b45309"/>
      <rect x="450" y="100" width="85" height="180" rx="8" fill="#4d7c0f"/>
      <text x="50" y="60" font-family="sans-serif" font-size="16" fill="#334155">Color Mixing Swatches — 5 Tones from 3 Primaries</text>
    </svg>`,
    landscape: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#fdfbf7"/>
      <defs>
        <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#fdba74;stop-opacity:0.8" />
          <stop offset="40%" style="stop-color:#f472b6;stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:#60a5fa;stop-opacity:0.5" />
        </linearGradient>
      </defs>
      <rect x="40" y="40" width="520" height="320" rx="8" fill="url(#sky)"/>
      <polygon points="40,240 180,160 320,240" fill="#475569" opacity="0.6"/>
      <polygon points="220,240 380,140 560,240" fill="#334155" opacity="0.75"/>
      <rect x="40" y="240" width="520" height="120" fill="#0284c7" opacity="0.55"/>
      <path d="M 40,240 Q 300,245 560,240" stroke="#f8fafc" stroke-width="2" fill="none"/>
    </svg>`,
    composition: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#fdfbf7"/>
      <rect x="40" y="40" width="520" height="320" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
      <circle cx="380" cy="180" r="50" fill="#ef4444" opacity="0.85"/>
      <path d="M 380,230 Q 390,290 380,340" stroke="#059669" stroke-width="4" fill="none"/>
      <path d="M 380,270 Q 430,250 440,270" fill="#10b981" opacity="0.8"/>
      <text x="60" y="80" font-family="sans-serif" font-size="13" fill="#94a3b8">Negative Space (พื้นที่ว่างเพื่อความสงบ)</text>
    </svg>`,
    capstone: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#fdfbf7"/>
      <defs>
        <linearGradient id="aurora" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0f172a" />
          <stop offset="50%" style="stop-color:#1e1b4b" />
          <stop offset="100%" style="stop-color:#312e81" />
        </linearGradient>
      </defs>
      <rect x="40" y="40" width="520" height="320" rx="8" fill="url(#aurora)"/>
      <path d="M 40,160 Q 200,80 340,140 T 560,100" stroke="#34d399" stroke-width="28" opacity="0.6" fill="none"/>
      <path d="M 40,190 Q 180,120 380,160 T 560,130" stroke="#38bdf8" stroke-width="20" opacity="0.5" fill="none"/>
      <polygon points="80,360 140,260 200,360" fill="#022c22"/>
      <polygon points="170,360 240,240 310,360" fill="#022c22"/>
      <circle cx="450" cy="110" r="18" fill="#fef08a" opacity="0.9"/>
    </svg>`,
  };

  const svgContent = svgs[type] || svgs.flat_wash;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
};
