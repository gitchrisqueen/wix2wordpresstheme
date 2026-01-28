#!/bin/sh
# WordPress Provisioning Script
# This script uses WP-CLI to automatically set up WordPress
# It is idempotent and safe to run multiple times

set -e

LOG_FILE="/logs/setup.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() {
  echo "[${TIMESTAMP}] $1" | tee -a "$LOG_FILE"
}

log "=== WordPress Provisioning Started ==="
log "Setup Version: ${WP_SETUP_VERSION:-1.0.0}"

# Wait for WordPress files to be ready
log "Waiting for WordPress files..."
max_attempts=30
attempt=0
while [ ! -f /var/www/html/wp-config-sample.php ] && [ $attempt -lt $max_attempts ]; do
  attempt=$((attempt + 1))
  log "Attempt $attempt/$max_attempts: WordPress files not ready yet..."
  sleep 2
done

if [ ! -f /var/www/html/wp-config-sample.php ]; then
  log "ERROR: WordPress files not found after $max_attempts attempts"
  exit 1
fi

log "WordPress files are ready"

# Navigate to WordPress directory
cd /var/www/html

# Check if WordPress is already installed
log "Checking if WordPress is installed..."
if wp core is-installed 2>/dev/null; then
  log "WordPress is already installed"
  ALREADY_INSTALLED=true
else
  log "WordPress is not installed, proceeding with installation..."
  ALREADY_INSTALLED=false
fi

# Install WordPress if not already installed
if [ "$ALREADY_INSTALLED" = false ]; then
  log "Installing WordPress..."
  wp core install \
    --url="${WP_URL}" \
    --title="${WP_TITLE}" \
    --admin_user="${WP_ADMIN_USER}" \
    --admin_password="${WP_ADMIN_PASS}" \
    --admin_email="${WP_ADMIN_EMAIL}" \
    --skip-email \
    2>&1 | tee -a "$LOG_FILE"
  
  if [ $? -eq 0 ]; then
    log "✓ WordPress installed successfully"
  else
    log "ERROR: WordPress installation failed"
    exit 1
  fi
else
  log "Skipping WordPress installation (already installed)"
fi

# Find and activate theme
log "Looking for theme: ${THEME_NAME}"

# Check in converted-themes directory first
THEME_DIR="/var/www/html/wp-content/themes/converted-themes/${THEME_NAME}"
if [ -d "$THEME_DIR" ]; then
  log "Found theme at: $THEME_DIR"
  
  # Create symlink if it doesn't exist
  SYMLINK_PATH="/var/www/html/wp-content/themes/${THEME_NAME}"
  if [ ! -L "$SYMLINK_PATH" ] && [ ! -d "$SYMLINK_PATH" ]; then
    log "Creating symlink from converted-themes to themes directory..."
    ln -s "$THEME_DIR" "$SYMLINK_PATH" 2>&1 | tee -a "$LOG_FILE"
  fi
  
  # Activate theme
  log "Activating theme: ${THEME_NAME}..."
  if wp theme activate "${THEME_NAME}" 2>&1 | tee -a "$LOG_FILE"; then
    log "✓ Theme activated successfully"
  else
    log "WARNING: Could not activate theme ${THEME_NAME}"
  fi
else
  log "WARNING: Theme not found at ${THEME_DIR}"
  log "Theme directory contents:"
  ls -la /var/www/html/wp-content/themes/converted-themes/ 2>&1 | tee -a "$LOG_FILE" || log "Converted themes directory not found"
fi

