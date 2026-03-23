/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 *
 * Popover fix for tippy-based bootstrap replacements.
 * ---------------------------------------------------------------------------- */

(function () {
    if (!window.jQuery || !window.tippy) {
        return;
    }

    const normalizeContent = (content) => {
        if (content && typeof content === 'object' && content.jquery) {
            return content[0];
        }

        return content ?? '';
    };

    const resolveElement = (target) => {
        if (!target) {
            return null;
        }

        if (typeof target === 'string') {
            return document.querySelector(target);
        }

        return target;
    };

    const $ = window.jQuery;

    $.fn.popover = function (option) {
        return this.each(function () {
            const element = this;
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
            const content = normalizeContent(options.content || element.getAttribute('data-content') || '');
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
})();
