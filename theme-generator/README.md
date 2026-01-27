# Theme Generator Module

Converts crawled Wix site data into a WordPress-compatible theme with proper structure and hooks.

## 📁 Structure

```
theme-generator/
├── src/                      # Source code (to be implemented)
│   ├── generator.ts         # Main theme generator
│   ├── template-builder.ts  # Build PHP templates
│   ├── style-converter.ts   # Convert CSS to WP styles
│   ├── asset-optimizer.ts   # Optimize and organize assets
│   ├── functions-builder.ts # Generate functions.php
│   └── templates/           # Theme templates
│       ├── style.css.hbs   # Theme stylesheet template
│       ├── functions.php.hbs # Functions template
│       ├── header.php.hbs  # Header template
│       ├── footer.php.hbs  # Footer template
│       └── page.php.hbs    # Page template
├── output/                   # Generated themes (generated)
├── config.json              # Generator configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## 🎯 Purpose

The theme generator module is responsible for:
- Loading crawled Wix site data
- Analyzing structure and creating theme plan
- Generating WordPress theme file structure
- Converting styles to WordPress-compatible format
- Optimizing assets (compress images, minify CSS/JS)
- Creating theme metadata and configuration
- Packaging theme for WordPress installation

## 🚀 Usage (Not Yet Implemented)

```bash
# From project root
npm run generate-theme -- --input ./crawler/output

# With options
npm run generate-theme -- \
  --input ./crawler/output \
  --output ./theme-generator/output \
  --theme-name "My Converted Theme" \
  --optimize true
```

## ⚙️ Configuration

The `config.json` file will contain:
- Theme metadata (name, author, version)
- Template options (which templates to generate)
- Asset optimization settings
- Style conversion rules

## 📤 Output Format

The generator will output a complete WordPress theme:
```
output/my-theme/
├── style.css              # Theme metadata and styles
├── functions.php          # Theme setup and hooks
├── header.php             # Header template
├── footer.php             # Footer template
├── index.php              # Main template
├── page.php               # Page template
├── single.php             # Single post template
├── screenshot.png         # Theme screenshot
├── assets/
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   ├── images/           # Optimized images
│   └── fonts/            # Web fonts
├── inc/                   # Include files
│   ├── customizer.php    # Theme customizer
│   └── template-tags.php # Helper functions
├── template-parts/        # Reusable template parts
└── languages/             # Translation files
```

## 🔧 Technologies

- **TypeScript**: Type-safe development
- **Node.js**: Runtime environment
- **Handlebars/EJS**: Template engine
- **Sharp**: Image optimization
- **PostCSS**: CSS processing

## 📝 Development Status

**Status**: Structure only - no implementation yet

**Next Steps**:
1. Install dependencies
2. Create template files
3. Implement theme structure generator
4. Add style conversion logic
5. Implement asset optimization
6. Create functions.php builder
7. Add theme metadata generation
8. Implement packaging system
