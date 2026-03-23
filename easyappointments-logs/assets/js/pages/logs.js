/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 * ---------------------------------------------------------------------------- */

App.Pages.Logs = (function () {
    const $logsPage = $('#logs-page');
    const $tbody = $('#logs-table-body');
    const $meta = $('#logs-pagination-meta');
    const state = {
        limit: 50,
        offset: 0,
        total: 0,
    };

    function renderRows(items) {
        $tbody.empty();

        if (!items.length) {
            $tbody.append(
                '<tr><td colspan="8" class="text-center py-4 text-muted">No activity found.</td></tr>',
            );
            return;
        }

        items.forEach((item) => {
            const when = App.Utils.Date.format(
                new Date(item.occurred_at || item.create_datetime),
                vars('date_format'),
                vars('time_format'),
                true,
            );
            const details = JSON.stringify(item.metadata || {});
            const rowHtml = `
                <tr>
                    <td class="ps-4">${when}</td>
                    <td>${item.actor_display_name || item.actor_role || 'System'}</td>
                    <td>${item.action || '-'}</td>
                    <td>${item.entity_type || '-'}${item.entity_id ? ` #${item.entity_id}` : ''}</td>
                    <td>${item.customer_id || '-'}</td>
                    <td>${item.appointment_id || '-'}</td>
                    <td>${item.source || '-'}</td>
                    <td class="pe-4"><small class="text-muted">${details}</small></td>
                </tr>
            `;
            $tbody.append(rowHtml);
        });
    }

    function updatePaginationMeta() {
        const from = state.total === 0 ? 0 : state.offset + 1;
        const to = Math.min(state.offset + state.limit, state.total);
        $meta.text(`${from}-${to} of ${state.total} results`);
        $('#logs-prev-page').prop('disabled', state.offset <= 0);
        $('#logs-next-page').prop('disabled', state.offset + state.limit >= state.total);
    }

    function buildPayload() {
        return {
            limit: state.limit,
            offset: state.offset,
            start_date: $('#logs-start-date').val() || '',
            end_date: $('#logs-end-date').val() || '',
            action: $('#logs-action').val() || '',
            customer_id: Number($('#logs-customer-id').val() || 0),
            appointment_id: Number($('#logs-appointment-id').val() || 0),
        };
    }

    async function load() {
        const response = await App.Utils.Http.request('POST', 'logs/events', buildPayload());
        state.total = Number(response.total || 0);
        renderRows(response.items || []);
        updatePaginationMeta();
    }

    function addListeners() {
        $logsPage.on('click', '#logs-apply-filters', async () => {
            state.offset = 0;
            await load();
        });

        $logsPage.on('click', '#logs-prev-page', async () => {
            state.offset = Math.max(0, state.offset - state.limit);
            await load();
        });

        $logsPage.on('click', '#logs-next-page', async () => {
            state.offset = state.offset + state.limit;
            await load();
        });
    }

    function initialize() {
        addListeners();
        load();
    }

    return { initialize };
})();

window.addEventListener('DOMContentLoaded', () => {
    App.Pages.Logs.initialize();
});
