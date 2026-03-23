/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 *
 * Bootstrap replacement helpers for Tailwind UI.
 * ---------------------------------------------------------------------------- */

(function () {
    const modalInstances = new WeakMap();
    const toastInstances = new WeakMap();
    const dropdownInstances = new WeakMap();

    const resolveElement = (target) => {
        if (!target) {
            return null;
        }

        if (typeof target === 'string') {
            return document.querySelector(target);
        }

        return target;
    };

    const dispatchEvent = (element, name) => {
        if (!element) {
            return;
        }

        element.dispatchEvent(new Event(name, {bubbles: true}));
    };

    class Modal {
        constructor(target, options = {}) {
            this._element = resolveElement(target);
            this._options = {
                backdrop: options.backdrop ?? true,
                keyboard: options.keyboard ?? true,
            };

            this._handleKeydown = this._handleKeydown.bind(this);
            this._handleBackdropClick = this._handleBackdropClick.bind(this);
        }

        show() {
            if (!this._element) {
                return;
            }

            this._element.classList.add('show');
            this._element.setAttribute('aria-hidden', 'false');
            document.body.classList.add('overflow-hidden');

            this._element.addEventListener('click', this._handleBackdropClick);
            document.addEventListener('keydown', this._handleKeydown);

            dispatchEvent(this._element, 'shown.bs.modal');
        }

        hide() {
            if (!this._element) {
                return;
            }

            dispatchEvent(this._element, 'hide.bs.modal');

            this._element.classList.remove('show');
            this._element.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('overflow-hidden');

            this._element.removeEventListener('click', this._handleBackdropClick);
            document.removeEventListener('keydown', this._handleKeydown);

            dispatchEvent(this._element, 'hidden.bs.modal');
        }

        dispose() {
            this.hide();
            modalInstances.delete(this._element);
        }

        _handleBackdropClick(event) {
            if (this._options.backdrop === 'static') {
                return;
            }

            if (event.target === this._element) {
                this.hide();
            }
        }

        _handleKeydown(event) {
            if (!this._options.keyboard) {
                return;
            }

            if (event.key === 'Escape') {
                this.hide();
            }
        }

        static getOrCreateInstance(target, options) {
            const element = resolveElement(target);

            if (!element) {
                return null;
            }

            if (modalInstances.has(element)) {
                return modalInstances.get(element);
            }

            const instance = new Modal(element, options);
            modalInstances.set(element, instance);
            return instance;
        }
    }

    class Toast {
        constructor(target) {
            this._element = resolveElement(target);
        }

        show() {
            if (!this._element) {
                return;
            }

            this._element.classList.add('show');
        }

        dispose() {
            toastInstances.delete(this._element);
        }

        static getOrCreateInstance(target) {
            const element = resolveElement(target);

            if (!element) {
                return null;
            }

            if (toastInstances.has(element)) {
                return toastInstances.get(element);
            }

            const instance = new Toast(element);
            toastInstances.set(element, instance);
            return instance;
        }
    }

    const closeAllDropdowns = () => {
        document.querySelectorAll('.dropdown-menu.show').forEach((menu) => {
            menu.classList.remove('show');
            const trigger = menu.closest('.dropdown, .btn-group')?.querySelector('[data-bs-toggle="dropdown"]');
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
            }
        });
    };

    const toggleDropdown = (trigger) => {
        const parent = trigger.closest('.dropdown, .btn-group');
        const menu = parent?.querySelector('.dropdown-menu');

        if (!menu) {
            return;
        }

        const isOpen = menu.classList.contains('show');
        closeAllDropdowns();

        if (!isOpen) {
            menu.classList.add('show');
            trigger.setAttribute('aria-expanded', 'true');
        }
    };

    class Dropdown {
        constructor(target) {
            this._element = resolveElement(target);
            this._handleClick = this._handleClick.bind(this);

            if (this._element) {
                this._element.addEventListener('click', this._handleClick);
            }
        }

        toggle() {
            if (this._element) {
                toggleDropdown(this._element);
            }
        }

        dispose() {
            if (this._element) {
                this._element.removeEventListener('click', this._handleClick);
            }

            dropdownInstances.delete(this._element);
        }

        _handleClick(event) {
            event.preventDefault();
            toggleDropdown(this._element);
        }

        static getOrCreateInstance(target) {
            const element = resolveElement(target);

            if (!element) {
                return null;
            }

            if (dropdownInstances.has(element)) {
                return dropdownInstances.get(element);
            }

            const instance = new Dropdown(element);
            dropdownInstances.set(element, instance);
            return instance;
        }
    }

    const activateTab = (trigger) => {
        const targetSelector = trigger.getAttribute('data-bs-target') || trigger.getAttribute('href');

        if (!targetSelector || !targetSelector.startsWith('#')) {
            return;
        }

        const target = document.querySelector(targetSelector);
        if (!target) {
            return;
        }

        const tabList = trigger.closest('[role="tablist"]') || trigger.closest('.nav');
        if (tabList) {
            tabList
                .querySelectorAll('[data-bs-toggle="tab"], [data-bs-toggle="pill"]')
                .forEach((link) => link.classList.remove('active'));
        }

        const tabContent = target.closest('.tab-content');
        if (tabContent) {
            tabContent.querySelectorAll('.tab-pane').forEach((pane) => pane.classList.remove('active', 'show'));
        }

        trigger.classList.add('active');
        target.classList.add('active', 'show');
    };

    class Tab {
        constructor(target) {
            this._element = resolveElement(target);
        }

        show() {
            if (this._element) {
                activateTab(this._element);
            }
        }
    }

    document.addEventListener('click', (event) => {
        const dropdownTrigger = event.target.closest('[data-bs-toggle="dropdown"]');
        if (dropdownTrigger) {
            event.preventDefault();
            toggleDropdown(dropdownTrigger);
            return;
        }

        const tabTrigger = event.target.closest('[data-bs-toggle="tab"], [data-bs-toggle="pill"]');
        if (tabTrigger) {
            event.preventDefault();
            activateTab(tabTrigger);
            return;
        }

        const dismissTarget = event.target.closest('[data-bs-dismiss]');
        if (dismissTarget) {
            const dismissType = dismissTarget.getAttribute('data-bs-dismiss');
            if (dismissType === 'modal') {
                const modalElement = dismissTarget.closest('.modal');
                const modalInstance = Modal.getOrCreateInstance(modalElement);
                modalInstance?.hide();
            }

            if (dismissType === 'toast') {
                const toastElement = dismissTarget.closest('.toast');
                toastElement?.remove();
            }
        }
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.dropdown, .btn-group')) {
            closeAllDropdowns();
        }
    });

    if (window.jQuery) {
        const $ = window.jQuery;

        $.fn.modal = function (action) {
            return this.each(function () {
                const instance = Modal.getOrCreateInstance(this);
                if (!instance) {
                    return;
                }

                if (action === 'show') {
                    instance.show();
                } else if (action === 'hide') {
                    instance.hide();
                } else if (action === 'toggle') {
                    if (this.classList.contains('show')) {
                        instance.hide();
                    } else {
                        instance.show();
                    }
                }
            });
        };

        const normalizePopoverContent = (content) => {
            if (content && typeof content === 'object' && content.jquery) {
                return content[0];
            }

            return content ?? '';
        };

        $.fn.popover = function (option) {
            return this.each(function () {
                const element = this;

                if (!window.tippy) {
                    return;
                }

                const instance = element._tippy;

                if (typeof option === 'string') {
                    if (option === 'show') {
                        instance?.show();
                    } else if (option === 'hide') {
                        instance?.hide();
                    } else if (option === 'dispose') {
                        instance?.destroy();
                    }
                    return;
                }

                const options = option || {};
                const content = normalizePopoverContent(
                    options.content || element.getAttribute('data-content') || '',
                );
                const placement = options.placement || 'top';
                const trigger = options.trigger || 'mouseenter focus';
                const appendTo = options.container ? resolveElement(options.container) : document.body;

                if (instance) {
                    instance.setProps({
                        content,
                        placement,
                        trigger,
                        allowHTML: true,
                        interactive: true,
                        appendTo,
                    });
                    return;
                }

                window.tippy(element, {
                    content,
                    placement,
                    trigger,
                    allowHTML: true,
                    interactive: true,
                    appendTo,
                });
            });
        };
    }

    window.bootstrap = {
        Modal,
        Toast,
        Dropdown,
        Tab,
    };
})();
