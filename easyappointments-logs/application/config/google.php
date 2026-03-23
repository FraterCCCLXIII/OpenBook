<?php defined('BASEPATH') or exit('No direct script access allowed');

/*
|--------------------------------------------------------------------------
| Google Calendar - Internal Configuration
|--------------------------------------------------------------------------
|
| Declare some of the global config values of the Google Calendar
| synchronization feature.
|
*/

$config['google_sync_feature'] = getenv('GOOGLE_SYNC_FEATURE') !== false ? (getenv('GOOGLE_SYNC_FEATURE') === 'true') : Config::GOOGLE_SYNC_FEATURE;

$config['google_client_id'] = getenv('GOOGLE_CLIENT_ID') ?: Config::GOOGLE_CLIENT_ID;

$config['google_client_secret'] = getenv('GOOGLE_CLIENT_SECRET') ?: Config::GOOGLE_CLIENT_SECRET;
