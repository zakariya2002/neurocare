import Link from 'next/link';

interface LogoProProps {
  href?: string;
  className?: string;
  iconSize?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function LogoPro({ href = '/pro', className = '', iconSize = 'md', showText = true }: LogoProProps) {
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const badgeSizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1'
  };

  const iconScale = {
    sm: 'scale-90',
    md: 'scale-100',
    lg: 'scale-110'
  };

  return (
    <Link href={href} className={`flex items-center group ${className}`}>
      {/* Logo NeuroCare Pro - icône avec onde neurologique en couleurs teal */}
      <div className={`${sizeClasses[iconSize]} relative flex items-center justify-center ${showText ? 'mr-2.5' : ''}`}>
        <svg
          viewBox="0 0 40 40"
          className={`w-full h-full ${iconScale[iconSize]}`}
          fill="none"
        >
          <defs>
            <linearGradient id="logoProGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          {/* Cercle externe */}
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="url(#logoProGradient)"
            strokeWidth="3.5"
            fill="none"
          />
          {/* Onde neurologique avec pics arrondis */}
          <path
            d="M9 20 L12 20 Q14 20 15 12 Q16 8 17 12 L20 20 L23 28 Q24 32 25 28 Q26 20 28 20 L31 20"
            stroke="url(#logoProGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      {showText && (
        <div className="flex items-center gap-2">
          <span className={`${textSizeClasses[iconSize]} font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent group-hover:from-emerald-600 group-hover:via-teal-600 group-hover:to-cyan-600 transition-all tracking-tight`}>
            NeuroCare
          </span>
          <span className={`${badgeSizeClasses[iconSize]} bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold rounded-full`}>
            PRO
          </span>
        </div>
      )}
    </Link>
  );
}
