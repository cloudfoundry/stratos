# @stratos/esbuild-builder

Custom Angular builder for Stratos that integrates pre-build processing with Angular 20's application builder.

## Overview

This builder extends Angular's standard application and dev-server builders to include Stratos-specific pre-build processing:

1. **Pre-build Orchestration**: Runs customization processing, theme generation, asset copying, metadata generation, and devkit compilation
2. **Angular Build**: Delegates to Angular 20's application builder for compilation
3. **Seamless Integration**: Works with existing Angular CLI commands and workflows

## Architecture

```
┌─────────────────────────────────────────┐
│   @stratos/esbuild-builder:application  │
├─────────────────────────────────────────┤
│ 1. Run build-orchestrator.js           │
│    - Customizations                     │
│    - Theme generation                   │
│    - Asset copying                      │
│    - Metadata generation                │
│    - Devkit compilation                 │
│                                         │
│ 2. Delegate to Angular builder         │
│    @angular-devkit/build-angular        │
└─────────────────────────────────────────┘
```

## Installation

### 1. Install Dependencies

The builder is part of the Stratos monorepo. Ensure dependencies are installed:

```bash
cd src/frontend/packages/devkit/builders
npm install
```

### 2. Build the Builder

Compile TypeScript to JavaScript:

```bash
cd src/frontend/packages/devkit/builders
npx tsc
```

### 3. Link Locally (Development)

For local development, link the package:

```bash
cd src/frontend/packages/devkit/builders
npm link

# In your Angular project root
npm link @stratos/esbuild-builder
```

## Configuration

### angular.json

Update your `angular.json` to use the custom builder:

```json
{
  "projects": {
    "stratos": {
      "architect": {
        "build": {
          "builder": "@stratos/esbuild-builder:application",
          "options": {
            "preBuildScript": "build/build-orchestrator.js",
            "skipPreBuild": false,
            "outputPath": "dist/stratos",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "tsConfig": "tsconfig.app.json",
            "assets": [
              "src/favicon.ico",
              "src/assets"
            ],
            "styles": [
              "src/styles.scss"
            ]
          },
          "configurations": {
            "production": {
              "optimization": true,
              "outputHashing": "all",
              "sourceMap": false
            },
            "development": {
              "optimization": false,
              "sourceMap": true
            }
          }
        },
        "serve": {
          "builder": "@stratos/esbuild-builder:dev-server",
          "options": {
            "buildTarget": "stratos:build"
          },
          "configurations": {
            "production": {
              "buildTarget": "stratos:build:production"
            },
            "development": {
              "buildTarget": "stratos:build:development"
            }
          }
        }
      }
    }
  }
}
```

## Builder Options

### Application Builder Options

All standard Angular application builder options are supported, plus:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `preBuildScript` | `string` | `build/build-orchestrator.js` | Path to pre-build orchestrator script |
| `skipPreBuild` | `boolean` | `false` | Skip pre-build processing (for testing) |

Standard Angular options: `outputPath`, `index`, `browser`, `tsConfig`, `assets`, `styles`, `optimization`, etc.

### Dev Server Builder Options

Inherits all standard Angular dev-server builder options:

- `buildTarget`: Reference to the build configuration
- `port`: Dev server port (default: 4200)
- `host`: Dev server host (default: localhost)
- `open`: Open browser on server start
- `ssl`: Enable HTTPS
- etc.

## Usage

### Build for Production

```bash
ng build --configuration=production
```

### Build for Development

```bash
ng build --configuration=development
```

### Skip Pre-build (Testing)

```bash
ng build --skipPreBuild
```

### Serve Development Server

```bash
ng serve
# or
npm start
```

### Custom Pre-build Script

```bash
ng build --preBuildScript=build/custom-prebuild.js
```

## Pre-build Script Requirements

The pre-build orchestrator script must:

1. **Exit with status 0 on success**: Any non-zero exit code will fail the build
2. **Write to stdout/stderr**: Output is displayed in build logs
3. **Be executable with Node.js**: `node <script-path>`
4. **Handle errors gracefully**: Provide clear error messages

Example orchestrator:

```javascript
#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('Running pre-build tools...');

try {
  // Run tools in sequence
  execSync('node build/customization-processor.js', { stdio: 'inherit' });
  execSync('node build/theme-generator.js', { stdio: 'inherit' });
  execSync('node build/asset-copier.js', { stdio: 'inherit' });
  execSync('node build/metadata-generator.js', { stdio: 'inherit' });
  execSync('node build/devkit-compiler.js', { stdio: 'inherit' });

  console.log('Pre-build complete');
  process.exit(0);
} catch (error) {
  console.error('Pre-build failed:', error.message);
  process.exit(1);
}
```

## Troubleshooting

### Builder Not Found

**Error**: `Builder "@stratos/esbuild-builder:application" cannot be resolved`

**Solutions**:
1. Ensure the package is installed: `npm install @stratos/esbuild-builder`
2. For local development, use `npm link`
3. Verify `builders.json` exists and is valid
4. Check `node_modules/@stratos/esbuild-builder/builders.json`

### Pre-build Script Fails

**Error**: `Pre-build orchestrator failed`

**Solutions**:
1. Check script path is correct: `build/build-orchestrator.js`
2. Verify script is executable: `node build/build-orchestrator.js`
3. Review script output for specific errors
4. Test with `--skipPreBuild` to isolate the issue

### TypeScript Compilation Errors

**Error**: Type errors in builder code

**Solutions**:
1. Install dependencies: `npm install`
2. Recompile: `npx tsc`
3. Check `tsconfig.json` configuration
4. Verify `@angular-devkit` packages are installed

### Schema Validation Errors

**Error**: Invalid configuration options

**Solutions**:
1. Review `schema.json` for valid options
2. Check `angular.json` configuration matches schema
3. Verify all required options are provided
4. Remove unsupported options

## Development

### Building the Builder

```bash
cd src/frontend/packages/devkit/builders
npx tsc --watch
```

### Testing

```bash
# Test in Stratos project
cd /path/to/stratos
ng build --configuration=development

# Test with skip option
ng build --skipPreBuild

# Test dev server
ng serve
```

### Debugging

Enable verbose logging:

```bash
ng build --verbose
```

Check builder execution:

```bash
NG_DEBUG=true ng build
```

## Integration with Phase 2 Tools

This builder orchestrates Phase 2 pre-build tools:

1. **customization-processor.js**: Processes `customization.json` configuration
2. **theme-generator.js**: Generates theme SCSS from color definitions
3. **asset-copier.js**: Copies assets from packages to output directory
4. **metadata-generator.js**: Generates git metadata and build information
5. **devkit-compiler.js**: Compiles devkit TypeScript package

All tools run via `build/build-orchestrator.js` before Angular compilation.

## Architecture Principles

### Delegation Over Reimplementation

The builder delegates to Angular's application builder rather than reimplementing build logic. This ensures:

- Compatibility with Angular 20+ features
- Automatic updates with Angular CLI
- Standard tooling support (IDE, CLI, etc.)

### Minimal Abstraction

Pre-build processing is a thin wrapper that:

- Runs before Angular compilation
- Fails fast on errors
- Provides clear logging
- Adds minimal overhead

### Extensibility

The builder supports custom pre-build scripts via `preBuildScript` option, allowing:

- Project-specific processing
- Environment-specific builds
- Custom tool integration

## License

Apache-2.0

## Support

For issues or questions:

- GitHub Issues: https://github.com/cloudfoundry/stratos/issues
- Documentation: https://github.com/cloudfoundry/stratos/docs
