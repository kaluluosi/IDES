/* =========================================
   TERMINAL UI FRAMEWORK - JS CORE
   -----------------------------------------
   Dependency-free, progressive enhancement.
   ========================================= */

(function (window, document) {
    'use strict';

    const SELECTORS = {
        dropdownMenu: '.t-dropdown-menu',
        modal: '.t-modal',
        toastContainer: '.t-toast-container',
        sidebarLinks: '.t-sidebar a'
    };

    function qs(selector, scope = document) {
        return scope.querySelector(selector);
    }

    function qsa(selector, scope = document) {
        return Array.from(scope.querySelectorAll(selector));
    }

    function byId(id) {
        return document.getElementById(id);
    }

    function setText(el, value) {
        if (el) el.textContent = value == null ? '' : String(value);
    }

    function createEl(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text != null) el.textContent = text;
        return el;
    }

    const Terminal = {
        version: '10.0.0',

        init: function () {
            Terminal.splash.close();
            Terminal.bindDataAPI();
            Terminal.bindSidebarActive();
            Terminal.theme.load();
        },

        bindDataAPI: function () {
            document.addEventListener('click', function (event) {
                const target = event.target;

                const modalOpen = target.closest('[data-t-modal-open]');
                if (modalOpen) {
                    event.preventDefault();
                    Terminal.modal.open(modalOpen.getAttribute('data-t-modal-open'));
                    return;
                }

                const modalClose = target.closest('[data-t-modal-close]');
                if (modalClose) {
                    event.preventDefault();
                    const id = modalClose.getAttribute('data-t-modal-close');
                    if (id) Terminal.modal.close(id);
                    else {
                        const modal = target.closest('.t-modal');
                        if (modal) modal.classList.remove('is-open');
                    }
                    return;
                }

                const tab = target.closest('[data-t-tab]');
                if (tab) {
                    event.preventDefault();
                    Terminal.tab(tab, tab.getAttribute('data-t-tab'));
                    return;
                }

                const accordion = target.closest('[data-t-accordion]');
                if (accordion) {
                    event.preventDefault();
                    Terminal.accordion(accordion);
                    return;
                }

                const dropdown = target.closest('[data-t-dropdown]');
                if (dropdown) {
                    event.preventDefault();
                    Terminal.dropdown(dropdown);
                    return;
                }

                const navbar = target.closest('[data-t-navbar-toggle]');
                if (navbar) {
                    event.preventDefault();
                    Terminal.navbarToggle(navbar.getAttribute('data-t-navbar-toggle'));
                    return;
                }

                const copy = target.closest('[data-t-copy]');
                if (copy) {
                    event.preventDefault();
                    Terminal.copy(copy.getAttribute('data-t-copy'), copy);
                    return;
                }

                const theme = target.closest('[data-t-theme]');
                if (theme) {
                    event.preventDefault();
                    Terminal.theme.set(theme.getAttribute('data-t-theme'));
                    return;
                }

                const lightbox = target.closest('[data-t-lightbox]');
                if (lightbox) {
                    event.preventDefault();
                    Terminal.lightbox.open(lightbox.getAttribute('data-t-lightbox') || lightbox.getAttribute('src') || lightbox.getAttribute('href'));
                    return;
                }

                if (target.classList.contains('t-modal')) {
                    target.classList.remove('is-open');
                    return;
                }

                if (!target.closest('[data-t-dropdown], .t-dropdown-btn')) {
                    Terminal.dropdown.closeAll();
                }
            });

            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') {
                    qsa('.t-modal.is-open').forEach(modal => modal.classList.remove('is-open'));
                    Terminal.dropdown.closeAll();
                    Terminal.commandPalette.close();
                }

                const isMac = navigator.platform.toUpperCase().includes('MAC');
                const modPressed = isMac ? event.metaKey : event.ctrlKey;
                if (modPressed && event.key.toLowerCase() === 'k') {
                    event.preventDefault();
                    Terminal.commandPalette.toggle();
                }
            });
        },

        bindSidebarActive: function () {
            qsa(SELECTORS.sidebarLinks).forEach(link => {
                link.addEventListener('click', function () {
                    qsa(SELECTORS.sidebarLinks).forEach(item => item.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        },

        modal: {
            open: function (modalId) {
                const modal = byId(modalId);
                if (!modal) return;
                modal.classList.add('is-open');

                const focusTarget = qs('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal);
                if (focusTarget) setTimeout(() => focusTarget.focus(), 10);
            },
            close: function (modalId) {
                const modal = byId(modalId);
                if (modal) modal.classList.remove('is-open');
            }
        },

        tab: function (btnElement, targetId) {
            const wrapper = btnElement.closest('.t-tabs-wrapper');
            if (!wrapper) return;

            qsa('.t-tab-btn, [data-t-tab]', wrapper).forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            qsa('.t-tab-content', wrapper).forEach(content => content.classList.remove('active'));

            btnElement.classList.add('active');
            btnElement.setAttribute('aria-selected', 'true');

            const target = byId(targetId);
            if (target) target.classList.add('active');
        },

        toast: function (message, type = 'normal', duration = 3000) {
            let container = qs(SELECTORS.toastContainer);
            if (!container) {
                container = createEl('div', 't-toast-container');
                container.setAttribute('aria-live', 'polite');
                container.setAttribute('aria-atomic', 'true');
                document.body.appendChild(container);
            }

            const typeClass = ['danger', 'warning', 'info'].includes(type) ? ` ${type}` : '';
            const toast = createEl('div', `t-toast${typeClass}`);
            setText(toast, `> ${message}`);
            container.appendChild(toast);

            window.setTimeout(() => {
                toast.style.transform = 'translateX(100%)';
                toast.style.opacity = '0';
                window.setTimeout(() => toast.remove(), 300);
            }, duration);
        },

        accordion: function (btnElement) {
            btnElement.classList.toggle('active');
            const content = btnElement.nextElementSibling;
            if (content && content.classList.contains('t-accordion-content')) {
                content.classList.toggle('active');
                btnElement.setAttribute('aria-expanded', content.classList.contains('active') ? 'true' : 'false');
            }
        },

        toggleInputAction: function (inputId, btnElement) {
            const input = byId(inputId);
            if (!input) return;

            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            setText(btnElement, isPassword ? '[ HIDE ]' : '[ SHOW ]');
            if (btnElement) btnElement.style.color = isPassword ? 'var(--t-green)' : 'var(--t-green-dim)';
        },

        dropdown: function (btnElement) {
            const menu = btnElement.nextElementSibling;
            if (!menu) return;

            qsa(SELECTORS.dropdownMenu).forEach(item => {
                if (item !== menu) item.classList.remove('show');
            });
            menu.classList.toggle('show');
        },

        treeToggle: function (folderElement) {
            folderElement.classList.toggle('open');
            const childUl = folderElement.nextElementSibling;
            if (childUl && childUl.tagName === 'UL') childUl.classList.toggle('active');
        },

        typewrite: function (elementId, text, speed = 30, callback = null) {
            const el = byId(elementId);
            if (!el) return;

            el.textContent = '';
            let i = 0;
            const cursor = createEl('span', 't-typewriter-cursor');

            function type() {
                if (i < text.length) {
                    el.appendChild(document.createTextNode(text.charAt(i)));
                    i++;
                    el.appendChild(cursor);
                    window.setTimeout(type, speed);
                } else if (callback) {
                    callback();
                }
            }

            type();
        },

        splash: {
            show: function (customText = null) {
                const splashEl = qs('.t-splash');
                if (!splashEl) return;

                if (customText) {
                    const textEl = byId('splash-text');
                    if (textEl) {
                        textEl.textContent = customText;
                        const dots = createEl('span', 't-loading-dots');
                        textEl.appendChild(dots);
                    }
                }
                splashEl.classList.remove('hidden');
            },
            close: function (customDelay = 900) {
                const splashEl = qs('.t-splash');
                if (!splashEl) return;

                window.setTimeout(() => splashEl.classList.add('hidden'), customDelay);
            }
        },

        lightbox: {
            open: function (imgSrc) {
                if (!imgSrc) return;

                let box = byId('t-lightbox-container');
                if (!box) {
                    box = createEl('div', 't-lightbox');
                    box.id = 't-lightbox-container';

                    const close = createEl('button', 't-lightbox-close', '[ X ]');
                    close.type = 'button';
                    close.addEventListener('click', Terminal.lightbox.close);

                    const img = document.createElement('img');
                    img.id = 't-lightbox-img';
                    img.alt = 'Lightbox preview';

                    box.addEventListener('click', function (e) {
                        if (e.target === box) Terminal.lightbox.close();
                    });

                    box.appendChild(close);
                    box.appendChild(img);
                    document.body.appendChild(box);
                }

                byId('t-lightbox-img').src = imgSrc;
                box.classList.add('active');
            },
            close: function () {
                const box = byId('t-lightbox-container');
                if (box) box.classList.remove('active');
            }
        },

        fileInput: function (inputId, labelId) {
            const input = byId(inputId);
            const label = byId(labelId);
            if (!input || !label) return;

            input.addEventListener('change', function (e) {
                let fileName = e.target.files[0] ? e.target.files[0].name : '[ NO_MEDIA ]';
                if (fileName.length > 28) fileName = fileName.substring(0, 25) + '...';
                label.textContent = '> ' + fileName;
            });
        },

        navbarToggle: function (menuId) {
            const menu = byId(menuId);
            if (menu) menu.classList.toggle('show');
        },

        copy: async function (target, trigger = null) {
            let text = target || '';
            const node = byId(target);

            if (node) {
                text = node.innerText || node.textContent || '';
            }

            try {
                await navigator.clipboard.writeText(text);
                Terminal.toast('Copied to clipboard', 'normal');
                if (trigger) {
                    const old = trigger.textContent;
                    trigger.textContent = '[ COPIED ]';
                    window.setTimeout(() => { trigger.textContent = old; }, 1200);
                }
            } catch (err) {
                Terminal.toast('Clipboard permission denied', 'warning');
            }
        },

        theme: {
            set: function (themeName) {
                const safe = ['green', 'amber', 'cyan', 'red'].includes(themeName) ? themeName : 'green';
                document.documentElement.setAttribute('data-terminal-theme', safe);
                try { localStorage.setItem('terminal-theme', safe); } catch (e) {}
                Terminal.toast(`Theme loaded: ${safe}`, 'normal');
            },
            load: function () {
                try {
                    const saved = localStorage.getItem('terminal-theme');
                    if (saved) document.documentElement.setAttribute('data-terminal-theme', saved);
                } catch (e) {}
            }
        },

        commandPalette: {
            open: function () {
                let palette = byId('t-command-palette');
                if (!palette) {
                    palette = createEl('div', 't-command-palette');
                    palette.id = 't-command-palette';
                    palette.innerHTML = [
                        '<div class="t-command-palette-box">',
                        '<div class="t-card-header">> COMMAND_PALETTE <span class="text-muted">CTRL/⌘ + K</span></div>',
                        '<div class="t-command">',
                        '<span class="t-command-prompt">$</span>',
                        '<input class="t-input" id="t-command-palette-input" placeholder="Filter commands...">',
                        '</div>',
                        '<ul class="t-command-palette-list" id="t-command-palette-list"></ul>',
                        '</div>'
                    ].join('');
                    document.body.appendChild(palette);

                    const list = byId('t-command-palette-list');
                    const commands = qsa('[data-t-command]').map(el => ({
                        label: el.getAttribute('data-t-command') || el.textContent.trim(),
                        href: el.getAttribute('href') || '#'
                    }));

                    if (commands.length === 0) {
                        const li = createEl('li', 't-command-palette-item', 'No commands registered');
                        list.appendChild(li);
                    } else {
                        commands.forEach(cmd => {
                            const a = createEl('a', 't-command-palette-item', cmd.label);
                            a.href = cmd.href;
                            list.appendChild(a);
                        });
                    }

                    byId('t-command-palette-input').addEventListener('input', function () {
                        const q = this.value.toLowerCase();
                        qsa('.t-command-palette-item', list).forEach(item => {
                            item.style.display = item.textContent.toLowerCase().includes(q) ? 'block' : 'none';
                        });
                    });

                    palette.addEventListener('click', function (e) {
                        if (e.target === palette) Terminal.commandPalette.close();
                    });
                }

                palette.classList.add('is-open');
                const input = byId('t-command-palette-input');
                if (input) setTimeout(() => input.focus(), 10);
            },
            close: function () {
                const palette = byId('t-command-palette');
                if (palette) palette.classList.remove('is-open');
            },
            toggle: function () {
                const palette = byId('t-command-palette');
                if (palette && palette.classList.contains('is-open')) Terminal.commandPalette.close();
                else Terminal.commandPalette.open();
            }
        }
    };

    Terminal.dropdown.closeAll = function () {
        qsa(SELECTORS.dropdownMenu).forEach(menu => menu.classList.remove('show'));
    };

    window.Terminal = Terminal;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', Terminal.init);
    } else {
        Terminal.init();
    }

})(window, document);
