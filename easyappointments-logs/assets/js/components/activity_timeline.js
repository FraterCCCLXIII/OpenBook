/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 * ---------------------------------------------------------------------------- */

App.Components = App.Components || {};

App.Components.ActivityTimeline = (function () {
    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function toPrettyJson(value) {
        try {
            return JSON.stringify(value || {}, null, 2);
        } catch (error) {
            return '{}';
        }
    }

    function render($container, events) {
        $container.empty();

        if (!events || !events.length) {
            $container.append(
                $('<div/>', {
                    class: 'rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-slate-50 px-4 py-6 text-center text-sm text-slate-500',
                    text: 'No activity found.',
                }),
            );
            return;
        }

        events.forEach((eventItem) => {
            const createdAt = App.Utils.Date.format(
                new Date(eventItem.occurred_at || eventItem.create_datetime),
                vars('date_format'),
                vars('time_format'),
                true,
            );

            const actor = eventItem.actor_display_name || eventItem.actor_role || 'System';
            const title = `${eventItem.action || 'activity'} • ${eventItem.entity_type || 'entity'}${eventItem.entity_id ? ` #${eventItem.entity_id}` : ''}`;
            const metadata = eventItem.metadata || {};

            const $card = $('<div/>', {
                class: 'rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-3',
            });

            const $header = $('<div/>', {
                class: 'd-flex justify-content-between align-items-start gap-2',
            });
            const $title = $('<div/>', {
                class: 'text-sm fw-semibold text-slate-800',
                text: title,
            });
            const $meta = $('<div/>', {
                class: 'text-xs text-slate-500',
                text: `${actor} • ${createdAt}`,
            });

            const $body = $('<details/>', { class: 'mt-2' });
            $body.append(
                $('<summary/>', { class: 'cursor-pointer text-xs text-slate-600', text: 'View details' }),
                $('<pre/>', {
                    class: 'mt-2 mb-0 rounded border bg-slate-50 p-2 text-xs overflow-auto',
                    html: escapeHtml(toPrettyJson(metadata)),
                }),
            );

            $header.append($title, $meta);
            $card.append($header, $body);
            $container.append($card);
        });
    }

    return {
        render,
    };
})();
