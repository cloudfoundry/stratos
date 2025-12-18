# Release Manager Guide

Complete guide for managing Stratos releases using the automated release workflow.

---

## 🎯 Overview

As a release manager, you're responsible for:
- Creating and publishing releases
- Ensuring quality and completeness
- Coordinating with the team
- Managing release communications

**Good News:** The automated release workflow handles 95% of the work. Your role is primarily validation and coordination.

---

## 🚀 Quick Start

### Creating a Production Release (5 Minutes)

```bash
# 1. Verify everything is ready
git status
make test

# 2. Update changelog
vim CHANGELOG.md
git commit -am "docs: update changelog for v5.0.0"

# 3. Create and push tag
git tag -a v5.0.0 -m "Release v5.0.0"
git push origin v5.0.0

# 4. Monitor automation
gh run watch

# 5. Verify release (15 minutes later)
gh release view v5.0.0
```

That's it! GitHub Actions handles everything else.

---

## 📋 Pre-Release Checklist

### Code Quality

- [ ] All tests passing on develop/master branch
- [ ] No open critical bugs or blockers
- [ ] All planned features merged
- [ ] Code freeze announced (if applicable)
- [ ] Security vulnerabilities addressed

**Verify:**
```bash
# Check branch status
git checkout master
git pull origin master
git status

# Run full test suite
make test

# Check for security issues
bun audit
go list -m -u all
```

### Version Management

- [ ] Version bumped in `package.json`
- [ ] Version bumped in `src/jetstream/VERSION`
- [ ] Versions are consistent
- [ ] Version follows semantic versioning

**Update Versions:**
```bash
# Check current version
./build/version-bump.sh show

# Bump version (choose one)
./build/version-bump.sh bump major    # 4.9.3 → 5.0.0
./build/version-bump.sh bump minor    # 4.9.3 → 4.10.0
./build/version-bump.sh bump patch    # 4.9.3 → 4.9.4

# Or set specific version
./build/version-bump.sh set v5.0.0

# Commit version bump
git add package.json src/jetstream/VERSION
git commit -m "chore: bump version to v5.0.0"
git push origin master
```

### Documentation

- [ ] CHANGELOG.md updated with release notes
- [ ] Breaking changes documented
- [ ] Migration guide updated (if needed)
- [ ] API documentation current
- [ ] README.md updated (if needed)

**Update Changelog:**
```markdown
## [5.0.0] - 2025-11-06

### Added
- New authentication methods
- Multi-factor authentication support
- User profile export feature

### Changed
- Updated Angular to version 21
- Improved performance of dashboard
- Enhanced accessibility

### Fixed
- Login timeout issue (#123)
- Memory leak in metrics view (#456)
- Search performance (#789)

### Breaking Changes
- Removed deprecated API endpoints
- Changed configuration format
- Updated minimum Node.js version to 24

### Migration Guide
See [MIGRATION.md](MIGRATION.md) for upgrade instructions.
```

### Team Coordination

- [ ] Release date communicated to team
- [ ] Stakeholders notified
- [ ] Support team briefed on changes
- [ ] Release notes reviewed
- [ ] Communication plan ready

---

## 🎯 Release Types

### Production Release (Stable)

**When:** Major features, stable code, ready for production

**Process:**
```bash
# 1. Final version check
./build/version-bump.sh set v5.0.0

# 2. Update changelog
vim CHANGELOG.md
git commit -am "docs: changelog for v5.0.0"

# 3. Create release tag
git tag -a v5.0.0 -m "Release v5.0.0

Major release with the following highlights:
- Angular 21 upgrade
- New authentication system
- Performance improvements
- Enhanced accessibility

See CHANGELOG.md for complete details."

# 4. Push tag
git push origin v5.0.0
```

**GitHub Actions Automatically:**
1. Builds all 6 platform binaries
2. Builds frontend (production mode)
3. Creates 7 archives
4. Generates SHA256 checksums
5. Creates GitHub release
6. Builds Docker images (multi-arch)
7. Publishes to ghcr.io with `latest` tag

**Timeline:** ~15 minutes

### Release Candidate (Pre-release)

**When:** Testing before final release, team preview

**Process:**
```bash
# 1. Set RC version
./build/version-bump.sh set v5.0.0-rc.1

# 2. Create RC tag
git tag -a v5.0.0-rc.1 -m "Release candidate 1 for v5.0.0

Testing release with all planned features.
Please test thoroughly before final release."

# 3. Push tag
git push origin v5.0.0-rc.1
```

**GitHub Actions Automatically:**
1. Builds all artifacts
2. Creates pre-release on GitHub
3. **SKIPS** Docker build (RC only)

**Timeline:** ~15 minutes

