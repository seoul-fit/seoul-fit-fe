# Contributing to Seoul Fit Frontend 🤝

Welcome to the Seoul Fit Frontend project! We're excited that you want to contribute. This document will guide you through the contribution process and help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Guidelines](#coding-guidelines)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Community](#community)

---

## 📜 Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

**TL;DR**: Be respectful, inclusive, and professional in all interactions.

---

## 🚀 Getting Started

### Ways to Contribute

- **🐛 Bug Reports** - Help us identify and fix issues
- **💡 Feature Requests** - Suggest new features or improvements
- **📝 Documentation** - Improve docs, add examples, fix typos
- **🔧 Code** - Fix bugs, implement features, optimize performance
- **🎨 Design** - UI/UX improvements, accessibility enhancements
- **🧪 Testing** - Write tests, improve test coverage
- **🌍 Translation** - Help make the app multilingual

### Before You Start

1. **Search existing issues** to avoid duplicates
2. **Check the roadmap** in [docs/community/roadmap.md](docs/community/roadmap.md)
3. **Join our discussions** on GitHub Discussions
4. **Ask questions** if you're unsure about anything

---

## 💻 Development Setup

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **Git** with proper configuration
- **VSCode** (recommended) with our extension pack

### Environment Setup

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/seoul-fit-fe.git
   cd seoul-fit-fe
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Fill in your API keys (see README.md for details)
   ```

4. **Install recommended VSCode extensions**:
   ```bash
   # VSCode will prompt you to install recommended extensions
   # Or manually install from .vscode/extensions.json
   ```

5. **Verify setup**:
   ```bash
   npm run validate  # Runs linting, type checking, and formatting checks
   npm run dev       # Starts development server
   ```

---

## 🔄 Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# For features
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b fix/issue-description

# For documentation
git checkout -b docs/improvement-description
```

### 2. Make Changes

- **Write clean, readable code** following our style guide
- **Add comments** for complex logic
- **Update documentation** if needed
- **Write or update tests** for your changes

### 3. Test Your Changes

```bash
# Run all quality checks
npm run validate

# Test the application
npm run dev
npm run build  # Ensure production build works
```

### 4. Commit Changes

