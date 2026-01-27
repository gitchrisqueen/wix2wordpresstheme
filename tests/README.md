# Tests Module

Comprehensive testing suite for validating theme conversion quality through visual regression, DOM structure, and functional testing.

## 📁 Structure

```
tests/
├── visual/                           # Visual regression tests
│   ├── visual-regression.test.ts    # Visual comparison tests
│   ├── baseline/                    # Baseline screenshots
│   ├── current/                     # Current screenshots
│   ├── diff/                        # Difference images
│   ├── reports/                     # Test reports
│   └── config.json                  # Visual test configuration
├── dom/                              # DOM structure tests
│   ├── structure.test.ts            # DOM hierarchy tests
│   ├── functionality.test.ts        # Interactive element tests
│   ├── accessibility.test.ts        # A11y tests
│   ├── responsive.test.ts           # Responsive behavior tests
│   └── config.json                  # DOM test configuration
├── performance/                      # Performance tests
│   ├── load-time.test.ts           # Page load tests
│   ├── asset-size.test.ts          # Asset optimization tests
│   └── config.json                  # Performance configuration
├── utils/                            # Test utilities
│   ├── screenshot.ts               # Screenshot helpers
│   ├── compare.ts                  # Comparison utilities
│   └── report-generator.ts         # Report generation
├── jest.config.js                   # Jest configuration
├── tsconfig.json                    # TypeScript configuration
└── package.json                     # Test dependencies
```

## 🎯 Purpose

The testing module is responsible for:
- Visual regression testing (pixel-perfect comparison)
- DOM structure validation
- Interactive element testing
- Accessibility auditing
- Performance benchmarking
- Responsive design validation
- Generating comprehensive test reports

## 🚀 Usage (Not Yet Implemented)

```bash
# Run all tests
npm run test

# Run specific test suite
npm run test:visual
npm run test:dom
npm run test:performance

# Update baselines
npm run test:update-baseline

# Generate report
npm run test:report
```

## 🧪 Test Types

### Visual Regression Tests
- Pixel-by-pixel comparison between original Wix site and converted WordPress theme
- Multiple viewport sizes (mobile, tablet, desktop)
- Cross-browser testing
- Difference highlighting

### DOM Structure Tests
- Element hierarchy validation
- Semantic HTML verification
- Class and ID preservation
- Data attribute checking
- Interactive element presence

### Accessibility Tests
- WCAG compliance checking
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation
- ARIA attribute verification

### Performance Tests
- Page load time benchmarks
- Asset size limits
- Render blocking resources
- First contentful paint
- Time to interactive

### Responsive Tests
- Breakpoint behavior
- Mobile-first approach
- Touch target sizes
- Viewport meta tags
- Flexible layouts

## ⚙️ Configuration

### Visual Test Config (`visual/config.json`)
```json
{
  "threshold": 0.01,
  "viewports": [
    { "width": 375, "height": 667, "name": "mobile" },
    { "width": 768, "height": 1024, "name": "tablet" },
    { "width": 1920, "height": 1080, "name": "desktop" }
  ],
  "browsers": ["chromium", "firefox", "webkit"]
}
```

### DOM Test Config (`dom/config.json`)
```json
{
  "strictMode": false,
  "allowedDifferences": ["style", "class"],
  "ignoreElements": [".dynamic-content"]
}
```

## 📊 Test Reports

Test reports will be generated in HTML format with:
- Visual diffs with side-by-side comparison
- Percentage similarity scores
- Failed test details
- Performance metrics
- Accessibility violations
- Recommendations for improvements

## 🔧 Technologies

- **Jest**: Test framework
- **Playwright**: Browser automation
- **Pixelmatch**: Visual comparison
- **Axe**: Accessibility testing
- **Lighthouse**: Performance auditing
- **TypeScript**: Type-safe tests

## 📝 Development Status

**Status**: Structure only - no implementation yet

**Next Steps**:
1. Install test dependencies (Jest, Playwright)
2. Create test utilities
3. Implement visual regression tests
4. Add DOM structure tests
5. Implement accessibility tests
6. Add performance benchmarks
7. Create report generator
8. Set up CI/CD integration
