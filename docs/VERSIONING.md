# Version Management Guide

**Scope**: Complete guide to OBT Helper GPT's versioning system and release process  
**Audience**: Developers, AI agents, maintainers  
**Last Updated**: Version 1.0.0-beta.1

## Overview

OBT Helper GPT uses semantic versioning (semver) with automated tooling to manage releases and maintain consistency across the application.

## Semantic Versioning Format

```
MAJOR.MINOR.PATCH[-PRERELEASE]
```

### Version Components

- **MAJOR** (X.0.0): Breaking changes that require user action
- **MINOR** (0.X.0): New features that are backward compatible
- **PATCH** (0.0.X): Bug fixes and small improvements
- **PRERELEASE** (0.0.0-beta.1): Pre-release versions for testing

### Examples

- `1.0.0` - First stable release
- `1.1.0` - Added new AI tool
- `1.1.1` - Fixed chat interface bug
- `2.0.0-beta.1` - Major rewrite in testing

## Automated Version Management

### Version Script Location

```
scripts/version.js
```

### Available Commands

```bash
# Patch release (bug fixes)
npm run version:patch

# Minor release (new features)
npm run version:minor

# Major release (breaking changes)
npm run version:major

# Beta/prerelease
npm run version:beta
```

### What Gets Updated Automatically

1. **package.json** - Main version field
2. **Footer Display** - Version shown in app footer
3. **Admin Panel** - Version display in admin dashboard
4. **CHANGELOG.md** - New entry with version and date
5. **Git Tag** - Automatic tag creation

## File Locations Updated

### Version Display Files

```javascript
// src/routes/+layout.svelte (footer)
<p class="text-xs text-gray-500">
  OBT Helper GPT v{version}
</p>

// src/routes/admin/+page.svelte (admin panel)
<div class="text-sm text-gray-500">
  Version {version}
</div>
```

### Configuration Files

```json
// package.json
{
  "version": "1.0.0-beta.1"
}
```

## Release Process

### 1. Pre-Release Checklist

- [ ] All features tested locally
- [ ] No linter errors or warnings
- [ ] Documentation updated
- [ ] Admin panel functionality verified
- [ ] Voice features tested (Chrome/Edge)

### 2. Version Bump

```bash
# Choose appropriate version type
npm run version:patch    # For bug fixes
npm run version:minor    # For new features
npm run version:major    # For breaking changes
```

### 3. Automatic Actions

The version script automatically:

- Updates all version references
- Creates CHANGELOG.md entry
- Commits changes with version message
- Creates Git tag
- Displays summary of changes

### 4. Manual Actions Required

After version bump:

- Review generated CHANGELOG.md entry
- Update RELEASE_NOTES.md with user-facing changes
- Push to repository: `git push && git push --tags`
- Deploy to production

## CHANGELOG.md Format

Follows "Keep a Changelog" standard:

```markdown
# Changelog

## [1.1.0] - 2025-01-15

### Added

- New AI tool for code reviews
- Voice input auto-send functionality

### Changed

- Improved admin panel UI
- Updated OpenAI API integration

### Fixed

- Chat interface scroll issue
- Voice controls in Safari

### Removed

- Deprecated localStorage fallback
```

## Version Display Strategy

### User-Facing Locations

- **Footer**: Always shows current version
- **Admin Panel**: Version with build info
- **API Responses**: Version header included

### Development vs Production

- **Development**: Shows version + "-dev" suffix
- **Production**: Shows clean version number

## Rollback Procedures

### Quick Rollback

```bash
# Revert to previous version
git tag -l | tail -1  # Find last tag
git checkout [previous-tag]
npm install
```

### Version Correction

```bash
# If version was bumped incorrectly
git reset --hard HEAD~1  # Undo commit
git tag -d v[incorrect-version]  # Delete tag
npm run version:[correct-type]  # Re-run correct version
```

## Integration with CI/CD

### Netlify Deployment

- Automatic deployment on tag push
- Version included in build environment
- Rollback via Netlify dashboard

### Environment Variables

```bash
VITE_APP_VERSION=${npm_package_version}
```

## Best Practices

### When to Bump Versions

**PATCH (0.0.X)**

- Bug fixes
- Security patches
- Performance improvements
- Documentation updates

**MINOR (0.X.0)**

- New AI tools
- New features
- UI improvements
- API additions (backward compatible)

**MAJOR (X.0.0)**

- Breaking API changes
- Major UI overhauls
- Removed features
- Changed data structures

### Pre-Release Strategy

- Use beta versions for testing
- Test with real users before stable release
- Document breaking changes clearly
- Provide migration guides for major versions

## Troubleshooting

### Common Issues

**Version script fails**

```bash
# Check Node.js version
node --version  # Requires Node 16+

# Check file permissions
chmod +x scripts/version.js
```

**Git tag conflicts**

```bash
# Delete conflicting tag
git tag -d v[version]
git push origin :refs/tags/v[version]
```

**CHANGELOG.md corruption**

- Manual backup recommended before version bumps
- Script creates backup automatically
- Restore from git history if needed

---

_This document is automatically updated with each version release_
