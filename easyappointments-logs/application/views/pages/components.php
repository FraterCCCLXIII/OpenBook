<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>
<div id="components-page" class="backend-page">
    <p class="mb-6 text-sm text-slate-600">
        This page collects the canonical UI components used across the admin experience.
    </p>

    <div class="grid gap-6 lg:grid-cols-2">
        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-medium text-slate-900">Buttons</h3>
                <span class="text-xs font-medium uppercase text-slate-400">Actions</span>
            </div>
            <div class="flex flex-wrap gap-3">
                <button class="btn btn-primary" type="button">Primary</button>
                <button class="btn btn-secondary" type="button">Secondary</button>
                <button class="btn btn-outline-secondary" type="button">Outline</button>
                <button class="btn btn-outline-primary" type="button">Ghost</button>
                <button class="btn btn-primary" type="button" disabled>Disabled</button>
            </div>
            <div class="mt-4 flex flex-wrap gap-3">
                <button class="btn btn-primary btn-sm" type="button">Small</button>
                <button class="btn btn-secondary btn-sm" type="button">Small</button>
                <button class="btn btn-primary btn-lg" type="button">Large</button>
            </div>
            <div class="mt-4">
                <div class="add-edit-delete-group btn-group">
                    <button id="edit-provider" class="btn btn-outline-secondary">
                        <svg class="svg-inline--fa fa-pen-to-square me-2" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="pen-to-square" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"></path></svg><!-- <i class="fas fa-edit me-2"></i> Font Awesome fontawesome.com -->
                        Edit                    </button>
                    <button id="delete-provider" class="btn btn-outline-secondary">
                        <svg class="svg-inline--fa fa-trash-can me-2" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="trash-can" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"></path></svg><!-- <i class="fas fa-trash-alt me-2"></i> Font Awesome fontawesome.com -->
                        Delete                    </button>
                </div>
            </div>
        </section>

        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-medium text-slate-900">Form Controls</h3>
                <span class="text-xs font-medium uppercase text-slate-400">Inputs</span>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
                <div>
                    <label class="form-label" for="components-text-input">Text Input</label>
                    <input id="components-text-input" class="form-control" placeholder="Enter text">
                </div>
                <div>
                    <label class="form-label" for="components-email-input">Email</label>
                    <input id="components-email-input" type="email" class="form-control" placeholder="name@example.com">
                </div>
                <div>
                    <label class="form-label" for="components-select">Select</label>
                    <select id="components-select" class="form-select">
                        <option>Default</option>
                        <option>Option one</option>
                        <option>Option two</option>
                    </select>
                </div>
                <div>
                    <label class="form-label" for="components-date">Date</label>
                    <input id="components-date" type="date" class="form-control">
                </div>
                <div class="md:col-span-2">
                    <label class="form-label" for="components-textarea">Textarea</label>
                    <textarea id="components-textarea" class="form-control" rows="3"
                              placeholder="Longer form content"></textarea>
                </div>
            </div>
        </section>

        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-medium text-slate-900">Selections</h3>
                <span class="text-xs font-medium uppercase text-slate-400">Toggles</span>
            </div>
            <div class="space-y-4">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="components-check">
                    <label class="form-check-label" for="components-check">Checkbox</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="components-radio" id="components-radio-1"
                           checked>
                    <label class="form-check-label" for="components-radio-1">Radio selected</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="components-radio" id="components-radio-2">
                    <label class="form-check-label" for="components-radio-2">Radio</label>
                </div>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="components-switch">
                    <label class="form-check-label" for="components-switch">Switch</label>
                </div>
            </div>
        </section>

        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-medium text-slate-900">Badges & Alerts</h3>
                <span class="text-xs font-medium uppercase text-slate-400">Status</span>
            </div>
            <div class="flex flex-wrap items-center gap-3">
                <span class="badge bg-success">Success</span>
                <span class="badge bg-warning text-dark">Warning</span>
                <span class="badge bg-danger">Danger</span>
                <span class="badge bg-info text-dark">Info</span>
                <span class="badge bg-secondary">Neutral</span>
            </div>
            <div class="mt-4 space-y-3">
                <div class="alert alert-success mb-0">Success alert with supporting text.</div>
                <div class="alert alert-warning mb-0">Warning alert with supporting text.</div>
                <div class="alert alert-danger mb-0">Danger alert with supporting text.</div>
            </div>
        </section>

        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-medium text-slate-900">Navigation</h3>
                <span class="text-xs font-medium uppercase text-slate-400">Tabs</span>
            </div>
            <div class="mb-4">
                <ul class="booking-tab-line-list" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="booking-tab-line active" type="button" role="tab" aria-selected="true">
                            Overview
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="booking-tab-line" type="button" role="tab" aria-selected="false" tabindex="-1">
                            Details
                        </button>
                    </li>
                </ul>
            </div>
            <div class="dropdown">
                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                        aria-expanded="false">
                    Dropdown
                </button>
                <div class="dropdown-menu">
                    <a class="dropdown-item" href="#">Action</a>
                    <a class="dropdown-item" href="#">Another action</a>
                    <a class="dropdown-item" href="#">Something else</a>
                </div>
            </div>
        </section>

        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 lg:col-span-2">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-medium text-slate-900">Cards & Tables</h3>
                <span class="text-xs font-medium uppercase text-slate-400">Layouts</span>
            </div>
            <div class="grid gap-4 lg:grid-cols-3">
                <div class="card border bg-white">
                    <div class="card-body">
                        <div class="text-sm text-slate-500">Card title</div>
                        <div class="text-lg font-medium text-slate-900">Primary metric</div>
                        <div class="mt-2 text-sm text-slate-600">Supporting description text.</div>
                    </div>
                </div>
                <div class="card border bg-white">
                    <div class="card-body">
                        <div class="text-sm text-slate-500">Card title</div>
                        <div class="text-lg font-medium text-slate-900">Secondary metric</div>
                        <div class="mt-2 text-sm text-slate-600">Supporting description text.</div>
                    </div>
                </div>
                <div class="card border bg-white">
                    <div class="card-body">
                        <div class="text-sm text-slate-500">Card title</div>
                        <div class="text-lg font-medium text-slate-900">Tertiary metric</div>
                        <div class="mt-2 text-sm text-slate-600">Supporting description text.</div>
                    </div>
                </div>
            </div>
            <div class="mt-4 card border bg-white">
                <div class="card-body p-0">
                    <table class="table table-hover mb-0">
                        <thead class="bg-light">
                        <tr>
                            <th class="ps-4">Name</th>
                            <th>Status</th>
                            <th class="pe-4">Updated</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td class="ps-4">Component item</td>
                            <td><span class="badge bg-success">Active</span></td>
                            <td class="pe-4 text-slate-500">Just now</td>
                        </tr>
                        <tr>
                            <td class="ps-4">Component item</td>
                            <td><span class="badge bg-warning text-dark">Paused</span></td>
                            <td class="pe-4 text-slate-500">2 hours ago</td>
                        </tr>
                        <tr>
                            <td class="ps-4">Component item</td>
                            <td><span class="badge bg-secondary">Draft</span></td>
                            <td class="pe-4 text-slate-500">Yesterday</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </div>
</div>
<?php end_section('content'); ?>
