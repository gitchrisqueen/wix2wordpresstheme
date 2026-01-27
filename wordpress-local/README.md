# WordPress Local Environment

This directory contains the Docker-based local WordPress environment for theme development and testing.

## 📁 Structure

```
wordpress-local/
├── docker-compose.yml    # Docker services configuration
├── wordpress/           # WordPress installation (auto-generated)
├── themes/              # Converted themes directory
├── plugins/             # Custom plugins directory
├── data/                # MySQL database (persistent storage)
├── config/              # Configuration files
│   └── php.ini         # PHP configuration
└── scripts/             # Utility scripts
```

## 🚀 Quick Start

### Start WordPress Environment

```bash
# From project root
npm run docker:up

# Or directly
docker-compose up -d
```

### Access Services

- **WordPress**: http://localhost:8080
- **PHPMyAdmin**: http://localhost:8081

### Default Credentials

- **Database Name**: wordpress
- **Database User**: wordpress
- **Database Password**: wordpress
- **Database Root Password**: rootpassword

## 🛠️ Management

### Stop Services

```bash
npm run docker:down
```

### View Logs

```bash
npm run docker:logs
```

### Reset Environment

```bash
npm run docker:reset
```

### Backup Database

```bash
docker exec wix2wp-mysql mysqldump -u wordpress -pwordpress wordpress > backup.sql
```

### Restore Database

```bash
docker exec -i wix2wp-mysql mysql -u wordpress -pwordpress wordpress < backup.sql
```

## 📦 Services

### WordPress

- **Image**: wordpress:latest
- **Port**: 8080
- **Container Name**: wix2wp-wordpress

### MySQL

- **Image**: mysql:8.0
- **Port**: 3306 (internal)
- **Container Name**: wix2wp-mysql

### PHPMyAdmin

- **Image**: phpmyadmin:latest
- **Port**: 8081
- **Container Name**: wix2wp-phpmyadmin

## 🔧 Configuration

### PHP Settings

Modify `config/php.ini` to adjust:

- Upload size limits
- Memory limits
- Execution timeouts

### WordPress Settings

WordPress configuration is set via environment variables in `docker-compose.yml`.

## 📝 Notes

- All data is persisted in the `data/` directory
- Converted themes are mounted to `themes/` directory
- WordPress debug mode is enabled by default
- The `.gitignore` excludes auto-generated directories
