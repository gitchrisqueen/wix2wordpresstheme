# Scripts Module

Collection of automation and utility scripts for common operations in the Wix to WordPress conversion pipeline.

## 📁 Structure

```
scripts/
├── pipeline.sh            # Full pipeline orchestration
├── setup.sh               # Initial project setup
├── crawl.sh               # Run crawler with options
├── generate.sh            # Generate WordPress theme
├── deploy.sh              # Deploy theme to WordPress
├── test.sh                # Run test suite
├── backup.sh              # Backup outputs and data
├── clean.sh               # Clean temporary files
├── logs.sh                # Log management utilities
├── health-check.sh        # System health checks
└── utils/                 # Utility functions
    ├── colors.sh         # Terminal color codes
    ├── logging.sh        # Logging functions
    └── error-handler.sh  # Error handling utilities
```

## 🎯 Purpose

The scripts module provides:

- Command-line interfaces for all pipeline operations
- Orchestration of multi-step processes
- Error handling and recovery
- Logging and monitoring
- Cleanup and maintenance operations
- Health checks and diagnostics

## 🚀 Usage (Not Yet Implemented)

### Full Pipeline

```bash
./scripts/pipeline.sh --url https://example.wixsite.com/site
```

### Individual Operations

```bash
# Setup project
./scripts/setup.sh

# Crawl a site
./scripts/crawl.sh --url https://example.wixsite.com/site

# Generate theme
./scripts/generate.sh --input ./crawler/output

# Deploy to WordPress
./scripts/deploy.sh --theme ./theme-generator/output/my-theme

# Run tests
./scripts/test.sh --theme-name my-theme

# Backup everything
./scripts/backup.sh --all

# Clean temporary files
./scripts/clean.sh
```

## 📋 Script Details

### pipeline.sh

Orchestrates the complete conversion pipeline:

1. Validates prerequisites
2. Runs crawler
3. Generates theme
4. Deploys to WordPress
5. Runs tests
6. Generates report

### setup.sh

Initial project setup:

- Installs Node.js dependencies
- Sets up Docker environment
- Creates necessary directories
- Initializes configuration files
- Verifies system requirements

### crawl.sh

Crawler wrapper:

- Validates URL
- Configures crawler options
- Runs crawler
- Validates output
- Logs results

### generate.sh

Theme generator wrapper:

- Validates crawler output
- Configures generation options
- Runs generator
- Validates theme structure
- Logs results

### deploy.sh

Theme deployment:

- Validates theme structure
- Copies to WordPress themes directory
- Activates theme in WordPress
- Verifies deployment
- Logs results

### test.sh

Test runner:

- Sets up test environment
- Runs visual tests
- Runs DOM tests
- Runs performance tests
- Generates test report
- Logs results

### backup.sh

Backup utility:

- Backs up crawler outputs
- Backs up generated themes
- Backs up WordPress database
- Creates timestamped archives
- Logs backup status

### clean.sh

Cleanup utility:

- Removes temporary files
- Cleans old logs
- Removes old outputs
- Optimizes disk usage
- Logs cleanup status

### logs.sh

Log management:

- View logs by component
- Search logs
- Clean old logs
- Rotate logs
- Archive logs

### health-check.sh

System diagnostics:

- Check Docker status
- Check WordPress availability
- Check database connectivity
- Verify disk space
- Check dependencies
- Report system health

## 🔧 Utility Functions

### colors.sh

Terminal color utilities:

- Success messages (green)
- Error messages (red)
- Warning messages (yellow)
- Info messages (blue)
- Formatted output

### logging.sh

Logging functions:

- Log levels (ERROR, WARN, INFO, DEBUG)
- Timestamped messages
- Log file management
- Log formatting

### error-handler.sh

Error handling:

- Trap errors
- Cleanup on failure
- Error reporting
- Exit codes
- Recovery procedures

## 📝 Development Status

**Status**: Structure only - no implementation yet

**Next Steps**:

1. Implement setup.sh
2. Create utility functions
3. Implement pipeline.sh
4. Add individual operation scripts
5. Implement error handling
6. Add logging functionality
7. Create health checks
8. Add backup/restore scripts
9. Test all scripts
10. Add documentation for each script
