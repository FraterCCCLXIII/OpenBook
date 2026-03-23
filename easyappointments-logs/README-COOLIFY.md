# Deploying Easy!Appointments on Coolify

This branch contains modifications to make Easy!Appointments ready for deployment on [Coolify](https://coolify.io/).

## Features

- **Environment Variable Support**: Configure your database and app settings directly from the Coolify dashboard.
- **Optimized Docker Image**: A single Docker image containing both PHP-FPM and Nginx, managed by Supervisor.
- **Automatic Configuration**: `config.php` is automatically created if it doesn't exist.

## Deployment Steps

1.  In Coolify, create a new **Service** or **Application**.
2.  Point it to this repository and branch (`feature/coolify-support`).
3.  Choose **Docker Compose** as the build pack.
4.  Coolify should automatically detect `docker-compose.coolify.yml`. If not, specify it in the configuration.
5.  Set the following environment variables in Coolify:

| Variable | Description | Default |
| --- | --- | --- |
| `BASE_URL` | The full URL of your installation (no trailing slash) | `http://localhost` |
| `DB_HOST` | Database host (use `db` if using the included service) | `db` |
| `DB_NAME` | Database name | `easyappointments` |
| `DB_USERNAME` | Database username | `user` |
| `DB_PASSWORD` | Database password | `password` |
| `DEBUG_MODE` | Enable debug mode (`true` or `false`) | `false` |
| `LANGUAGE` | Default language | `english` |
| `GOOGLE_SYNC_FEATURE` | Enable Google Calendar Sync (`true` or `false`) | `false` |
| `GOOGLE_CLIENT_ID` | Google Client ID | |
| `GOOGLE_CLIENT_SECRET`| Google Client Secret | |

## Persistent Data

The following volumes are defined for persistent data:

- `storage_data`: Stores logs, sessions, cache, and uploads (`/var/www/html/storage`).
- `db_data`: Stores the MySQL database data (`/var/lib/mysql`).

## Notes

- If you are using an external database, you can remove the `db` service from the Docker Compose file and update the `DB_*` environment variables accordingly.
- The first time you visit the `BASE_URL`, you may need to complete the installation wizard if the database is empty.
