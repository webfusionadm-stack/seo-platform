import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRank, RANK_EMOJIS, RANK_LABELS } from '../../hooks/useRank';
import XPBar from '../ui/XPBar';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  children?: { to: string; label: string }[];
}

const navLinks: NavItem[] = [
  { to: '/dashboard', label: 'COMMAND CENTER', icon: '⚔️' },
  { to: '/sites', label: 'MY DOMAINS', icon: '🏯' },
  {
    to: '/seo-articles', label: 'SEO FORGE', icon: '✍️',
    children: [
      { to: '/seo-articles', label: 'Articles' },
      { to: '/seo-forge/bulk', label: 'Planif. en masse' },
    ],
  },
  { to: '/sponsored-articles', label: 'LINK CRAFT', icon: '🔗' },
  { to: '/personas', label: 'PERSONA FORGE', icon: '🎭' },
  { to: '/orders', label: 'QUEST BOARD', icon: '📜' },
  { to: '/revenue', label: 'TREASURE', icon: '💰' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { data: rank } = useRank();
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const rankColor = rank?.currentRank?.color || '#cd7f32';
  const rankName = rank?.currentRank?.name || 'BRONZE';

  return (
    <aside
      className="w-72 flex flex-col min-h-screen border-r bg-hexagon relative"
      style={{
        backgroundColor: '#0d0820',
        borderColor: `${rankColor}30`,
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-3">
        <h1
          className="font-arcade text-2xl text-gold tracking-wider text-shadow-gold"
        >
          LINKFORGE
        </h1>
        <div className="text-[10px] font-arcade text-royal-light/60 tracking-[0.2em] mt-0.5">
          SEO COMMAND CENTER
        </div>
      </div>

      {/* Player Profile */}
      <div className="px-5 py-4 mx-3 mb-2 rounded-lg bg-dark-600/50 border border-dark-400">
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold animate-glow-pulse"
            style={{
              '--rank-color': rankColor,
              backgroundColor: `${rankColor}20`,
              border: `2px solid ${rankColor}`,
            } as React.CSSProperties}
          >
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-200 truncate">
              {user?.email?.split('@')[0] || 'Admin'}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm">{RANK_EMOJIS[rankName]}</span>
              <span
                className="text-xs font-arcade font-bold"
                style={{ color: rankColor }}
              >
                {RANK_LABELS[rankName] || rankName}
              </span>
            </div>
          </div>
        </div>

        {/* XP Bar */}
        {rank && (
          <div>
            <XPBar
              current={rank.totalRevenue}
              max={rank.nextRank?.min || rank.currentRank.max}
              rankColor={rankColor}
              size="sm"
            />
            {rank.nextRank && (
              <div className="text-[10px] text-gray-500 mt-1 text-center font-arcade">
                {rank.amountToNext.toLocaleString('fr-FR')}€ → {RANK_LABELS[rank.nextRank.name]}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Separator ornament */}
      <div className="flex items-center gap-2 px-5 my-2">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <span className="text-gold/30 text-xs">◆</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navLinks.map((link) => {
          const hasChildren = link.children && link.children.length > 0;
          const isGroupActive = hasChildren
            ? link.children!.some((c) => location.pathname.startsWith(c.to))
            : false;
          const isGroupOpen = isGroupActive || openGroup === link.to;

          if (hasChildren) {
            return (
              <div key={link.to}>
                <button
                  onClick={() => setOpenGroup(isGroupOpen ? null : link.to)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-arcade tracking-wider transition-all duration-200 w-full text-left ${
                    isGroupActive
                      ? 'text-gold bg-dark-500/50'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-dark-500/30'
                  }`}
                  style={isGroupActive ? { borderLeft: `3px solid ${rankColor}`, paddingLeft: '9px' } : {}}
                >
                  <span className="text-base">{link.icon}</span>
                  <span className="flex-1">{link.label}</span>
                  <span className={`text-[10px] transition-transform duration-200 ${isGroupOpen ? 'rotate-90' : ''}`}>▶</span>
                </button>
                {isGroupOpen && (
                  <div className="ml-8 mt-0.5 space-y-0.5">
                    {link.children!.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        end
                        className={({ isActive }) =>
                          `block px-3 py-1.5 rounded text-xs font-arcade tracking-wider transition-all duration-200 ${
                            isActive
                              ? 'text-gold bg-dark-500/40'
                              : 'text-gray-500 hover:text-gray-300 hover:bg-dark-500/20'
                          }`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-arcade tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'text-gold bg-dark-500/50'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-500/30'
                }`
              }
              style={({ isActive }) =>
                isActive ? { borderLeft: `3px solid ${rankColor}`, paddingLeft: '9px' } : {}
              }
            >
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1">
        <div className="h-px bg-gradient-to-r from-transparent via-dark-400 to-transparent mb-2" />
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs font-arcade tracking-wider text-gray-500 hover:text-danger transition-colors"
        >
          <span className="text-base">🚪</span>
          <span>DÉCONNEXION</span>
        </button>
      </div>
    </aside>
  );
}
