# RUNBOOK - Wix to WordPress Theme Converter

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup](#installation--setup)
4. [Running the Pipeline](#running-the-pipeline)
5. [Troubleshooting](#troubleshooting)
6. [Monitoring & Logging](#monitoring--logging)
7. [Maintenance](#maintenance)
8. [Emergency Procedures](#emergency-procedures)

## System Overview

The Wix to WordPress Theme Converter is a pipeline system consisting of four main stages:
1. **Crawling** - Extract data from Wix site
2. **Generation** - Convert to WordPress theme
3. **Deployment** - Install in local WordPress
4. **Testing** - Validate conversion quality

## Prerequisites

### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Docker**: v20.0.0 or higher
- **Docker Compose**: v2.0.0 or higher

### System Requirements
- **RAM**: Minimum 4GB, recommended 8GB
- **Disk Space**: Minimum 10GB free
- **Network**: Stable internet connection for crawling

### Verify Installation
```bash
node --version
npm --version
docker --version
docker-compose --version
```

## Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/gitchrisqueen/wix2wordpresstheme.git
cd wix2wordpresstheme
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start WordPress Environment
```bash
npm run docker:up
```

### 5. Verify Setup
```bash
npm run health-check
```

## Running the Pipeline

### Full Pipeline (Recommended)
```bash
npm run pipeline -- --url https://example.wixsite.com/site
```

### Step-by-Step Execution

#### Step 1: Crawl Wix Site
```bash
npm run crawl -- --url https://example.wixsite.com/site --output ./crawler/output
```

**Expected Output:**
- JSON files with page structure
- Downloaded assets (images, CSS, JS)
- Screenshots of each page

#### Step 2: Generate WordPress Theme
```bash
npm run generate-theme -- --input ./crawler/output --output ./theme-generator/output
```

**Expected Output:**
- WordPress theme directory structure
- style.css with theme metadata
- Template files (header.php, footer.php, etc.)
- Assets directory with optimized resources

#### Step 3: Deploy to Local WordPress
```bash
npm run deploy-theme -- --theme ./theme-generator/output
```

**Expected Output:**
- Theme copied to WordPress themes directory
- Theme activated
- WordPress restarted

#### Step 4: Run Tests
```bash
npm run test -- --theme-name converted-wix-theme
```

**Expected Output:**
- Visual comparison results
- DOM structure validation
- Test report in HTML format

## Troubleshooting

### Common Issues

#### Crawler Fails to Connect
**Symptoms:** Timeout errors, connection refused
**Solutions:**
1. Check internet connection
2. Verify Wix site is accessible
3. Check for rate limiting
4. Review crawler logs: `logs/crawler-[timestamp].log`

```bash
# Check crawler logs
tail -f logs/crawler-*.log
```

#### Docker Container Won't Start
**Symptoms:** Port already in use, container exits immediately
**Solutions:**
1. Check port availability:
   ```bash
   lsof -i :8080
   ```
2. Stop conflicting containers:
   ```bash
   docker-compose down
   docker ps -a
   ```
3. Reset Docker environment:
   ```bash
   npm run docker:reset
   ```

#### Theme Generation Fails
**Symptoms:** Incomplete theme, missing files
**Solutions:**
1. Verify crawler output exists
2. Check crawler output format
3. Review generator logs: `logs/generator-[timestamp].log`
4. Re-run with verbose logging:
   ```bash
   npm run generate-theme -- --verbose
   ```

#### Tests Fail
**Symptoms:** Visual differences, DOM mismatches
**Solutions:**
1. Check baseline images exist
2. Update baseline if intentional change:
   ```bash
   npm run test:update-baseline
   ```
3. Review test screenshots in `tests/visual/screenshots/`
4. Check test logs: `logs/test-[timestamp].log`

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| E001 | Crawler connection failed | Check URL and network |
| E002 | Invalid crawler output | Re-run crawler |
| E003 | Theme generation failed | Check crawler data |
| E004 | WordPress deployment failed | Check Docker status |
| E005 | Test execution failed | Review test logs |

## Monitoring & Logging

### Log Locations
- **Crawler**: `logs/crawler-[timestamp].log`
- **Generator**: `logs/generator-[timestamp].log`
- **WordPress**: `logs/wordpress-[timestamp].log`
- **Tests**: `logs/test-[timestamp].log`

### Log Levels
- **ERROR**: Critical failures
- **WARN**: Potential issues
- **INFO**: Normal operations
- **DEBUG**: Detailed diagnostics

### Viewing Logs
```bash
# Tail all logs
npm run logs:tail

# View specific component
npm run logs:view -- --component crawler

# Search logs
npm run logs:search -- --pattern "error"
```

### Health Checks
```bash
# Check all components
npm run health-check

# Check specific component
npm run health-check -- --component wordpress
```

## Maintenance

### Regular Tasks

#### Daily
- Review error logs
- Monitor disk space

#### Weekly
- Update dependencies:
  ```bash
  npm update
  ```
- Clean old logs:
  ```bash
  npm run logs:clean
  ```

#### Monthly
- Update Docker images:
  ```bash
  docker-compose pull
  ```
- Review and archive outputs:
  ```bash
  npm run archive-outputs
  ```

### Backup Procedures
```bash
# Backup crawler outputs
npm run backup -- --component crawler

# Backup generated themes
npm run backup -- --component themes

# Full backup
npm run backup:full
```

## Emergency Procedures

### Complete System Reset
```bash
# Stop all services
npm run docker:down

# Clean all data
npm run clean:all

# Reinstall
npm install

# Restart
npm run docker:up
```

### Rollback Last Operation
```bash
# View recent operations
npm run history

# Rollback specific operation
npm run rollback -- --operation [ID]
```

### Contact & Escalation
For critical issues:
1. Check GitHub Issues
2. Review documentation
3. Contact maintainers

## Performance Tuning

### Crawler Performance
- Adjust concurrent requests in `crawler/config.json`
- Modify timeout settings
- Enable/disable headless mode

### Docker Performance
- Adjust memory limits in `docker-compose.yml`
- Configure volume mounts
- Optimize image caching

### Testing Performance
- Run tests in parallel
- Adjust screenshot comparison threshold
- Skip non-critical tests

## Appendix

### Useful Commands Cheatsheet
```bash
# Full pipeline
npm run pipeline -- --url [URL]

# Individual steps
npm run crawl -- --url [URL]
npm run generate-theme
npm run deploy-theme
npm run test

# Docker operations
npm run docker:up
npm run docker:down
npm run docker:logs
npm run docker:reset

# Maintenance
npm run logs:clean
npm run clean:all
npm run health-check
```

### Configuration Files
- `.env` - Environment variables
- `crawler/config.json` - Crawler settings
- `theme-generator/config.json` - Generator settings
- `docker-compose.yml` - Docker configuration
- `tests/config.json` - Test settings