**RC Testing:**
```bash
# Download and test
gh release download v5.0.0-rc.1
tar xzf stratos-v5.0.0-rc.1-linux-amd64.tar.gz
cd stratos-v5.0.0-rc.1-linux-amd64
./bin/jetstream version

# If issues found, create rc.2
./build/version-bump.sh set v5.0.0-rc.2
git tag -a v5.0.0-rc.2 -m "Release candidate 2"
git push origin v5.0.0-rc.2
```

### Hotfix Release (Urgent)

**When:** Critical bugs, security issues

**Process:**
```bash
# 1. Create hotfix branch from master
git checkout master
git pull origin master
git checkout -b hotfix/5.0.1

# 2. Apply fix
# ... make changes ...
make test
git commit -am "fix: critical security issue"

# 3. Merge to master
git checkout master
git merge hotfix/5.0.1

# 4. Bump patch version
./build/version-bump.sh bump patch

# 5. Create hotfix tag
git tag -a v5.0.1 -m "Hotfix release v5.0.1

Critical security fix for authentication bypass.
All users should upgrade immediately."

# 6. Push
git push origin master v5.0.1
```

**Timeline:** ~15 minutes

---

## 🔍 Monitoring Release Progress

### Watch Workflow Execution

```bash
# List recent runs
gh run list --workflow=release.yml

# Watch current run
gh run watch

# View specific run
gh run view [run-id]

# View logs
gh run view [run-id] --log
```

### Workflow Stages

**Stage 1: Validate Version (30 seconds)**
- Extracts version from tag
- Determines if production or pre-release
- Sets up environment

**Stage 2: Build Release (10-12 minutes)**
- Installs dependencies with Bun
- Builds frontend (production)
- Cross-compiles backend (6 platforms)
- Creates 7 archives
- Generates checksums
- Uploads artifacts

**Stage 3: Create GitHub Release (1-2 minutes)**
- Downloads artifacts
- Extracts changelog
- Creates release
- Uploads all files

**Stage 4: Trigger Docker Build (production only)**
- Triggers Docker workflow
- Only for stable releases

**Total Time:** ~15 minutes

### Check Release Status

```bash
# View release
gh release view v5.0.0

# Download artifacts
gh release download v5.0.0

# List assets
gh release view v5.0.0 --json assets
```

---

## ✅ Post-Release Validation

### Verify GitHub Release

**Check Release Page:**
```bash
gh release view v5.0.0
```

**Verify Contents:**
- [ ] 7 archives present (6 platform + 1 source)
- [ ] SHA256SUMS file included
- [ ] Release notes accurate
- [ ] Pre-release flag correct
- [ ] All files downloadable

**Download and Verify:**
```bash
# Download release
gh release download v5.0.0

# Verify checksums
cd dist/release
sha256sum -c SHA256SUMS

# Test one archive
tar xzf stratos-v5.0.0-linux-amd64.tar.gz
cd stratos-v5.0.0-linux-amd64
./bin/jetstream version
# Should show: Version: 5.0.0
```

### Verify Docker Images (Production Only)

**Check Images Exist:**
```bash
# Pull UI image
docker pull ghcr.io/cloudfoundry/stratos-ui:5.0.0

# Pull backend image
docker pull ghcr.io/cloudfoundry/stratos-backend:5.0.0

# Pull all-in-one
docker pull ghcr.io/cloudfoundry/stratos:5.0.0
```

**Verify Image Tags:**
```bash
# Should have multiple tags
docker image ls ghcr.io/cloudfoundry/stratos

# Expected tags:
# - 5.0.0 (exact version)
# - 5.0 (minor version)
# - 5 (major version)
# - latest (production only)
```

**Test Image:**
```bash
# Run container
docker run -d -p 8080:80 ghcr.io/cloudfoundry/stratos-ui:5.0.0

# Verify it works
curl http://localhost:8080

# Cleanup
docker stop $(docker ps -q --filter ancestor=ghcr.io/cloudfoundry/stratos-ui:5.0.0)
```

### Functional Testing

**Smoke Tests:**
```bash
# 1. Download appropriate binary
gh release download v5.0.0 -p "*$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m)*.tar.gz"

# 2. Extract and test
tar xzf stratos-*.tar.gz
cd stratos-*/

# 3. Run backend
./bin/jetstream

# 4. Check health
curl https://localhost:5443/pp/v1/info
```

**Integration Testing:**
- [ ] Deploy to staging environment
- [ ] Run E2E test suite
- [ ] Verify CF integration
- [ ] Verify K8s integration
- [ ] Check authentication flows
- [ ] Verify user permissions

---

## 📢 Release Communication

### Internal Communication

