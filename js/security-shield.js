/**
 * Security Shield: Anti-Copy, Anti-Inspect & Anti-Screenshot Protection
 * Shields website content on both Mobile and Desktop devices.
 */
(function () {
    'use strict';

    // 1. Inject Universal Anti-Copy & Anti-Screenshot Stylesheet
    function injectSecurityStyles() {
        if (document.getElementById('sec-shield-styles')) return;
        var style = document.createElement('style');
        style.id = 'sec-shield-styles';
        style.textContent = `
            /* Universal Anti-Selection & Anti-Callout (Mobile & Desktop) */
            html, body, div, p, span, h1, h2, h3, h4, h5, h6, a, li, ul, ol, section, article, header, footer, nav, button, table, td, th {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
                -webkit-touch-callout: none !important;
                -webkit-user-drag: none !important;
                -webkit-tap-highlight-color: transparent !important;
            }
            
            /* Form input controls allow typing */
            input, textarea {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
            }

            /* Image & Video Drag and Context Protection */
            img, video {
                -webkit-user-drag: none !important;
                user-select: none !important;
                -webkit-touch-callout: none !important;
            }

            /* Anti-Print & Anti-PDF Screenshot Blanking */
            @media print {
                html, body {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    height: 0 !important;
                    width: 0 !important;
                    overflow: hidden !important;
                }
            }

            /* Privacy Shield Overlay for Screen Snip / Blur */
            #sec-privacy-shield {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: #000000 !important;
                z-index: 2147483647 !important;
                display: none;
                pointer-events: none !important;
                opacity: 0;
                transition: opacity 0.05s linear !important;
            }
            #sec-privacy-shield.active {
                display: block !important;
                opacity: 1 !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    // 2. DOM Privacy Shield Elements
    var shieldElem = null;
    function getPrivacyShield() {
        if (!shieldElem) {
            shieldElem = document.getElementById('sec-privacy-shield');
            if (!shieldElem && document.body) {
                shieldElem = document.createElement('div');
                shieldElem.id = 'sec-privacy-shield';
                shieldElem.setAttribute('aria-hidden', 'true');
                document.body.appendChild(shieldElem);
            }
        }
        return shieldElem;
    }

    function showShield() {
        var shield = getPrivacyShield();
        if (shield) {
            shield.classList.add('active');
        }
        if (document.body) {
            document.body.style.filter = 'blur(28px)';
        }
    }

    function hideShield() {
        var shield = getPrivacyShield();
        if (shield) {
            shield.classList.remove('active');
        }
        if (document.body) {
            document.body.style.filter = 'none';
        }
    }

    // 3. Anti-Copy Handlers
    // Prevent Context Menu (Right-Click on Desktop, Long-Press on Mobile)
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        return false;
    }, { capture: true, passive: false });

    // Prevent Copy
    document.addEventListener('copy', function (e) {
        if (e.clipboardData) {
            e.clipboardData.setData('text/plain', '');
        }
        e.preventDefault();
        return false;
    }, { capture: true, passive: false });

    // Prevent Cut
    document.addEventListener('cut', function (e) {
        e.preventDefault();
        return false;
    }, { capture: true, passive: false });

    // Prevent Selection Dragging
    document.addEventListener('selectstart', function (e) {
        var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag !== 'input' && tag !== 'textarea') {
            e.preventDefault();
            return false;
        }
    }, { capture: true, passive: false });

    // Prevent Dragging Images & Elements
    document.addEventListener('dragstart', function (e) {
        e.preventDefault();
        return false;
    }, { capture: true, passive: false });

    // 4. Anti-Inspect: Block DevTools & Inspection Shortcuts
    window.addEventListener('keydown', function (e) {
        var key = e.key || '';
        var code = e.keyCode || 0;
        var ctrl = e.ctrlKey || e.metaKey;
        var shift = e.shiftKey;
        var alt = e.altKey;

        // F12
        if (key === 'F12' || code === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+Shift+I (DevTools), Ctrl+Shift+J (Console), Ctrl+Shift+C (Inspect), Ctrl+Shift+K
        if (ctrl && shift && (
            key === 'I' || key === 'i' || code === 73 ||
            key === 'J' || key === 'j' || code === 74 ||
            key === 'C' || key === 'c' || code === 67 ||
            key === 'K' || key === 'k' || code === 75
        )) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Mac: Cmd+Option+I, Cmd+Option+J, Cmd+Option+C
        if (ctrl && alt && (
            key === 'I' || key === 'i' || code === 73 ||
            key === 'J' || key === 'j' || code === 74 ||
            key === 'C' || key === 'c' || code === 67
        )) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+U (View Source)
        if (ctrl && (key === 'U' || key === 'u' || code === 85)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+S (Save Page)
        if (ctrl && (key === 'S' || key === 's' || code === 83)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+P (Print Page / Save PDF)
        if (ctrl && (key === 'P' || key === 'p' || code === 80)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // PrintScreen Key
        if (key === 'PrintScreen' || code === 44) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try { navigator.clipboard.writeText(''); } catch (err) {}
            }
            showShield();
            setTimeout(hideShield, 1200);
            e.preventDefault();
            return false;
        }
    }, { capture: true, passive: false });

    // Clear clipboard on PrintScreen keyup
    window.addEventListener('keyup', function (e) {
        var key = e.key || '';
        var code = e.keyCode || 0;
        if (key === 'PrintScreen' || code === 44) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try { navigator.clipboard.writeText(''); } catch (err) {}
            }
            showShield();
            setTimeout(hideShield, 1200);
        }
    }, { capture: true });

    // 5. Anti-Screenshot Protection: Window Blur & Visibility Guard
    // When Snipping Tool (Win+Shift+S), Mac screenshot overlay, or mobile screenshot activates,
    // window immediately loses focus (blur) or visibility changes.
    window.addEventListener('blur', function () {
        showShield();
    });

    window.addEventListener('focus', function () {
        setTimeout(hideShield, 120);
    });

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            showShield();
        } else {
            setTimeout(hideShield, 120);
        }
    });

    // 6. DevTools Dimension Guard
    function checkDevTools() {
        var widthDiff = window.outerWidth - window.innerWidth;
        var heightDiff = window.outerHeight - window.innerHeight;
        if (widthDiff > 160 || heightDiff > 160) {
            showShield();
        }
    }
    window.addEventListener('resize', checkDevTools);

    // Disable Console Logging to prevent inspect data scraping
    try {
        var noop = function () {};
        var c = window.console;
        if (c) {
            c.log = noop;
            c.info = noop;
            c.warn = noop;
            c.error = noop;
            c.debug = noop;
            c.dir = noop;
            c.table = noop;
            c.trace = noop;
        }
    } catch (e) {}

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            injectSecurityStyles();
            getPrivacyShield();
        });
    } else {
        injectSecurityStyles();
        getPrivacyShield();
    }
})();