# Load page-mapping.json if it exists
PAGE_MAPPING_FILE="/theme-output/${THEME_NAME}/.generated/page-mapping.json"
if [ -f "$PAGE_MAPPING_FILE" ]; then
  log "Found page-mapping.json, creating pages..."
  
  # Read page mappings and create pages
  # Note: This is a simplified version. In production, you'd want to parse JSON properly
  # For now, we'll use wp-cli to create placeholder pages
  
  log "Creating pages from page-mapping.json..."
  
  # Get list of pages from manifest if available
  MANIFEST_FILE="/crawler-output/manifest.json"
  if [ -f "$MANIFEST_FILE" ]; then
    log "Manifest found, will create pages based on discovered URLs"
    # This would require jq or similar JSON parsing, for now we'll skip detailed parsing
    log "Note: Detailed page creation from manifest requires JSON parsing (jq)"
  fi
  
  # Create a sample home page if none exists
  HOME_PAGE_ID=$(wp post list --post_type=page --name=home --field=ID --format=csv 2>/dev/null || echo "")
  if [ -z "$HOME_PAGE_ID" ]; then
    log "Creating home page..."
    HOME_PAGE_ID=$(wp post create --post_type=page --post_title="Home" --post_name=home --post_status=publish --post_content="<!-- wp:paragraph --><p>Welcome to your converted Wix site!</p><!-- /wp:paragraph -->" --porcelain 2>&1 | tee -a "$LOG_FILE")
    
    if [ -n "$HOME_PAGE_ID" ] && [ "$HOME_PAGE_ID" != "0" ]; then
      log "✓ Home page created with ID: $HOME_PAGE_ID"
      
      # Set as front page
      wp option update show_on_front page 2>&1 | tee -a "$LOG_FILE"
      wp option update page_on_front "$HOME_PAGE_ID" 2>&1 | tee -a "$LOG_FILE"
      log "✓ Home page set as front page"
    else
      log "WARNING: Could not create home page"
    fi
  else
    log "Home page already exists (ID: $HOME_PAGE_ID)"
  fi
  
else
  log "No page-mapping.json found at ${PAGE_MAPPING_FILE}"
fi

# Create and assign primary menu
log "Checking for primary menu..."
MENU_ID=$(wp menu list --format=csv --fields=term_id,name 2>/dev/null | grep "Primary" | cut -d',' -f1 || echo "")

if [ -z "$MENU_ID" ]; then
  log "Creating primary menu..."
  MENU_ID=$(wp menu create "Primary Menu" --porcelain 2>&1 | tee -a "$LOG_FILE")
  
  if [ -n "$MENU_ID" ] && [ "$MENU_ID" != "0" ]; then
    log "✓ Primary menu created with ID: $MENU_ID"
    
    # Add home page to menu if it exists
    HOME_PAGE_ID=$(wp post list --post_type=page --name=home --field=ID --format=csv 2>/dev/null || echo "")
    if [ -n "$HOME_PAGE_ID" ]; then
      wp menu item add-post "$MENU_ID" "$HOME_PAGE_ID" 2>&1 | tee -a "$LOG_FILE"
      log "✓ Added home page to menu"
    fi
    
    # Assign menu to primary location
    wp menu location assign "$MENU_ID" primary 2>&1 | tee -a "$LOG_FILE" || log "Note: primary location might not be registered by theme"
  else
    log "WARNING: Could not create menu"
  fi
else
  log "Primary menu already exists (ID: $MENU_ID)"
fi

# Store provisioning version
log "Updating provisioning version..."
wp option update wix2wp_setup_version "${WP_SETUP_VERSION}" 2>&1 | tee -a "$LOG_FILE"
wp option update wix2wp_setup_timestamp "$(date '+%Y-%m-%d %H:%M:%S')" 2>&1 | tee -a "$LOG_FILE"

log "✓ Provisioning version stored"

# Set permalink structure
log "Setting permalink structure..."
wp rewrite structure '/%postname%/' 2>&1 | tee -a "$LOG_FILE"
wp rewrite flush 2>&1 | tee -a "$LOG_FILE"
log "✓ Permalinks configured"

log "=== WordPress Provisioning Completed ==="
log "WordPress URL: ${WP_URL}"
log "Admin URL: ${WP_URL}/wp-admin"
log "Username: ${WP_ADMIN_USER}"
log "Theme: ${THEME_NAME}"
log ""
log "You can now open ${WP_URL} in your browser"
log "Logs are available at: /logs/setup.log"

exit 0
