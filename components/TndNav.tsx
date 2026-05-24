'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function TndNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'ACCUEIL', icon: '🏠' },
    { href: '/recherche', label: 'RECHERCHE', icon: '🔍' },
    { href: '/a-propos', label: 'À PROPOS', icon: '📖' },
    { href: '/tarifs', label: 'TARIFS', icon: '💰' },
    { href: '/messagerie', label: 'MESSAGES', icon: '💬' },
    { href: '/contact', label: 'CONTACT', icon: '📧' },
    { href: '/support', label: 'AIDE', icon: '❓' },
  ];

  return (
    <nav className="bg-white border-b-4 border-blue-600 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header avec titre et menu burger */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="text-xl sm:text-3xl font-bold text-blue-600">
            AUTISME CONNECT
          </div>

          {/* Menu burger pour mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg border-2 border-blue-600 text-blue-600"
            aria-label="Menu"
          >
            <span className="text-2xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Navigation links - Desktop */}
        <div className="hidden md:grid md:grid-cols-7 gap-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`p-2 rounded-lg text-center transition-all border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-800 shadow-md'
                      : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-400'
                  }`}
                >
                  <div className="text-lg mb-0.5">{item.icon}</div>
                  <div className="text-xs font-bold leading-tight">{item.label}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Navigation links - Mobile (dropdown) */}
        {menuOpen && (
          <div className="md:hidden grid grid-cols-2 gap-2 mt-4 pb-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                  <div
                    className={`p-3 rounded-xl text-center transition-all border-2 ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-800 shadow-md'
                        : 'bg-white text-blue-600 border-blue-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <div className="text-sm font-bold">{item.label}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
