<?php defined('BASEPATH') or exit('No direct script access allowed');

/*
|--------------------------------------------------------------------------
| App Configuration
|--------------------------------------------------------------------------
|
| Declare some of the global config values of Easy!Appointments.
|
*/

$config['version'] = '1.5.2'; // This must be changed manually.

$config['url'] = getenv('BASE_URL') ?: Config::BASE_URL;

$config['debug'] = getenv('DEBUG_MODE') !== false ? (getenv('DEBUG_MODE') === 'true') : Config::DEBUG_MODE;

$config['cache_busting_token'] = 'TSJ88';
