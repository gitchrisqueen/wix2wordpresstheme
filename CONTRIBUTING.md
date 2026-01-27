# Contributing to Wix to WordPress Theme Converter

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## 🤝 How to Contribute

### Reporting Issues
- Check existing issues before creating a new one
- Use the issue template if available
- Include detailed information:
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - System information
  - Logs and screenshots

### Suggesting Features
- Open a feature request issue
- Describe the feature and its use case
- Explain why it would be valuable
- Consider implementation approach

### Submitting Code
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📋 Development Setup

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git

### Setup Steps
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/wix2wordpresstheme.git
cd wix2wordpresstheme

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start WordPress environment
npm run docker:up
```

## 💻 Development Workflow

### Branch Naming
- Feature: `feature/description`
- Bug fix: `fix/description`
- Documentation: `docs/description`
- Refactor: `refactor/description`

### Commit Messages
Follow conventional commits format:
```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(crawler): add sitemap parsing support
fix(theme-gen): correct header template generation
docs(readme): update installation instructions
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm run test:crawler
npm run test:theme-gen
npm run test:visual
```

### Writing Tests
- Write tests for new features
- Update tests for bug fixes
- Maintain test coverage
- Follow existing test patterns

## 📝 Code Style

### General Guidelines
- Use TypeScript for new code
- Follow existing code structure
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable names

### TypeScript
- Use explicit types
- Avoid `any` type
- Use interfaces for objects
- Enable strict mode

### Formatting
- 2 spaces for indentation
- Use semicolons
- Single quotes for strings
- Trailing commas in multi-line

### Linting
```bash
npm run lint
```

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for functions
- Document parameters and return types
- Explain complex algorithms
- Include usage examples

### README Updates
- Update README for new features
- Keep documentation current
- Add examples and screenshots
- Update table of contents

## 🔍 Code Review Process

### For Contributors
- Respond to review comments
- Make requested changes
- Keep PR focused and small
- Update PR description if scope changes

### For Reviewers
- Be constructive and respectful
- Explain reasoning for changes
- Approve when ready
- Test changes locally if needed

## 🚀 Release Process

### Version Numbers
Follow semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Release Steps
1. Update version in package.json
2. Update CHANGELOG.md
3. Create release tag
4. Publish release notes

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

## ❓ Questions?

- Check existing documentation
- Search closed issues
- Open a discussion issue
- Contact maintainers

## 🎯 Priority Areas

Current priority areas for contribution:
1. Core crawler implementation
2. Theme generator logic
3. Visual testing system
4. Documentation improvements
5. Example conversions

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

Thank you for contributing to make Wix to WordPress conversion easier for everyone!
