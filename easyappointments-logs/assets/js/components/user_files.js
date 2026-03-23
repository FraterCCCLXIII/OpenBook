/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 *
 * @package     EasyAppointments
 * @author      A.Tselegidis <alextselegidis@gmail.com>
 * @copyright   Copyright (c) Alex Tselegidis
 * @license     https://opensource.org/licenses/GPL-3.0 - GPLv3
 * @link        https://easyappointments.org
 * @since       v1.5.0
 * ---------------------------------------------------------------------------- */

/**
 * User files component.
 *
 * Handles uploads and listings for user files.
 */
App.Components.UserFiles = (function () {
    const dateUtils = App.Utils.Date;
    let uploadSequence = 0;

    function formatSize(bytes) {
        if (!Number.isFinite(bytes)) {
            return '—';
        }

        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex += 1;
        }

        const precision = unitIndex === 0 ? 0 : 1;

        return `${size.toFixed(precision)} ${units[unitIndex]}`;
    }

    function formatDate(dateValue) {
        try {
            return dateUtils.format(dateValue, vars('date_format'), vars('time_format'), true);
        } catch (error) {
            return '—';
        }
    }

    function isPdf(file) {
        if (!file) {
            return false;
        }

        if ((file.file_type || '') === 'application/pdf') {
            return true;
        }

        return (file.file_name || '').toLowerCase().endsWith('.pdf');
    }

    function renderEmptyRow($tableBody) {
        $tableBody.empty();
        $('<tr/>', {
            'html': $('<td/>', {
                'class': 'user-files-empty px-4 py-6 text-center text-slate-500',
                'colspan': 4,
                'text': 'No files uploaded.',
            }),
        }).appendTo($tableBody);
    }

    function renderRows($tableBody, files, options, $uploadRows = null) {
        $tableBody.empty();

        if (!files.length) {
            renderEmptyRow($tableBody);
        } else {
            files.forEach((file) => {
                const $row = $('<tr/>');
                const $actions = $('<div/>', {
                    'class': 'd-inline-flex align-items-center gap-2 justify-content-end',
                });

                if (isPdf(file)) {
                    $('<a/>', {
                        'class': 'btn btn-outline-secondary btn-sm',
                        'href': App.Utils.Url.siteUrl(`user_files/view/${file.id}`),
                        'target': '_blank',
                        'title': 'View PDF',
                        'html': '<i class="fas fa-eye"></i>',
                    }).appendTo($actions);
                } else {
                    $('<span/>', {
                        'class': 'btn btn-outline-secondary btn-sm disabled',
                        'title': 'PDF viewing only',
                        'html': '<i class="fas fa-eye"></i>',
                    }).appendTo($actions);
                }

                $('<a/>', {
                    'class': 'btn btn-outline-secondary btn-sm',
                    'href': App.Utils.Url.siteUrl(`user_files/download/${file.id}`),
                    'title': 'Download',
                    'html': '<i class="fas fa-download"></i>',
                }).appendTo($actions);

                if (options.canDelete) {
                    $('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-outline-danger btn-sm user-files-delete',
                        'data-file-id': file.id,
                        'title': 'Delete',
                        'html': '<i class="fas fa-trash-alt"></i>',
                    }).appendTo($actions);
                }

                $('<td/>', {
                    'class': 'px-4 py-3 text-slate-900',
                    'text': file.file_name || '—',
                }).appendTo($row);
                $('<td/>', {
                    'class': 'px-4 py-3 text-slate-600',
                    'text': formatSize(Number(file.file_size)),
                }).appendTo($row);
                $('<td/>', {
                    'class': 'px-4 py-3 text-slate-600',
                    'text': formatDate(file.create_datetime),
                }).appendTo($row);
                $('<td/>', {
                    'class': 'px-4 py-3 text-right',
                    'html': $actions,
                }).appendTo($row);

                $tableBody.append($row);
            });
        }

        if ($uploadRows && $uploadRows.length) {
            $tableBody.prepend($uploadRows);
        }
    }

    function create($panel, options) {
        const $uploadButton = $panel.find('.user-files-upload');
        const $fileInput = $panel.find('.user-files-input');
        const $tableBody = $panel.find('.user-files-body');
        const $dropzone = $panel.find('.user-files-dropzone');
        const userType = options.userType;

        const canUpload = options.canUpload;
        const canDelete = options.canDelete;
        const uploads = new Map();

        function getUserId() {
            const value = options.getUserId();
            return value ? Number(value) : 0;
        }

        function reset() {
            $fileInput.val('');
            renderEmptyRow($tableBody);
            $uploadButton.prop('disabled', !canUpload);
            $fileInput.prop('disabled', true);
        }

        function refresh() {
            const userId = getUserId();

            if (!userId) {
                reset();
                return;
            }

            $uploadButton.prop('disabled', !canUpload);
            $fileInput.prop('disabled', !canUpload);

            const $uploadRows = $tableBody.find('.user-files-uploading').detach();

            App.Http.UserFiles.list(userId, userType)
                .done((files) => {
                    renderRows($tableBody, files, { canDelete }, $uploadRows);
                })
                .fail(() => {
                    App.Layouts.Backend.displayNotification(lang('unexpected_issues'));
                });
        }

        function setDropzoneActive(active) {
            $dropzone.toggleClass('bg-slate-100 border-slate-400', active);
        }

        function handleFiles(files) {
            const userId = getUserId();

            if (!canUpload) {
                App.Layouts.Backend.displayNotification('Upload disabled. Check permissions.');
                return;
            }

            if (!userId) {
                App.Layouts.Backend.displayNotification('Select a record before uploading files.');
                return;
            }

            const fileList = Array.from(files || []);
            if (!fileList.length) {
                return;
            }

            fileList.forEach((file) => {
                startUpload(file, userId);
            });
        }

        function startUpload(file, userId) {
            uploadSequence += 1;
            const uploadId = `upload-${uploadSequence}`;

            const $progressBar = $('<div/>', {
                'class': 'h-1 rounded bg-emerald-500',
                'css': { width: '0%' },
            });
            const $progressWrap = $('<div/>', {
                'class': 'mt-2 h-1 w-full rounded bg-slate-200',
                'html': $progressBar,
            });
            const $status = $('<div/>', {
                'class': 'mt-1 text-xs text-slate-500',
                'text': 'Uploading…',
            });

            const $nameCell = $('<td/>', {
                'class': 'px-4 py-3 text-slate-900',
                'html': [
                    $('<div/>', { 'text': file.name }),
                    $progressWrap,
                    $status,
                ],
            });

            const $actions = $('<div/>', {
                'class': 'd-inline-flex align-items-center gap-2 justify-content-end',
            });
            const $cancelButton = $('<button/>', {
                'type': 'button',
                'class': 'btn btn-outline-danger btn-sm user-files-cancel',
                'data-upload-id': uploadId,
                'title': 'Cancel',
                'html': '<i class="fas fa-times"></i>',
            });
            $actions.append($cancelButton);

            const $row = $('<tr/>', {
                'class': 'user-files-uploading',
                'data-upload-id': uploadId,
                'html': [
                    $nameCell,
                    $('<td/>', {
                        'class': 'px-4 py-3 text-slate-600',
                        'text': formatSize(file.size),
                    }),
                    $('<td/>', {
                        'class': 'px-4 py-3 text-slate-600',
                        'text': 'Uploading…',
                    }),
                    $('<td/>', {
                        'class': 'px-4 py-3 text-right',
                        'html': $actions,
                    }),
                ],
            });

            $tableBody.find('.user-files-empty').remove();
            $tableBody.prepend($row);

            const xhr = App.Http.UserFiles.upload(userId, userType, file, {
                onProgress: (progress) => {
                    $progressBar.css('width', `${progress.percent}%`);
                    $status.text(`Uploading… ${progress.percent}%`);
                },
            })
                .done(() => {
                    uploads.delete(uploadId);
                    $row.remove();
                    refresh();
                })
                .fail((response) => {
                    uploads.delete(uploadId);
                    const message =
                        response?.responseJSON?.message ||
                        response?.responseText ||
                        'Upload failed.';
                    $progressBar
                        .removeClass('bg-emerald-500')
                        .addClass('bg-rose-500')
                        .css('width', '100%');
                    $status.text(`Failed: ${message}`);
                    $row.find('td').eq(2).text('Failed');
                    App.Layouts.Backend.displayNotification(message);
                })
                .always(() => {
                    $uploadButton.prop('disabled', !canUpload);
                    $fileInput.prop('disabled', !canUpload);
                });

            uploads.set(uploadId, { xhr, $row });
        }

        $uploadButton.on('click', (event) => {
            event.preventDefault();

            if ($uploadButton.prop('disabled')) {
                App.Layouts.Backend.displayNotification('Upload disabled. Check permissions.');
                return;
            }

            const userId = getUserId();

            if (!userId) {
                App.Layouts.Backend.displayNotification('Select a record before uploading files.');
                return;
            }

            const inputEl = $fileInput.get(0);
            if (inputEl) {
                inputEl.disabled = false;
                inputEl.click();
            }
        });

        $fileInput.on('change', () => {
            const files = $fileInput.prop('files');
            handleFiles(files);
            $fileInput.val('');
        });

        $panel.on('click', '.user-files-delete', (event) => {
            const fileId = Number($(event.currentTarget).data('file-id'));

            if (!fileId) {
                return;
            }

            App.Http.UserFiles.remove(fileId)
                .done(() => refresh())
                .fail(() => {
                    App.Layouts.Backend.displayNotification(lang('unexpected_issues'));
                });
        });

        $panel.on('click', '.user-files-cancel', (event) => {
            const uploadId = $(event.currentTarget).data('upload-id');
            const upload = uploads.get(uploadId);
            if (!upload) {
                return;
            }

            upload.xhr?.abort();
            upload.$row.remove();
            uploads.delete(uploadId);
        });

        $dropzone.on('dragenter dragover', (event) => {
            event.preventDefault();
            if (!canUpload) {
                return;
            }
            setDropzoneActive(true);
        });

        $dropzone.on('dragleave drop', (event) => {
            event.preventDefault();
            setDropzoneActive(false);
        });

        $dropzone.on('drop', (event) => {
            const files = event.originalEvent?.dataTransfer?.files;
            handleFiles(files);
        });

        $dropzone.on('click', (event) => {
            if ($(event.target).closest('.user-files-upload').length) {
                return;
            }
            if (!canUpload) {
                App.Layouts.Backend.displayNotification('Upload disabled. Check permissions.');
                return;
            }
            const inputEl = $fileInput.get(0);
            if (inputEl) {
                inputEl.disabled = false;
                inputEl.click();
            }
        });

        $dropzone.on('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') {
                return;
            }
            event.preventDefault();
            $dropzone.trigger('click');
        });

        return {
            refresh,
            reset,
        };
    }

    return {
        create,
    };
})();
