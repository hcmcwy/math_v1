import React from 'react';
import { AvatarId, ShopItemArtId } from '../data/gameContent';

export const StudentAvatar: React.FC<{
  avatarId: AvatarId;
  size?: number;
  className?: string;
}> = ({ avatarId, size = 44, className = '' }) => {
  const renderFace = () => {
    switch (avatarId) {
      case 'cat':
        return (
          <>
            <rect width="64" height="64" rx="16" fill="#FEF3C7" />
            <path d="M16 26 L18 12 L29 20 Z" fill="#F59E0B" />
            <path d="M48 26 L46 12 L35 20 Z" fill="#F59E0B" />
            <circle cx="32" cy="36" r="18" fill="#F59E0B" />
            <ellipse cx="32" cy="42" rx="9" ry="7" fill="#FFFBEB" />
            <circle cx="25" cy="33" r="2.6" fill="#1F2937" />
            <circle cx="39" cy="33" r="2.6" fill="#1F2937" />
            <polygon points="32,37 29,40 35,40" fill="#EA580C" />
            <path d="M29 43 Q32 46 35 43" fill="none" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" />
          </>
        );
      case 'panda':
        return (
          <>
            <rect width="64" height="64" rx="16" fill="#E2E8F0" />
            <circle cx="18" cy="20" r="7" fill="#1E293B" />
            <circle cx="46" cy="20" r="7" fill="#1E293B" />
            <circle cx="32" cy="36" r="18" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
            <ellipse cx="24" cy="34" rx="5.5" ry="6.5" transform="rotate(-15 24 34)" fill="#1E293B" />
            <ellipse cx="40" cy="34" rx="5.5" ry="6.5" transform="rotate(15 40 34)" fill="#1E293B" />
            <circle cx="24.5" cy="33" r="2" fill="#FFFFFF" />
            <circle cx="39.5" cy="33" r="2" fill="#FFFFFF" />
            <ellipse cx="32" cy="40" rx="3.2" ry="2.2" fill="#1E293B" />
            <path d="M28 45 Q32 48 36 45" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
          </>
        );
      case 'fox':
        return (
          <>
            <rect width="64" height="64" rx="16" fill="#FFEDD5" />
            <path d="M15 28 L15 11 L30 22 Z" fill="#EA580C" />
            <path d="M49 28 L49 11 L34 22 Z" fill="#EA580C" />
            <path d="M14 34 C14 23 22 19 32 19 C42 19 50 23 50 34 C50 46 38 52 32 52 C26 52 14 46 14 34 Z" fill="#F97316" />
            <path d="M16 38 Q32 42 48 38 Q42 52 32 52 Q22 52 16 38 Z" fill="#FFF7ED" />
            <circle cx="25" cy="34" r="2.5" fill="#1F2937" />
            <circle cx="39" cy="34" r="2.5" fill="#1F2937" />
            <circle cx="32" cy="43" r="3" fill="#1F2937" />
          </>
        );
      case 'bear':
        return (
          <>
            <rect width="64" height="64" rx="16" fill="#FEF3C7" />
            <circle cx="18" cy="21" r="7" fill="#92400E" />
            <circle cx="46" cy="21" r="7" fill="#92400E" />
            <circle cx="18" cy="21" r="3.5" fill="#D97706" />
            <circle cx="46" cy="21" r="3.5" fill="#D97706" />
            <circle cx="32" cy="36" r="18" fill="#B45309" />
            <ellipse cx="32" cy="42" rx="9" ry="7.5" fill="#FDE68A" />
            <circle cx="25" cy="33" r="2.5" fill="#1F2937" />
            <circle cx="39" cy="33" r="2.5" fill="#1F2937" />
            <ellipse cx="32" cy="39" rx="3.5" ry="2.5" fill="#451A03" />
            <path d="M29 44 Q32 47 35 44" fill="none" stroke="#451A03" strokeWidth="1.8" strokeLinecap="round" />
          </>
        );
      case 'rabbit':
        return (
          <>
            <rect width="64" height="64" rx="16" fill="#FCE7F3" />
            <ellipse cx="24" cy="18" rx="5" ry="12" fill="#FFFFFF" stroke="#F9A8D4" strokeWidth="1.5" />
            <ellipse cx="40" cy="18" rx="5" ry="12" fill="#FFFFFF" stroke="#F9A8D4" strokeWidth="1.5" />
            <ellipse cx="24" cy="18" rx="2.3" ry="8" fill="#FBCFE8" />
            <ellipse cx="40" cy="18" rx="2.3" ry="8" fill="#FBCFE8" />
            <circle cx="32" cy="39" r="16" fill="#FFFFFF" stroke="#F9A8D4" strokeWidth="1.5" />
            <circle cx="26" cy="37" r="2.4" fill="#1F2937" />
            <circle cx="38" cy="37" r="2.4" fill="#1F2937" />
            <circle cx="21" cy="42" r="3" fill="#FBCFE8" />
            <circle cx="43" cy="42" r="3" fill="#FBCFE8" />
            <polygon points="32,40 30,43 34,43" fill="#EC4899" />
          </>
        );
      case 'owl':
        return (
          <>
            <rect width="64" height="64" rx="16" fill="#E0E7FF" />
            <circle cx="32" cy="35" r="19" fill="#4F46E5" />
            <circle cx="24" cy="33" r="7.5" fill="#EEF2FF" />
            <circle cx="40" cy="33" r="7.5" fill="#EEF2FF" />
            <circle cx="24" cy="33" r="3.3" fill="#1E1B4B" />
            <circle cx="40" cy="33" r="3.3" fill="#1E1B4B" />
            <polygon points="32,36 28,43 36,43" fill="#F59E0B" />
          </>
        );
      case 'shiba':
        return (
          <>
            <rect width="64" height="64" rx="16" fill="#FEF9C3" />
            <path d="M16 27 L17 13 L28 21 Z" fill="#D97706" />
            <path d="M48 27 L47 13 L36 21 Z" fill="#D97706" />
            <circle cx="32" cy="37" r="18" fill="#EAB308" />
            <path d="M18 39 C18 31 27 33 32 37 C37 33 46 31 46 39 C46 49 39 54 32 54 C25 54 18 49 18 39 Z" fill="#FFFBEB" />
            <circle cx="25" cy="34" r="2.5" fill="#1F2937" />
            <circle cx="39" cy="34" r="2.5" fill="#1F2937" />
            <ellipse cx="32" cy="41" rx="3.4" ry="2.4" fill="#1F2937" />
            <path d="M29 46 Q32 49 35 46" fill="none" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" />
          </>
        );
      case 'duck':
      default:
        return (
          <>
            <rect width="64" height="64" rx="16" fill="#DCFCE7" />
            <circle cx="32" cy="36" r="18" fill="#FACC15" />
            <circle cx="25" cy="32" r="2.6" fill="#1F2937" />
            <circle cx="39" cy="32" r="2.6" fill="#1F2937" />
            <ellipse cx="32" cy="41" rx="8.5" ry="4.8" fill="#F97316" />
            <path d="M26 41 Q32 44 38 41" fill="none" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`shrink-0 rounded-xl shadow-sm ${className}`}
      aria-hidden="true"
    >
      {renderFace()}
    </svg>
  );
};

export const ShopItemArt: React.FC<{
  artId: ShopItemArtId;
  className?: string;
}> = ({ artId, className = 'w-24 h-24' }) => {
  const renderArt = () => {
    switch (artId) {
      case 'pineapple_bun':
        return (
          <>
            <ellipse cx="50" cy="68" rx="36" ry="12" fill="#D97706" />
            <path d="M14 64 C14 34 30 22 50 22 C70 22 86 34 86 64 Z" fill="#F59E0B" />
            <path d="M18 58 C20 34 33 25 50 25 C67 25 80 34 82 58 Z" fill="#FBBF24" />
            {/* Signature pineapple crust criss-cross */}
            <path d="M26 36 L66 56 M38 28 L76 48 M22 48 L50 60 M74 36 L34 56 M62 28 L24 48" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
            {/* Thick butter slab */}
            <rect x="26" y="61" width="48" height="8" rx="3" fill="#FEF08A" stroke="#EAB308" strokeWidth="1.5" />
          </>
        );
      case 'lemon_tea':
        return (
          <>
            <path d="M28 24 L34 84 L66 84 L72 24 Z" fill="#FEF3C7" stroke="#CBD5E1" strokeWidth="3" />
            <path d="M30 34 L35 80 L65 80 L70 34 Z" fill="#B45309" />
            <circle cx="48" cy="48" r="12" fill="#FACC15" stroke="#FEF08A" strokeWidth="2.5" />
            <path d="M48 36 L48 60 M36 48 L60 48" stroke="#FEF08A" strokeWidth="1.5" />
            <rect x="52" y="58" width="10" height="10" rx="2" fill="#FFFFFF" opacity="0.65" transform="rotate(14 57 63)" />
            <rect x="37" y="62" width="9" height="9" rx="2" fill="#FFFFFF" opacity="0.55" transform="rotate(-12 41 66)" />
            <path d="M58 10 L52 44" stroke="#E11D48" strokeWidth="4" strokeLinecap="round" />
          </>
        );
      case 'fishballs':
        return (
          <>
            <line x1="22" y1="82" x2="78" y2="18" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
            <circle cx="38" cy="64" r="11" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
            <circle cx="51" cy="49" r="11" fill="#FBBF24" stroke="#B45309" strokeWidth="2" />
            <circle cx="64" cy="34" r="11" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
            <circle cx="35" cy="61" r="3" fill="#FEF3C7" opacity="0.7" />
            <circle cx="48" cy="46" r="3" fill="#FEF3C7" opacity="0.7" />
            <circle cx="61" cy="31" r="3" fill="#FEF3C7" opacity="0.7" />
          </>
        );
      case 'eraser':
        return (
          <>
            <g transform="rotate(-18 50 50)">
              <rect x="18" y="32" width="64" height="36" rx="6" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2.5" />
              <rect x="34" y="32" width="48" height="36" rx="4" fill="#0F766E" />
              <rect x="34" y="45" width="48" height="10" fill="#F59E0B" />
              <text x="58" y="53" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800">HK</text>
            </g>
          </>
        );
      case 'pencil_case':
        return (
          <>
            <rect x="14" y="34" width="72" height="38" rx="14" fill="#2563EB" stroke="#1D4ED8" strokeWidth="2.5" />
            <line x1="20" y1="44" x2="80" y2="44" stroke="#93C5FD" strokeWidth="3" strokeDasharray="4 3" />
            <circle cx="76" cy="44" r="5" fill="#F59E0B" />
            <rect x="26" y="54" width="48" height="8" rx="4" fill="#1E40AF" />
          </>
        );
      case 'storybook':
        return (
          <>
            <rect x="20" y="16" width="58" height="68" rx="6" fill="#E11D48" stroke="#9F1239" strokeWidth="2.5" />
            <rect x="20" y="16" width="12" height="68" rx="4" fill="#9F1239" />
            <rect x="38" y="26" width="32" height="24" rx="4" fill="#FFF1F2" />
            <circle cx="54" cy="38" r="7" fill="#F59E0B" />
            <line x1="40" y1="60" x2="68" y2="60" stroke="#FFE4E6" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="44" y1="70" x2="64" y2="70" stroke="#FFE4E6" strokeWidth="3" strokeLinecap="round" />
          </>
        );
      case 'notebook':
        return (
          <>
            <rect x="24" y="16" width="56" height="68" rx="6" fill="#059669" stroke="#065F46" strokeWidth="2.5" />
            {[26, 38, 50, 62, 74].map((y) => (
              <rect key={y} x="18" y={y - 2} width="12" height="5" rx="2.5" fill="#334155" />
            ))}
            <rect x="38" y="28" width="30" height="18" rx="3" fill="#ECFDF5" />
            <line x1="42" y1="35" x2="64" y2="35" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="42" y1="41" x2="58" y2="41" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
      case 'milk_tea':
        return (
          <>
            <path d="M24 32 L30 74 C31 80 38 84 50 84 C62 84 69 80 70 74 L76 32 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="3" />
            <path d="M74 40 C86 40 86 64 71 64" fill="none" stroke="#CBD5E1" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="50" cy="33" rx="25" ry="7" fill="#C27834" />
            <path d="M36 52 H64" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" />
            <path d="M40 60 H60" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" />
          </>
        );
      case 'backpack':
        return (
          <>
            <path d="M38 22 C38 14 62 14 62 22" fill="none" stroke="#0F766E" strokeWidth="5" strokeLinecap="round" />
            <rect x="22" y="24" width="56" height="60" rx="18" fill="#0D9488" stroke="#115E59" strokeWidth="2.5" />
            <rect x="30" y="50" width="40" height="24" rx="8" fill="#CCFBF1" stroke="#115E59" strokeWidth="2" />
            <line x1="34" y1="58" x2="66" y2="58" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="38" r="5" fill="#F59E0B" />
          </>
        );
      case 'blocks':
        return (
          <>
            <rect x="18" y="48" width="32" height="32" rx="4" fill="#EF4444" stroke="#B91C1C" strokeWidth="2" />
            <rect x="50" y="48" width="32" height="32" rx="4" fill="#2563EB" stroke="#1D4ED8" strokeWidth="2" />
            <rect x="34" y="18" width="32" height="32" rx="4" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
            <rect x="24" y="42" width="8" height="6" rx="2" fill="#DC2626" />
            <rect x="56" y="42" width="8" height="6" rx="2" fill="#1D4ED8" />
            <rect x="42" y="12" width="16" height="6" rx="2" fill="#D97706" />
          </>
        );
      case 'soccer_ball':
        return (
          <>
            <circle cx="50" cy="50" r="34" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" />
            <polygon points="50,35 62,44 57,58 43,58 38,44" fill="#1E293B" />
            <path d="M50 35 L50 18 M62 44 L78 38 M57 58 L69 74 M43 58 L31 74 M38 44 L22 38" stroke="#1E293B" strokeWidth="2.5" />
          </>
        );
      case 'umbrella':
      default:
        return (
          <>
            <path d="M50 22 L50 76 C50 84 40 84 40 76" fill="none" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
            <path d="M16 54 C16 28 32 20 50 20 C68 20 84 28 84 54 Q72 48 62 54 Q50 48 38 54 Q26 48 16 54 Z" fill="#0EA5E9" stroke="#0369A1" strokeWidth="2.5" />
            <path d="M36 53 C38 30 44 21 50 20 C56 21 62 30 64 53 Q50 48 36 53 Z" fill="#F59E0B" />
          </>
        );
    }
  };

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {renderArt()}
    </svg>
  );
};
