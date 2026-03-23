<?php defined('BASEPATH') or exit('No direct script access allowed');

/*
| -------------------------------------------------------------------------
| URI ROUTING
| -------------------------------------------------------------------------
| This file lets you re-map URI requests to specific controller functions.
|
| Typically there is a one-to-one relationship between a URL string
| and its corresponding controller class/method. The segments in a
| URL normally follow this pattern:
|
|	example.com/class/method/id/
|
| In some instances, however, you may want to remap this relationship
| so that a different class/function is called than the one
| corresponding to the URL.
|
| Please see the user guide for complete details:
|
|	https://codeigniter.com/userguide3/general/routing.html
|
| -------------------------------------------------------------------------
| RESERVED ROUTES
| -------------------------------------------------------------------------
|
| There are three reserved routes:
|
|	$route['default_controller'] = 'welcome';
|
| This route indicates which controller class should be loaded if the
| URI contains no data. In the above example, the "welcome" class
| would be loaded.
|
|	$route['404_override'] = 'errors/page_missing';
|
| This route will tell the Router which controller/method to use if those
| provided in the URL cannot be matched to a valid route.
|
|	$route['translate_uri_dashes'] = FALSE;
|
| This is not exactly a route, but allows you to automatically route
| controller and method names that contain dashes. '-' isn't a valid
| class or method name character, so it requires translation.
| When you set this option to TRUE, it will replace ALL dashes with
| underscores in the controller and method URI segments.
|
| Examples:	my-controller/index	-> my_controller/index
|		my-controller/my-method	-> my_controller/my_method
*/

require_once __DIR__ . '/../helpers/routes_helper.php';

$route['default_controller'] = 'booking';

$route['404_override'] = '';

$route['translate_uri_dashes'] = FALSE;

/*
| -------------------------------------------------------------------------
| FRAME OPTIONS HEADERS
| -------------------------------------------------------------------------
| Set the appropriate headers so that iframe control and permissions are 
| properly configured.
|
| Enable this if you want to disable use of Easy!Appointments within an 
| iframe.
|
| Options:
|
|   - DENY 
|   - SAMEORIGIN 
|
*/

// header('X-Frame-Options: SAMEORIGIN');

/*
| -------------------------------------------------------------------------
| CORS HEADERS
| -------------------------------------------------------------------------
| Set the appropriate headers so that CORS requirements are met and any 
| incoming preflight options request succeeds. 
|
*/

header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*')); // NOTICE: Change this header to restrict CORS access.

header('Access-Control-Allow-Credentials: "true"');

if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
{
    // May also be using PUT, PATCH, HEAD etc
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
}

if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
{
    header('Access-Control-Allow-Headers: ' . $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']);
}

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS')
{
    exit(0);
}

/*
| -------------------------------------------------------------------------
| REST API ROUTING
| -------------------------------------------------------------------------
| Define the API resource routes using the routing helper function. By 
| default, each resource will have by default the following actions: 
| 
|   - index [GET]
|
|   - show/:id [GET]
|
|   - store [POST]
|
|   - update [PUT]
|
|   - destroy [DELETE]
|
| Some resources like the availabilities and the settings do not follow this 
| pattern and are explicitly defined. 
|
*/

route_api_resource($route, 'appointments', 'api/v1/');

route_api_resource($route, 'admins', 'api/v1/');

route_api_resource($route, 'service_categories', 'api/v1/');

route_api_resource($route, 'customers', 'api/v1/');

route_api_resource($route, 'providers', 'api/v1/');

route_api_resource($route, 'secretaries', 'api/v1/');

route_api_resource($route, 'services', 'api/v1/');

route_api_resource($route, 'unavailabilities', 'api/v1/');

route_api_resource($route, 'webhooks', 'api/v1/');

route_api_resource($route, 'blocked_periods', 'api/v1/');

$route['api/v1/settings']['get'] = 'api/v1/settings_api_v1/index';

$route['api/v1/settings/(:any)']['get'] = 'api/v1/settings_api_v1/show/$1';

$route['api/v1/settings/(:any)']['put'] = 'api/v1/settings_api_v1/update/$1';

$route['api/v1/availabilities']['get'] = 'api/v1/availabilities_api_v1/get';

/*
| -------------------------------------------------------------------------
| CUSTOM ROUTING
| -------------------------------------------------------------------------
| You can add custom routes to the following section to define URL patterns
| that are later mapped to the available controllers in the filesystem. 
|
*/

$route['customer/login'] = 'customer_auth/login';
$route['customer/authenticate'] = 'customer_auth/authenticate';
$route['customer/register'] = 'customer_auth/register';
$route['customer/request_otp'] = 'customer_auth/request_otp';
$route['customer/verify_otp'] = 'customer_auth/verify_otp';
$route['customer/create_password'] = 'customer_auth/create_password';
$route['customer/save_password'] = 'customer_auth/save_password';
$route['customer/logout'] = 'customer_auth/logout';
$route['customer/account'] = 'customer_account/index';
$route['customer/account/update'] = 'customer_account/update_profile';
$route['customer/account/email'] = 'customer_account/update_email';
$route['customer/account/password'] = 'customer_account/update_password';
$route['customer/account/email/otp_request'] = 'customer_account/request_email_change_otp';
$route['customer/account/email/otp_confirm'] = 'customer_account/confirm_email_change_otp';
$route['customer/account/password/otp_request'] = 'customer_account/request_password_change_otp';
$route['customer/account/password/otp_confirm'] = 'customer_account/confirm_password_change_otp';
$route['customer/bookings'] = 'customer_bookings/index';
$route['customer/forms'] = 'customer_forms/index';
$route['customer/forms/list'] = 'customer_forms/list';
$route['customer/forms/find'] = 'customer_forms/find';
$route['customer/forms/submit'] = 'customer_forms/submit';
$route['customer/forms/(:any)'] = 'customer_forms/view/$1';

$route['provider/bookings'] = 'provider_bookings/index';
$route['provider/bookings/(:num)'] = 'provider_bookings/view/$1';

$route['forms_settings/create'] = 'forms_settings/create';
$route['forms_settings/view/(:num)'] = 'forms_settings/view/$1';
$route['forms/user/(:any)/(:num)/(:num)'] = 'forms/view_user/$1/$2/$3';
$route['forms/list_for_record'] = 'forms/list_for_record';
$route['forms/find_for_record'] = 'forms/find_for_record';
$route['forms/reset_submission'] = 'forms/reset_submission';

$route['account/forms'] = 'account/forms';
$route['account/forms/(:num)'] = 'account/form/$1';

$route['admins/profile/(:any)'] = 'admins/index/$1';
$route['providers/profile/(:any)'] = 'providers/index/$1';
$route['secretaries/profile/(:any)'] = 'secretaries/index/$1';
$route['customers/profile/(:any)'] = 'customers/index/$1';

/* End of file routes.php */
/* Location: ./application/config/routes.php */
