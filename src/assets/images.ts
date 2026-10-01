import rtBrandLogo from './images/rt_brand_logo_1790756127219.jpg';
import ramiClassicLogo from './images/rami_mokhtar_logo_1790702841713.jpg';
import doctorAvatar from './images/doctor_pathologist_1790701885698.jpg';
import receptionImg from './images/rt_reception_counter_1790756138585.jpg';
import teamImg from './images/rt_medical_team_1790756150828.jpg';
import badgeImg from './images/medical_lab_badge_1790701896281.jpg';

// High-fidelity SVG Fallbacks to guarantee visual perfection even if network fails
export const FALLBACK_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#881337"/>
      <stop offset="50%" stop-color="#4c0519"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="drop" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb7185"/>
      <stop offset="40%" stop-color="#e11d48"/>
      <stop offset="100%" stop-color="#9f1239"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="40" fill="url(#bg)"/>
  <rect x="6" y="6" width="188" height="188" rx="34" fill="none" stroke="#f43f5e" stroke-width="2.5" opacity="0.4"/>
  <!-- Blood Droplet -->
  <path d="M100 34 C100 34 62 82 62 118 C62 140 79 158 100 158 C121 158 138 140 138 118 C138 82 100 34 100 34 Z" fill="url(#drop)" filter="url(#glow)"/>
  <!-- White highlight reflection on drop -->
  <path d="M85 95 C85 85 92 72 98 62 C96 68 88 84 88 95 C88 102 91 106 91 106 C87 103 85 99 85 95 Z" fill="#ffffff" opacity="0.6"/>
  <!-- Pulse Line inside drop -->
  <path d="M78 122 L90 122 L96 110 L104 134 L110 122 L122 122" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Text RT LABS -->
  <text x="100" y="180" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">RT LABS</text>
</svg>
`)}`;

export const FALLBACK_DOCTOR_AVATAR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="50" fill="#0f172a"/>
  <circle cx="50" cy="38" r="18" fill="#fda4af"/>
  <path d="M22 88 C25 66 38 60 50 60 C62 60 75 66 78 88 Z" fill="#ffffff"/>
  <path d="M42 62 L50 78 L58 62" fill="none" stroke="#e11d48" stroke-width="3"/>
  <circle cx="50" cy="85" r="4" fill="#94a3b8"/>
</svg>
`)}`;

export const RT_BRAND_LOGO = rtBrandLogo;
export const RAMI_CLASSIC_LOGO = ramiClassicLogo;
export const DOCTOR_AVATAR_IMG = doctorAvatar;
export const RECEPTION_PHOTO_IMG = receptionImg;
export const MEDICAL_TEAM_IMG = teamImg;
export const LAB_BADGE_IMG = badgeImg;

/**
 * Resolves the appropriate logo URL given the user's custom profile setting.
 * Guarantees a working URL in all runtime environments (Dev, Vite Prod, GitHub Pages).
 */
export const resolveLabLogo = (customLogoUrl?: string | null): string => {
  if (customLogoUrl && customLogoUrl.trim() !== '') {
    // If it's a data url, http url, or imported asset, return it
    if (
      customLogoUrl.startsWith('data:') ||
      customLogoUrl.startsWith('http://') ||
      customLogoUrl.startsWith('https://') ||
      customLogoUrl.startsWith('blob:')
    ) {
      return customLogoUrl;
    }
    // If it points to an old broken path with "/src/assets/images", safely fallback to bundled asset
    if (customLogoUrl.includes('/src/assets/images')) {
      if (customLogoUrl.includes('rami_mokhtar_logo')) return RAMI_CLASSIC_LOGO;
      return RT_BRAND_LOGO;
    }
    return customLogoUrl;
  }
  return RT_BRAND_LOGO;
};

/**
 * Image error handler to safely switch to a backup fallback
 */
export const onImageErrorFallback = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc: string = FALLBACK_LOGO_SVG
) => {
  const target = e.currentTarget;
  if (target.src !== fallbackSrc) {
    target.src = fallbackSrc;
  }
};
