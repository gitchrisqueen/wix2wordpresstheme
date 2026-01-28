# WordPress Environment for Wix2WP Conversion

Automated local WordPress environment with one-command setup and provisioning.

## 🚀 Designer Quick Start

```bash
# Start WordPress and auto-provision
npm run dev

# Open in browser
open http://localhost:8080

# Edit theme files
cd theme/output/<your-theme>
# Make changes and refresh browser

# Run verification when ready
npm run verify -- --baseUrl https://yourwixsite.com --wpUrl http://localhost:8080
```

## 📋 Commands

### Development Workflow

```bash
# Start WordPress with auto-provisioning
npm run dev

# Stop WordPress
npm run wp:down

# View logs
npm run wp:logs

# Reset everything (clean slate)
npm run wp:reset
```

### Manual Commands

```bash
# Start services only (no auto-provision)
npm run wp:up

# Restart setup service
docker compose -f wp-env/docker-compose.yml restart setup

# View setup logs
cat wp-env/logs/setup.log
```

## 🎯 What `npm run dev` Does

1. **Starts Docker services**: MariaDB, WordPress, PHPMyAdmin
2. **Waits for readiness**: Health checks ensure services are ready
3. **Auto-provisions WordPress**:
   - Installs WordPress if not already installed
   - Activates your generated theme
   - Creates pages from `page-mapping.json`
   - Sets up navigation menu
   - Configures permalinks
4. **Prints access URLs**: WordPress and admin panel

Everything is **idempotent** - safe to run multiple times.

## 📁 Directory Structure

```
wp-env/
├── docker-compose.yml     # Service definitions
├── .env.example          # Configuration template
├── scripts/
│   └── provision.sh      # Auto-provisioning script
└── logs/
    └── setup.log         # Provisioning log
```

## 🔧 Configuration

Copy `.env.example` to `.env` to customize:

```bash
cp wp-env/.env.example wp-env/.env
```

### Key Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `WP_URL` | `http://localhost:8080` | WordPress URL |
| `WP_ADMIN_USER` | `admin` | Admin username |
| `WP_ADMIN_PASS` | `password` | Admin password |
| `THEME_NAME` | `wix2wp` | Theme slug to activate |
| `WORDPRESS_PORT` | `8080` | WordPress port |
| `PHPMYADMIN_PORT` | `8081` | PHPMyAdmin port |

## 🌐 Access Points

- **WordPress**: http://localhost:8080
- **Admin Panel**: http://localhost:8080/wp-admin
- **PHPMyAdmin**: http://localhost:8081

### Default Credentials

- **Username**: admin
- **Password**: password
- **Database**: wordpress / wordpress

## 🔍 Troubleshooting

### WordPress not starting

```bash
# Check service status
docker compose -f wp-env/docker-compose.yml ps

# View logs
npm run wp:logs

# Check specific service
docker logs wix2wp-wordpress
docker logs wix2wp-db
```

### Theme not activating

1. Check theme exists:
   ```bash
   ls -la theme/output/<your-theme>
   ```

2. Check theme name in `.env`:
   ```bash
   grep THEME_NAME wp-env/.env
   ```

3. View setup logs:
   ```bash
   cat wp-env/logs/setup.log
   ```

### Port already in use

```bash
# Change port in .env
echo "WORDPRESS_PORT=8090" >> wp-env/.env

# Restart
npm run wp:down
npm run dev
```

### Reset everything

```bash
# Nuclear option: delete all data and start fresh
npm run wp:reset
```

This removes:
- All WordPress data
- All database data
- All provisioning state

## 🏗️ Architecture

```
┌─────────────┐
│   npm run   │
│     dev     │
└──────┬──────┘
       │
       ├─► docker compose up
       │   ├─► db (MariaDB)
       │   ├─► wordpress (Apache + PHP)
       │   └─► phpmyadmin
       │
       └─► setup service (WP-CLI)
           ├─► Wait for WordPress ready
           ├─► Install WordPress (if needed)
           ├─► Activate theme
           ├─► Create pages
           ├─► Setup menu
           └─► Store version
```

## 📦 Services

### db (MariaDB)
- Image: `mariadb:10.11`
- Port: 3306 (internal)
- Volume: `db-data`
- Health check: MySQL ping

### wordpress
- Image: `wordpress:latest`
- Port: 8080 (external)
- Volume: `wordpress-data`
- Mounts: `theme/output` (read-only)
- Health check: HTTP /wp-admin/install.php

### setup (WP-CLI)
- Image: `wordpress:cli`
- Runs: `scripts/provision.sh`
- One-shot: exits after provisioning
- Logs: `logs/setup.log`

### phpmyadmin
- Image: `phpmyadmin:latest`
- Port: 8081 (external)
- Optional: for database management

## 🔐 Security Notes

- **Production Warning**: Default credentials are for local development only
- Change passwords in `.env` for any non-local use
- Database is not exposed externally
- WordPress debug mode is enabled by default

## 🚀 Next Steps

After WordPress is running:

1. **Edit theme files** in `theme/output/<theme-name>`
2. **Refresh browser** to see changes
3. **Run verification**: `npm run verify` to compare with Wix site
4. **Iterate**: Make adjustments based on verification report

## 📚 Related Documentation

- [Main README](../README.md) - Full project documentation
- [RUNBOOK](../RUNBOOK.md) - Operational procedures
- [Verification Guide](../docs/verification.md) - How to use verification tool
