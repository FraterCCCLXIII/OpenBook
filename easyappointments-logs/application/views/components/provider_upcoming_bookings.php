<?php $groups = vars('upcoming_groups', []); ?>

<div class="rounded-xl border border-border bg-white card-shadow">
    <div class="border-b border-border px-4 py-3">
        <h3 class="text-sm font-semibold text-foreground">Upcoming</h3>
    </div>
    <div class="max-h-[400px] overflow-y-auto">
        <div class="divide-y divide-border">
            <?php if (empty($groups)): ?>
                <div class="p-4 text-sm text-muted-foreground">
                    No upcoming bookings.
                </div>
            <?php else: ?>
                <?php foreach ($groups as $group): ?>
                    <div class="pt-3 pb-0">
                        <div class="pb-2 mb-0 border-b border-border -mx-3 px-4">
                            <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                <?= e($group['label']) ?>
                            </p>
                        </div>
                        <div class="divide-y divide-border">
                            <?php foreach ($group['items'] as $item): ?>
                                <?php
                                    $time = format_time($item['start_datetime']);
                                    $has_customer = !empty($item['customer_name']);
                                    $dot_class = $item['type'] === 'unavailability'
                                        ? 'bg-muted-foreground'
                                        : 'bg-primary';
                                    $aria_label = $item['title'] . ' at ' . $time;
                                    if ($has_customer) {
                                        $aria_label .= ' with ' . $item['customer_name'];
                                    }
                                    $is_appointment = $item['type'] === 'appointment';
                                    $item_href = $is_appointment ? site_url('provider/bookings/' . $item['id']) : null;
                                ?>
                                <?php if ($is_appointment): ?>
                                    <a class="group flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent"
                                       href="<?= e($item_href) ?>"
                                       aria-label="<?= e($aria_label) ?>">
                                <?php else: ?>
                                    <div class="group flex w-full items-start gap-3 rounded-lg p-2 text-left">
                                <?php endif; ?>
                                    <div class="mt-0.5 h-2 w-2 rounded-full <?= $dot_class ?>"></div>
                                    <div class="flex-1 min-w-0">
                                        <p class="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                            <?= e($item['title']) ?>
                                        </p>
                                        <div class="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                            <span class="flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                                                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                     class="lucide lucide-clock h-2 w-2">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <polyline points="12 6 12 12 16 14"></polyline>
                                                </svg>
                                                <?= e($time) ?>
                                            </span>
                                            <?php if ($has_customer): ?>
                                                <span class="flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                                                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                         class="lucide lucide-user h-2 w-2">
                                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                                        <circle cx="12" cy="7" r="4"></circle>
                                                    </svg>
                                                    <?= e($item['customer_name']) ?>
                                                </span>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                <?php if ($is_appointment): ?>
                                    </a>
                                <?php else: ?>
                                    </div>
                                <?php endif; ?>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
</div>
