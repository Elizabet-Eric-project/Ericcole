import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Header.css';
import { texts } from '../../locales/texts';

import iconProfile from '../../assets/icons/profile.svg?url';
import iconSignals from '../../assets/icons/signals.svg?url';
import iconHistory from '../../assets/icons/history.svg?url';
import iconChatAI from '../../assets/icons/chat.svg?url';
import iconAnalysis from '../../assets/icons/analysis.svg?url';
import iconLog from '../../assets/icons/log.svg?url';
import iconFaq from '../../assets/icons/faq.svg?url';
import iconSupport from '../../assets/icons/support.svg?url';

export default function Header({
  mode,
  activePage,
  onPageChange,
  safeAreaTop = 0,
  contentAreaTop = 0,
  isDesktop = false
}) {
  const t = texts.en;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const binaryMenu = useMemo(
    () => [
      { id: 'signals', label: t.menu.signals, icon: iconSignals },
      { id: 'history', label: t.menu.history, icon: iconHistory },
      { id: 'chatAI', label: t.menu.chatAI, icon: iconChatAI },
      { id: 'faq', label: t.menu.faq, icon: iconFaq },
      { id: 'support', label: t.menu.support, icon: iconSupport }
    ],
    [t.menu]
  );

  const forexMenu = useMemo(
    () => [
      { id: 'analysis', label: t.menu.analysis, icon: iconAnalysis },
      { id: 'logAnalysis', label: t.menu.logAnalysis, icon: iconLog },
      { id: 'faq', label: t.menu.faq, icon: iconFaq },
      { id: 'chatAI', label: t.menu.chatAI, icon: iconChatAI },
      { id: 'support', label: t.menu.support, icon: iconSupport }
    ],
    [t.menu]
  );

  const dropdownMenu = mode === 'binary' ? binaryMenu : forexMenu;

  const currentDisclaimer = mode === 'binary' ? t.binaryAnalytics.disclaimer : t.forexAnalytics.disclaimer;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [activePage]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  const topShellStyle = useMemo(() => {
    if (isDesktop) return { top: '10px' };

    const safeTop = Number.isFinite(safeAreaTop) ? safeAreaTop : 0;

    const top = Math.max(6, safeTop + 6);

    return { top: `${top}px` };
  }, [isDesktop, safeAreaTop, contentAreaTop]);

  const handleProjectHome = () => {
    if (mode === 'demo') {
      onPageChange('demoHome');
      return;
    }
    onPageChange(mode === 'binary' ? 'signals' : 'analysis');
  };

  return (
    <>
      <div className="ev-top-shell" style={topShellStyle}>
        <div className="ev-top-brand-chip">
          <div className="ev-top-brand-title">Analytics Tool</div>
        </div>

        <div className="ev-top-control" ref={menuRef}>
          <button type="button" className="ev-top-control-left ev-top-control-home" onClick={handleProjectHome}>
            {t.projectName || 'Eric Cole'}
          </button>

          <div className="ev-top-control-right">
            <button
              type="button"
              className={`ev-action-btn ${activePage === 'profile' ? 'active' : ''}`}
              onClick={() => onPageChange('profile')}
              aria-label={t.menu.profile}
              title={t.menu.profile}
            >
              <span
                className="ev-action-icon"
                style={{
                  maskImage: `url("${iconProfile}")`,
                  WebkitMaskImage: `url("${iconProfile}")`
                }}
              ></span>
            </button>

            <button
              type="button"
              className={`ev-action-btn ${isMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label={t.menuBtn}
              aria-expanded={isMenuOpen}
              title={t.menuBtn}
            >
              <span className="ev-burger" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>

          {isMenuOpen && (
            <div className="ev-menu-dropdown">
              {dropdownMenu.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`ev-menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onPageChange(item.id);
                      setIsMenuOpen(false);
                    }}
                  >
                    <span
                      className="ev-menu-icon"
                      style={{
                        maskImage: `url("${item.icon}")`,
                        WebkitMaskImage: `url("${item.icon}")`
                      }}
                    ></span>
                    <span className="ev-menu-text">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={`ev-bottom-shell ${isDesktop ? 'desktop' : 'mobile'}`}>
        <div className="micro-disclaimer">
          {mode === 'demo' && (
            <div className="demo-watermark-global">
              {t.demoSettings?.watermark || 'DEMONSTRATION MODE'}
            </div>
          )}
          <p className="micro-disclaimer-text">{currentDisclaimer}</p>
        </div>
      </div>
    </>
  );
}