**Announce to Team:**
```markdown
Subject: Stratos v5.0.0 Released

Team,

Stratos v5.0.0 has been released and is available on GitHub.

🎯 Highlights:
- Angular 21 upgrade with performance improvements
- New multi-factor authentication
- Enhanced accessibility features
- Bug fixes and stability improvements

📦 Artifacts:
- GitHub Release: https://github.com/cloudfoundry/stratos/releases/tag/v5.0.0
- Docker Images: ghcr.io/cloudfoundry/stratos:5.0.0

📋 Next Steps:
- DevOps: Deploy to staging for testing
- QA: Run full test suite on staging
- Support: Review changelog and breaking changes
- Documentation: Update deployment guides

Full changelog: https://github.com/cloudfoundry/stratos/blob/v5.0.0/CHANGELOG.md

Thanks to everyone who contributed!
```

### External Communication

**GitHub Release Notes:**
```markdown
# Stratos v5.0.0

Major release with Angular 21 upgrade and new authentication features.

## 🎉 Highlights

### New Features
- **Multi-Factor Authentication**: Enhanced security with MFA support
- **User Profile Export**: Export user data in CSV/JSON formats
- **Accessibility Improvements**: WCAG 2.1 AA compliance

### Performance
- **40% faster initial load** through Angular 21 zoneless change detection
- **Reduced bundle size** by 25% with improved tree-shaking
- **Faster navigation** with route-level code splitting

### Developer Experience
- Modern build system with Bun and Vite
- Automated release workflow
- Improved testing with Vitest

## 🔧 Breaking Changes

⚠️ **Important:** This release includes breaking changes. See [MIGRATION.md](MIGRATION.md) for upgrade instructions.

- Minimum Node.js version: 24+
- Configuration format changed (see migration guide)
- Deprecated API endpoints removed

## 📦 Installation

### Using Docker
```bash
docker pull ghcr.io/cloudfoundry/stratos:5.0.0
docker run -p 443:443 ghcr.io/cloudfoundry/stratos:5.0.0
```

### Binary Download
Download for your platform from the [releases page](https://github.com/cloudfoundry/stratos/releases/tag/v5.0.0).

### Kubernetes (Helm)
```bash
helm repo update
helm upgrade stratos stratos/console --version 5.0.0
```

## 📋 Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for complete details.

## 🙏 Contributors

Thanks to all contributors who made this release possible!

[Full contributor list]

## 📞 Support

- Documentation: https://stratos.app/docs
- Issues: https://github.com/cloudfoundry/stratos/issues
- Discussions: https://github.com/cloudfoundry/stratos/discussions
```

**Social Media:**
```markdown
🎉 Stratos v5.0.0 is here!

✨ Angular 21 upgrade
🔐 Multi-factor authentication
⚡ 40% faster performance
♿ Enhanced accessibility

Download: https://github.com/cloudfoundry/stratos/releases/tag/v5.0.0

#CloudFoundry #Kubernetes #OpenSource
```

---

## 🐛 Handling Release Issues

### Release Workflow Failed

**Diagnosis:**
```bash
# View failed run
gh run list --workflow=release.yml --status=failure

# Get logs
gh run view [run-id] --log > failure.log

# Common issues:
# - Build failure: Check dependencies
# - Test failure: Check recent commits
# - Artifact upload failure: Check network
```

**Resolution:**
```bash
# 1. Fix the issue
# 2. Delete failed release (if created)
gh release delete v5.0.0 --yes

# 3. Delete tag
git tag -d v5.0.0
git push origin :refs/tags/v5.0.0

# 4. Fix and retry
# ... fix issue ...
git tag -a v5.0.0 -m "Release v5.0.0"
git push origin v5.0.0
```

### Missing or Corrupted Artifacts

**Verify Checksums:**
```bash
# Download release
gh release download v5.0.0

# Verify all files
cd dist/release
sha256sum -c SHA256SUMS

# If failures, re-upload
gh release upload v5.0.0 corrected-file.tar.gz
```

### Docker Build Failed

**Check Docker Workflow:**
```bash
# View Docker runs
gh run list --workflow=docker.yml

# View specific run
gh run view [run-id] --log
```

**Manual Docker Build:**
```bash
# If automated build fails, build manually
docker buildx build --platform linux/amd64,linux/arm64 \
  -f deploy/Dockerfile.ui \
  -t ghcr.io/cloudfoundry/stratos-ui:5.0.0 \
  --push .

docker buildx build --platform linux/amd64,linux/arm64 \
  -f deploy/Dockerfile.bk \
  -t ghcr.io/cloudfoundry/stratos-backend:5.0.0 \
  --push .
```

### Need to Recall Release

**Delete Release:**
```bash
# 1. Delete GitHub release
gh release delete v5.0.0 --yes

# 2. Delete git tag
git tag -d v5.0.0
git push origin :refs/tags/v5.0.0

# 3. Delete Docker images (if necessary)
# Contact DevOps - requires registry admin access

# 4. Communicate recall
# Notify all stakeholders immediately
```

---

