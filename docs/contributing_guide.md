# Stratos Contributor Guide

Welcome to the Stratos project! This guide will help you get started contributing to Stratos, from setting up your development environment to submitting your first pull request.

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- **Node.js 24+** - [Download](https://nodejs.org/)
- **Bun** - [Install](https://bun.sh/)
- **Go 1.21+** - [Download](https://golang.org/dl/)
- **Git** - [Download](https://git-scm.com/)

### First-Time Setup

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/stratos.git
cd stratos

# 2. Install dependencies (devkit builds automatically!)
bun install

# 3. Start development
make dev-frontend
```

That's it! The dev server is now running at https://127.0.0.1:5440

### Quick Commands

```bash
make help              # Show all available commands
make dev-frontend      # Start frontend dev server
make dev-backend       # Start backend API server
make test              # Run all tests
make lint              # Check code style
```

---

## 📋 Development Workflow

### 1. Choose an Issue

Browse [open issues](https://github.com/cloudfoundry/stratos/issues) and find one that interests you:
- Look for `good-first-issue` labels for beginner-friendly tasks
- Comment on the issue to let others know you're working on it
- Ask questions if anything is unclear

### 2. Create a Feature Branch

```bash
# Update your fork
git checkout master
git pull upstream master

# Create feature branch
git checkout -b feature/my-awesome-feature
```

**Branch Naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements

### 3. Make Your Changes

```bash
# Start dev servers
make dev-frontend      # Terminal 1: Frontend (port 5440)
make dev-backend       # Terminal 2: Backend (port 5443)

# Make changes, test locally
# Frontend auto-reloads on file changes
```

**Code Style:**
- Follow existing patterns in the codebase
- Use TypeScript strict mode for frontend
- Format code: `bun run format`
- Lint: `make lint`

### 4. Write Tests

```bash
# Run tests
make test                       # All tests
bun run test-frontend:core      # Specific package
make test-backend               # Backend tests

# Watch mode for TDD
bun run test:watch
```

**Testing Guidelines:**
- Add tests for new features
- Update tests for bug fixes
- Maintain or improve test coverage
- Use Vitest for frontend, Go testing for backend

### 5. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with meaningful message
git commit -m "feat: add user profile export feature

- Add export button to profile page
- Implement CSV and JSON export formats
- Add unit tests for export functionality
- Update documentation

Closes #123"
```

**Commit Message Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance

### 6. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/my-awesome-feature

# Create pull request
gh pr create --title "Add user profile export feature" --body "
## Description
Implements CSV and JSON export for user profiles.

## Changes
- Added export button to profile page
- Implemented export service with CSV/JSON formats
- Added unit tests

## Testing
- Tested manually on dev server
- All unit tests pass
- E2E tests added

Closes #123
"
```

**PR Guidelines:**
- Clear, descriptive title
- Comprehensive description
- Link related issues
- Include testing notes
- Add screenshots for UI changes

### 7. Address Review Feedback

```bash
# Make requested changes
git add .
git commit -m "fix: address review feedback"
git push

# Tests re-run automatically
```

**Review Process:**
- Automated tests run on every push
- Maintainers review code
- Address feedback promptly
- Be open to suggestions
- Ask questions if unclear

---

## 🏗️ Architecture Overview

### Frontend (`src/frontend/packages/`)

**Monorepo Structure:**
```
packages/
├── core/           # Core UI, components, services
├── store/          # NgRx state management
├── cloud-foundry/  # CF-specific features
├── kubernetes/     # K8s integration
├── git/            # Git integration
├── shared/         # Shared utilities
└── devkit/         # Custom Angular builders
```

**Key Technologies:**
- Angular 21 (zoneless change detection)
- NgRx for state management
- RxJS for reactive programming
- Tailwind CSS for styling
- Vitest for testing
- AnalogJS 2.0 for builds

**State Management Pattern:**
```typescript
// 1. Dispatch action
store.dispatch(loadUsers());

// 2. Effect handles async
@Effect()
loadUsers$ = this.actions$.pipe(
  ofType(loadUsers),
  switchMap(() => this.api.getUsers()),
  map(users => loadUsersSuccess({ users }))
);

// 3. Reducer updates state
on(loadUsersSuccess, (state, { users }) => ({
  ...state,
  users
}));

// 4. Selector provides data
const selectUsers = createSelector(
  selectState,
  state => state.users
);
```

### Backend (`src/jetstream/`)

**Plugin Architecture:**
```
jetstream/
├── api/           # Core API definitions
├── plugins/       # Feature plugins
│   ├── cloudfoundry/
│   ├── kubernetes/
│   └── metrics/
├── repository/    # Database layer
└── datastore/     # Migrations
```

**Key Technologies:**
- Go 1.21
- Echo web framework
- PostgreSQL/MySQL
- Plugin-based architecture

**Adding a Plugin:**
```go
// 1. Create plugin
package myplugin

func Init(portalProxy interfaces.PortalProxy) error {
  // Register routes
  portalProxy.RegisterEndpoint("/my-endpoint", handler)
  return nil
}

// 2. Register in extra_plugins.go
import _ "github.com/cloudfoundry/stratos/src/jetstream/plugins/myplugin"
```

---

## 🧪 Testing Guide

### Frontend Testing

**Unit Tests (Vitest):**
```typescript
import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  it('should create', () => {
    TestBed.configureTestingModule({
      imports: [MyComponent]
    });
    const component = TestBed.createComponent(MyComponent).componentInstance;
    expect(component).toBeTruthy();
  });
});
```

**Running Tests:**
```bash
# All frontend tests
make test-unit

# Specific package
bun run test-frontend:core

# Watch mode
bun run test:watch

# Coverage
bun run test:coverage
```

### Backend Testing

**Go Tests:**
```go
func TestMyFunction(t *testing.T) {
  result := MyFunction("input")
  if result != "expected" {
    t.Errorf("Expected 'expected', got '%s'", result)
  }
}
```

**Running Tests:**
```bash
# All backend tests
make test-backend

# Specific package
cd src/jetstream/plugins/cloudfoundry
go test

# With coverage
go test -cover ./...
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
make test-e2e

# Interactive mode
bun run e2e:ui

# Specific test
bunx playwright test auth.spec.ts
```

---

## 🎨 UI Development

### Component Structure

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-component.component.html',
  styleUrls: ['./my-component.component.scss']
})
export class MyComponent {
  // Component logic
}
```

### Styling with Tailwind

```html
<div class="flex flex-col gap-4 p-4">
  <h1 class="text-2xl font-bold">My Component</h1>
  <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Click Me
  </button>
</div>
```

### Form Handling

```typescript
import { FormBuilder, Validators } from '@angular/forms';

export class MyFormComponent {
  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
  });

  constructor(private fb: FormBuilder) {}

  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

---

## 🔧 Common Tasks

### Adding a New Frontend Package

```bash
# 1. Create package directory
mkdir -p src/frontend/packages/my-package/src

# 2. Create package.json
cat > src/frontend/packages/my-package/package.json << 'EOF'
{
  "name": "@stratosui/my-package",
  "version": "1.0.0",
  "type": "module"
}
EOF

# 3. Add to workspace
# Edit package.json (root) to include new package
```

### Adding a New Backend Plugin

```bash
# 1. Create plugin directory
mkdir -p src/jetstream/plugins/myplugin

# 2. Create plugin file
cat > src/jetstream/plugins/myplugin/main.go << 'EOF'
package myplugin

import "github.com/cloudfoundry/stratos/src/jetstream/repository/interfaces"

func Init(portalProxy interfaces.PortalProxy) error {
  // Plugin initialization
  return nil
}
EOF

# 3. Register plugin in extra_plugins.go
```

### Adding a New API Endpoint

```go
// Backend (Go)
func RegisterRoutes(router *echo.Group) {
  router.GET("/my-endpoint", handleMyEndpoint)
}

func handleMyEndpoint(c echo.Context) error {
  return c.JSON(200, map[string]string{
    "message": "Hello from my endpoint"
  })
}
```

```typescript
// Frontend (TypeScript)
this.http.get('/pp/v1/my-endpoint').subscribe(
  response => console.log(response)
);
```

---

## 🐛 Debugging

### Frontend Debugging

**Browser DevTools:**
```bash
# Start dev server
make dev-frontend

# Open https://127.0.0.1:5440
# Press F12 for DevTools
# Source maps enabled for debugging
```

**Angular DevTools:**
```bash
# Install Chrome extension
# "Angular DevTools"
# Inspect component tree, state, performance
```

**Console Logging:**
```typescript
console.log('Debug:', variable);
console.error('Error:', error);
console.table(arrayOfObjects);
```

### Backend Debugging

**Debug Logging:**
```go
import "github.com/cloudfoundry/stratos/src/jetstream/repository/interfaces"

log.Println("Debug message")
log.Printf("Variable: %v", variable)
```

**Delve Debugger:**
```bash
# Install Delve
go install github.com/go-delve/delve/cmd/dlv@latest

# Debug backend
cd src/jetstream
dlv debug --headless --listen=:2345 --api-version=2
```

---

## 📝 Code Style Guide

### TypeScript

```typescript
// Use TypeScript strict mode
// Use interfaces for data structures
interface User {
  id: string;
  name: string;
  email: string;
}

// Use const for immutable values
const MAX_RETRIES = 3;

// Use arrow functions
const processUser = (user: User) => {
  return user.name.toUpperCase();
};

// Use async/await over promises
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Go

```go
// Follow Go conventions
// Use camelCase for private, PascalCase for public
type User struct {
  ID    string
  Name  string
  Email string
}

// Error handling
func processUser(user User) error {
  if user.Name == "" {
    return errors.New("name is required")
  }
  return nil
}

// Use context for cancellation
func fetchData(ctx context.Context) ([]byte, error) {
  req, err := http.NewRequestWithContext(ctx, "GET", "/api/data", nil)
  if err != nil {
    return nil, err
  }
  // ... rest of implementation
  return data, nil
}
```

---

## 🤝 Communication

### Getting Help

- **GitHub Discussions**: Ask questions, share ideas
- **GitHub Issues**: Report bugs, request features
- **Pull Requests**: Code reviews, feedback
- **Documentation**: Check docs/ directory

### Being a Good Contributor

✅ **Do:**
- Ask questions when unclear
- Be patient with reviewers
- Accept feedback gracefully
- Help others when you can
- Follow the code of conduct

❌ **Don't:**
- Demand immediate responses
- Take criticism personally
- Ignore review feedback
- Submit incomplete work
- Be disrespectful

---

## 🎯 Contribution Checklist

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] Tests added for new features
- [ ] All tests pass locally (`make test`)
- [ ] Linting passes (`make lint`)
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention
- [ ] PR description is clear and complete
- [ ] Related issues are linked
- [ ] No sensitive data in commits

---

## 🚀 Advanced Topics

### Performance Optimization

**Frontend:**
- Use `OnPush` change detection
- Implement `trackBy` for `*ngFor`
- Lazy load routes and modules
- Optimize bundle size

**Backend:**
- Use database connection pooling
- Implement caching where appropriate
- Profile with pprof
- Optimize database queries

### Security Best Practices

- Validate all user input
- Use parameterized queries
- Implement CSRF protection
- Follow OWASP guidelines
- Keep dependencies updated

### Accessibility

- Use semantic HTML
- Provide alt text for images
- Ensure keyboard navigation
- Test with screen readers
- Follow WCAG guidelines

---

## 📚 Learning Resources

### Angular
- [Angular Documentation](https://angular.dev/)
- [Angular Style Guide](https://angular.dev/style-guide)
- [NgRx Documentation](https://ngrx.io/)

### Go
- [Effective Go](https://golang.org/doc/effective_go.html)
- [Go by Example](https://gobyexample.com/)
- [Go Documentation](https://golang.org/doc/)

### Stratos-Specific
- [CLAUDE.md](../CLAUDE.md) - Project overview
- [Architecture Docs](../claudedocs/) - Detailed guides
- [API Documentation](API.md) - API reference

---

## 🎓 Next Steps

Now that you're familiar with the basics:

1. **Find an issue**: Browse [good-first-issue](https://github.com/cloudfoundry/stratos/labels/good-first-issue) labels
2. **Join the community**: Introduce yourself in GitHub Discussions
3. **Start coding**: Follow the workflow above
4. **Ask questions**: We're here to help!

Welcome to the Stratos community! 🎉

---

**Last Updated:** 2025-11-06
**Questions?** Open a [GitHub Discussion](https://github.com/cloudfoundry/stratos/discussions)
