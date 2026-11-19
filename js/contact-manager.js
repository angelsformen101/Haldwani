/**
 * CityHaldwani - Universal Contact Variable & Click Tracking Manager
 * Manages dynamic Call/WhatsApp numbers per page, floating action buttons, and duration click tracking.
 */
(function () {
    'use strict';

    window.__pageLoadStart = Date.now();

    const STORAGE_KEY_CONFIG = 'hald_contacts_config';
    const STORAGE_KEY_CLICKS = 'hald_clicks_data';
    const SITE_NAME = 'CityHaldwani';

    // Normalize current page route
    function getNormalizedRoute() {
        let path = window.location.pathname || '';
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        let clean = path.split('/').filter(Boolean).join('/');
        if (!clean || clean === 'index.html') return 'index.html';
        return clean;
    }

    // Load active config (LocalStorage override > Script global > Hardcoded default)
    function getActiveConfig() {
        let config = null;
        try {
            const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
            if (stored) {
                config = JSON.parse(stored);
            }
        } catch (e) {}

        if (!config && window.SITE_CONTACTS_CONFIG) {
            config = window.SITE_CONTACTS_CONFIG;
        }

        if (!config) {
            config = {
                master: { call: '+910000000000', whatsapp: '910000000000' },
                pages: {}
            };
        }
        return config;
    }

    // Resolve numbers for current page
    function getPageNumbers() {
        const config = getActiveConfig();
        const route = getNormalizedRoute();
        const master = config.master || { call: '+910000000000', whatsapp: '910000000000' };

        let pageCustom = null;
        if (config.pages) {
            pageCustom = config.pages[route] || config.pages['/' + route] || (route === 'index.html' ? config.pages['/'] : null);
        }

        const callNum = (pageCustom && pageCustom.call && pageCustom.call.trim()) ? pageCustom.call.trim() : master.call;
        const waNum = (pageCustom && pageCustom.whatsapp && pageCustom.whatsapp.trim()) ? pageCustom.whatsapp.trim() : master.whatsapp;

        return {
            call: callNum,
            whatsapp: waNum,
            cleanCall: callNum.replace(/[^\d+]/g, ''),
            cleanWA: waNum.replace(/\D/g, '')
        };
    }

    // Format duration in human readable format
    function formatDuration(sec) {
        if (sec < 60) return sec + 's';
        const mins = Math.floor(sec / 60);
        const rem = sec % 60;
        return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
    }

    // Record click event
    function recordClick(actionType, targetLabel) {
        const durationSec = Math.max(1, Math.round((Date.now() - window.__pageLoadStart) / 1000));
        const clickEvent = {
            id: 'clk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            site: SITE_NAME,
            type: actionType, // 'call' or 'whatsapp'
            page: getNormalizedRoute(),
            label: targetLabel || (actionType === 'call' ? 'Call Button' : 'WhatsApp Button'),
            durationSeconds: durationSec,
            durationFormatted: formatDuration(durationSec),
            timestamp: new Date().toISOString(),
            localTime: new Date().toLocaleString(),
            device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
        };

        // 1. Save to LocalStorage
        try {
            let clicks = [];
            const existing = localStorage.getItem(STORAGE_KEY_CLICKS);
            if (existing) {
                clicks = JSON.parse(existing);
            }
            clicks.unshift(clickEvent);
            if (clicks.length > 2000) clicks = clicks.slice(0, 2000);
            localStorage.setItem(STORAGE_KEY_CLICKS, JSON.stringify(clicks));
        } catch (e) {}

        // 2. Dispatch event for live admin dashboard if open in another window
        try {
            window.dispatchEvent(new CustomEvent('site_click_recorded', { detail: clickEvent }));
        } catch (e) {}

        // 3. Send beacon/POST to API if server is active
        try {
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/track', JSON.stringify(clickEvent));
            } else {
                fetch('/api/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clickEvent)
                }).catch(() => {});
            }
        } catch (e) {}
    }

    // Extract profile/companion name from button's card
    function getButtonLabel(btn, defaultType) {
        if (btn.getAttribute('data-click-label')) {
            return btn.getAttribute('data-click-label');
        }
        if (btn.getAttribute('aria-label')) {
            return btn.getAttribute('aria-label');
        }
        const card = btn.closest('.model-card, .profile-card, .card, .profile, article');
        if (card) {
            const titleElem = card.querySelector('h2, h3, h4, .model-name, .profile-name, [class*="name"], [class*="title"]');
            if (titleElem) {
                return 'Profile: ' + titleElem.textContent.trim().replace(/\s+/g, ' ');
            }
        }
        return defaultType === 'call' ? 'Page Call Button' : 'Page WhatsApp Button';
    }

    // Update all Call & WhatsApp buttons across the page
    function updatePageButtons() {
        const numbers = getPageNumbers();

        // 1. Update Call buttons (href^="tel:" or class containing call)
        const callButtons = document.querySelectorAll('a[href^="tel:"], a.btn-call, a.icon-call, button.btn-call, a.popular-tag.accent-green');
        callButtons.forEach(btn => {
            if (btn.classList.contains('floating-call-btn')) return;
            btn.setAttribute('href', 'tel:' + numbers.cleanCall);
            if (!btn.__hasTrackListener) {
                btn.__hasTrackListener = true;
                btn.addEventListener('click', function () {
                    const label = getButtonLabel(btn, 'call');
                    recordClick('call', label);
                });
            }
        });

        // 2. Update WhatsApp buttons (href*="wa.me" or class containing wa)
        const waButtons = document.querySelectorAll('a[href*="wa.me"], a.btn-wa, a.icon-wa, button.btn-wa, a.popular-tag.accent-purple');
        waButtons.forEach(btn => {
            if (btn.classList.contains('floating-wa-btn')) return;
            const currentHref = btn.getAttribute('href') || '';
            let textParam = '';
            const match = currentHref.match(/[?&]text=([^&]+)/);
            if (match) {
                textParam = '?text=' + match[1];
            }
            btn.setAttribute('href', 'https://wa.me/' + numbers.cleanWA + textParam);
            if (!btn.__hasTrackListener) {
                btn.__hasTrackListener = true;
                btn.addEventListener('click', function () {
                    const label = getButtonLabel(btn, 'whatsapp');
                    recordClick('whatsapp', label);
                });
            }
        });
    }

    // Inject Floating Call and WhatsApp Buttons
    function injectFloatingButtons() {
        if (document.getElementById('ch-floating-buttons-container')) return;

        const numbers = getPageNumbers();

        // Inject Styles
        const style = document.createElement('style');
        style.id = 'ch-floating-styles';
        style.textContent = `
            .ch-float-btn {
                position: fixed;
                bottom: 24px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                cursor: pointer;
                text-decoration: none;
                transition: transform 0.25s ease, box-shadow 0.25s ease;
                outline: none;
                border: none;
            }
            .ch-float-btn:hover {
                transform: scale(1.1);
            }
            .ch-float-call {
                left: 24px;
                background: #10b981;
                box-shadow: 0 4px 18px rgba(16, 185, 129, 0.45);
                color: #fff;
            }
            .ch-float-call:hover {
                box-shadow: 0 6px 24px rgba(16, 185, 129, 0.65);
                color: #fff;
            }
            .ch-float-call svg {
                stroke: #fff;
                width: 26px;
                height: 26px;
            }
            .ch-float-wa {
                right: 24px;
                background: #25D366;
                box-shadow: 0 4px 18px rgba(37, 211, 102, 0.45);
                color: #fff;
            }
            .ch-float-wa:hover {
                box-shadow: 0 6px 24px rgba(37, 211, 102, 0.65);
                color: #fff;
            }
            .ch-float-wa svg {
                fill: #fff;
                width: 30px;
                height: 30px;
            }
            @media (max-width: 768px) {
                .ch-float-btn {
                    bottom: 20px;
                    width: 50px;
                    height: 50px;
                }
                .ch-float-call {
                    left: 16px;
                }
                .ch-float-call svg {
                    width: 23px;
                    height: 23px;
                }
                .ch-float-wa {
                    right: 16px;
                }
                .ch-float-wa svg {
                    width: 26px;
                    height: 26px;
                }
            }
            @media (max-width: 360px) {
                .ch-float-btn {
                    bottom: 16px;
                    width: 44px;
                    height: 44px;
                }
                .ch-float-call {
                    left: 12px;
                }
                .ch-float-wa {
                    right: 12px;
                }
            }
        `;
        document.head.appendChild(style);

        // Container
        const container = document.createElement('div');
        container.id = 'ch-floating-buttons-container';

        // Floating Call Button (Left Bottom)
        const callBtn = document.createElement('a');
        callBtn.className = 'ch-float-btn ch-float-call floating-call-btn';
        callBtn.href = 'tel:' + numbers.cleanCall;
        callBtn.setAttribute('aria-label', 'Call Support Desk');
        callBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
        `;
        callBtn.addEventListener('click', function () {
            recordClick('call', 'Floating Call Button');
        });

        // Floating WhatsApp Button (Right Bottom)
        const waBtn = document.createElement('a');
        waBtn.className = 'ch-float-btn ch-float-wa floating-wa-btn';
        waBtn.href = 'https://wa.me/' + numbers.cleanWA;
        waBtn.target = '_blank';
        waBtn.rel = 'noopener noreferrer';
        waBtn.setAttribute('aria-label', 'Chat on WhatsApp');
        waBtn.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.13 7.39C8.95 7.39 8.65 7.46 8.4 7.73C8.15 8 7.45 8.65 7.45 9.97C7.45 11.29 8.41 12.57 8.54 12.75C8.68 12.93 10.42 15.63 13.09 16.78C15.31 17.74 15.76 17.55 16.25 17.51C16.75 17.46 17.86 16.85 18.09 16.21C18.32 15.57 18.32 15.02 18.25 14.91C18.18 14.79 18 14.73 17.72 14.59C17.45 14.45 16.08 13.78 15.83 13.69C15.58 13.59 15.4 13.55 15.22 13.82C15.04 14.1 14.51 14.73 14.35 14.91C14.19 15.1 14.03 15.12 13.75 14.98C13.48 14.84 12.59 14.55 11.54 13.61C10.72 12.88 10.16 11.98 10 11.71C9.84 11.43 9.98 11.29 10.12 11.15C10.25 11.03 10.4 10.83 10.54 10.67C10.68 10.5 10.73 10.39 10.82 10.2C10.91 10.02 10.87 9.86 10.8 9.72C10.73 9.58 10.18 8.24 9.95 7.7C9.73 7.18 9.51 7.25 9.34 7.24C9.18 7.24 9.01 7.39 9.13 7.39Z"/>
            </svg>
        `;
        waBtn.addEventListener('click', function () {
            recordClick('whatsapp', 'Floating WhatsApp Button');
        });

        container.appendChild(callBtn);
        container.appendChild(waBtn);
        document.body.appendChild(container);
    }

    // Initialize
    function init() {
        updatePageButtons();
        injectFloatingButtons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Listen for storage changes if admin updates numbers in another tab
    window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY_CONFIG) {
            updatePageButtons();
            const numbers = getPageNumbers();
            const callBtn = document.querySelector('.ch-float-call');
            if (callBtn) callBtn.href = 'tel:' + numbers.cleanCall;
            const waBtn = document.querySelector('.ch-float-wa');
            if (waBtn) waBtn.href = 'https://wa.me/' + numbers.cleanWA;
        }
    });

    // Public API
    window.CHContactManager = {
        getPageNumbers: getPageNumbers,
        getActiveConfig: getActiveConfig,
        recordClick: recordClick
    };
})();