## 📊 Release Metrics

### Track Release Success

**Metrics to Monitor:**
- Build time (target: <15 minutes)
- Download counts
- Issue reports
- Docker pull counts
- Deployment success rate

**GitHub Insights:**
```bash
# Release downloads
gh release view v5.0.0 --json assets \
  | jq '.assets[] | {name, downloadCount}'

# Issues since release
gh issue list --label "v5.0.0" --state all

# Docker pulls
# Check GitHub Packages insights
```

### Post-Release Review

**1 Week After Release:**
- [ ] Review issue reports
- [ ] Check deployment success
- [ ] Gather user feedback
- [ ] Document lessons learned
- [ ] Plan next release

**Template:**
```markdown
# v5.0.0 Post-Release Review

## Metrics
- Downloads: 1,234
- Docker Pulls: 5,678
- Issues Reported: 3 (all minor)
- Deployments: 42 successful

## What Went Well
- Automated release worked perfectly
- No critical bugs reported
- Performance improvements well-received

## What Could Improve
- Documentation needed more examples
- Migration guide could be clearer
- Need better RC testing process

## Action Items
- [ ] Improve migration guide
- [ ] Add more examples to docs
- [ ] Create RC testing checklist
```

---

## 🔐 Security Releases

### Coordinated Disclosure

**Process:**
1. Security issue reported privately
2. Fix developed on private branch
3. Release prepared but not published
4. Coordinate disclosure date
5. Publish release and announcement simultaneously

**Security Release Process:**
```bash
# 1. Develop fix on private branch
git checkout -b security/CVE-2025-XXXXX

# 2. Create release when ready
git tag -a v5.0.1 -m "Security release v5.0.1

SECURITY FIX: Authentication bypass vulnerability (CVE-2025-XXXXX)

All users should upgrade immediately.

Details: https://github.com/cloudfoundry/stratos/security/advisories/GHSA-XXXX"

# 3. Push at coordinated time
git push origin master v5.0.1

# 4. Publish security advisory
gh advisory create
```

**Communication:**
- Emphasize urgency
- Provide clear upgrade path
- Document workarounds if available
- Credit security researcher (if applicable)

---

## 📅 Release Schedule

### Recommended Cadence

**Major Releases (X.0.0):** 6-12 months
- Significant features
- Breaking changes allowed
- Extensive testing required

**Minor Releases (X.Y.0):** 1-2 months
- New features
- No breaking changes
- Standard testing

**Patch Releases (X.Y.Z):** As needed
- Bug fixes only
- No new features
- Quick turnaround

**Release Candidates:** 1-2 weeks before major/minor
- RC.1: Feature complete
- RC.2+: Bug fixes only

### Sample Timeline

```
Week 1-2: Development
Week 3: Code freeze, RC.1
Week 4: Testing, RC.2 (if needed)
Week 5: Final release
```

---

## 🎯 Best Practices

### Do's ✅

- **Always test locally before creating tags**
- **Update changelog with every release**
- **Communicate release schedule in advance**
- **Create RC for major/minor releases**
- **Verify all artifacts after release**
- **Monitor for issues after release**
- **Document lessons learned**

### Don'ts ❌

- **Don't skip pre-release checklist**
- **Don't release without testing**
- **Don't forget to update version numbers**
- **Don't ignore failed CI checks**
- **Don't rush security fixes**
- **Don't release on Fridays** (unless urgent)
- **Don't skip post-release validation**

---

## 🛠️ Tools and Resources

### GitHub CLI Commands

```bash
# Release management
gh release list
gh release view v5.0.0
gh release create v5.0.0
gh release delete v5.0.0
gh release download v5.0.0
gh release upload v5.0.0 file.tar.gz

# Workflow management
gh run list --workflow=release.yml
gh run watch
gh run view [run-id]
gh run rerun [run-id]

# Repository management
gh issue list --label "release"
gh pr list --label "release"
```

### Useful Scripts

```bash
# Verify release completeness
./scripts/verify-release.sh v5.0.0

# Generate release notes
./scripts/generate-changelog.sh v4.9.3..v5.0.0

# Update all version files
./build/version-bump.sh set v5.0.0
```

---

## 📞 Getting Help

### Resources
- **Phase 4 Guide**: `claudedocs/phase4-completion-summary.md`
- **Quick Reference**: `claudedocs/PHASE4-QUICK-REFERENCE.md`
- **Troubleshooting**: `docs/troubleshooting.md`
- **GitHub Actions**: `.github/workflows/release.yml`

### Support Channels
- **GitHub Discussions**: Ask questions
- **DevOps Team**: Infrastructure issues
- **Security Team**: Security releases
- **Development Team**: Technical issues

---

**Last Updated:** 2025-11-06
**Version:** 1.0.0
**Maintained By:** Release Management Team