Follow our [commit convention](#commit-convention):

```bash
git add .
git commit -m "feat: add facility filtering by distance"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## 📋 Coding Guidelines

### TypeScript Guidelines

- **Use strict TypeScript** - No `any` types unless absolutely necessary
- **Define proper interfaces** for all data structures
- **Use type guards** for runtime type checking
- **Prefer `const` assertions** over type annotations when possible

```typescript
// ✅ Good
interface FacilityData {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
}

// ❌ Avoid
const facilityData: any = getFacilityData();
```

### React Guidelines

- **Use functional components** with hooks
- **Prefer custom hooks** for logic reuse
- **Use TypeScript with props** and state
- **Follow component composition** patterns

```typescript
// ✅ Good
interface MapViewProps {
  facilities: Facility[];
  onFacilitySelect: (facility: Facility) => void;
}

export function MapView({ facilities, onFacilitySelect }: MapViewProps) {
  // Component implementation
}
```

### CSS Guidelines

- **Use TailwindCSS** for styling
- **Create reusable components** with Radix UI
- **Follow mobile-first** responsive design
- **Ensure accessibility** (WCAG 2.1 AA)

```typescript
// ✅ Good - Using TailwindCSS classes
<button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
  Click me
</button>

// ❌ Avoid - Inline styles
<button style={{ backgroundColor: 'blue', color: 'white' }}>
  Click me
</button>
```

### Performance Guidelines

- **Use React.memo** for expensive components
- **Implement virtualization** for large lists
- **Optimize images** and assets
- **Minimize bundle size**

```typescript
// ✅ Good - Memoized expensive component
export const FacilityList = React.memo(({ facilities }: Props) => {
  // Component implementation
});
```

---

## 📝 Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (white-space, formatting)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvements
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to build process or auxiliary tools

### Examples

```bash
# Feature
git commit -m "feat(map): add facility clustering for better performance"

# Bug fix
git commit -m "fix(auth): resolve kakao login redirect issue"

# Documentation
git commit -m "docs: add API key setup instructions to README"

# Breaking change
git commit -m "feat(api): change facility data structure

BREAKING CHANGE: facility.location is now facility.coordinates"
```

---

## 🔍 Pull Request Process

### Before Submitting

- [ ] **All tests pass** (`npm run validate`)
- [ ] **Code follows style guidelines**
- [ ] **Documentation is updated** if needed
- [ ] **Commit messages follow convention**
- [ ] **Branch is up to date** with main

### PR Template

Use our PR template to provide necessary information:

```markdown
## 📝 Description
Brief description of the changes

## 🎯 Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## 🧪 Testing
How has this been tested?

## 📋 Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings introduced
```

### Review Process

1. **Automated checks** must pass (ESLint, TypeScript, build)
2. **At least one reviewer** approval required
3. **Address all feedback** before merging
4. **Squash and merge** for clean history

---

## 🐛 Issue Guidelines

### Bug Reports

Use the bug report template and include:

- **Clear description** of the issue
- **Steps to reproduce** the bug
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, browser, version)
- **Console errors** if any

### Feature Requests

Use the feature request template and include:

- **Problem description** you're trying to solve
- **Proposed solution** with details
- **Alternative solutions** considered
- **Additional context** or mockups

### Questions

- Use **GitHub Discussions** for questions
- Search existing discussions first
- Provide context and what you've tried

---

## 🎨 Design Guidelines

### UI/UX Principles

- **Accessibility first** - WCAG 2.1 AA compliance
- **Mobile-first** responsive design
- **Consistent design system** using Radix UI
- **Intuitive navigation** and user flows

### Visual Guidelines

- **Use semantic colors** from our design tokens
- **Maintain consistent spacing** using Tailwind spacing scale
- **Follow typography hierarchy**
- **Ensure sufficient color contrast**

---

## 🧪 Testing Guidelines

### Testing Strategy

- **Unit tests** for utility functions
- **Component tests** for UI components
- **Integration tests** for API interactions
- **E2E tests** for critical user flows

### Test Structure

```typescript
// ✅ Good test structure
describe('FacilityFilter', () => {
  it('should filter facilities by category', () => {
    // Arrange
    const facilities = createMockFacilities();
    
    // Act
    const result = filterFacilitiesByCategory(facilities, 'park');
    
    // Assert
    expect(result).toHaveLength(2);
    expect(result.every(f => f.category === 'park')).toBe(true);
  });
});
```

---

## 📚 Documentation

### Documentation Types

- **API docs** - Document all public APIs
- **Component docs** - Storybook stories for UI components  
- **Architecture docs** - High-level system design
- **User guides** - How-to guides for users

### Writing Guidelines

- **Clear and concise** language
- **Code examples** for all APIs
- **Step-by-step instructions** for complex tasks
- **Keep documentation updated** with code changes

---

## 🌍 Internationalization

### Adding Translations

1. **Extract text** to translation files
2. **Use i18n keys** instead of hardcoded text
3. **Test with different languages**
4. **Consider text expansion** in layouts

### Supported Languages

- **Korean** (primary)
- **English** (secondary)
- **Japanese** (planned)

---

## 🆘 Getting Help

### Where to Ask

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and discussions
- **Discord** - Real-time chat (coming soon)

### Response Time

- **Bug reports** - Within 48 hours
- **Feature requests** - Within 1 week
- **Questions** - Within 24 hours

---

## 🏆 Recognition

We value all contributions and recognize contributors through:

- **All Contributors** specification
- **Contributor spotlight** in releases
- **Special thanks** in documentation
- **Maintainer invitation** for significant contributors

---

## 📞 Contact

- **Maintainers**: [List of maintainers]
- **Email**: project@example.com
- **Twitter**: @SeoulFitApp

---

Thank you for contributing to Seoul Fit Frontend! Your contributions help make Seoul more accessible and enjoyable for everyone. 🏙️❤️