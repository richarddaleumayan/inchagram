# SDLC Studio - inchagram

This directory contains the SDLC Studio artifacts for the **inchagram** project.

## Directory Structure

```
sdlc-studio/
├── .config.yaml           # Project configuration
├── .version.yaml          # Schema version tracking
├── prd.md                 # Product Requirements Document
├── trd.md                 # Technical Requirements Document
├── tsd.md                 # Test Strategy Document
├── personas.md            # User Personas
├── epics/                 # Epic specifications
│   ├── index.md          # Epic index
│   └── EP*.md            # Individual epics
├── stories/               # User stories
│   ├── index.md          # Story index
│   └── US*.md            # Individual stories
├── plans/                 # Implementation plans
│   ├── index.md          # Plan index
│   └── PL*.md            # Individual plans
├── bugs/                  # Bug tracking
│   ├── index.md          # Bug index
│   └── BG*.md            # Individual bugs
└── test-specs/            # Test specifications
    ├── index.md          # Test spec index
    └── TS*.md            # Individual test specs
```

## Quick Start

### First Time Setup (Completed)

You've initialized the SDLC Studio structure. Next steps:

1. **Define Requirements:**
   ```bash
   /sdlc-studio prd create      # Create Product Requirements
   /sdlc-studio trd create      # Create Technical Requirements
   /sdlc-studio persona create  # Define User Personas
   ```

   **OR** for existing projects (brownfield):
   ```bash
   /sdlc-studio prd generate    # Extract PRD from codebase
   /sdlc-studio trd generate    # Extract TRD from architecture
   /sdlc-studio persona generate # Infer personas from codebase
   ```

2. **Break Down Work:**
   ```bash
   /sdlc-studio epic            # Generate Epics from PRD
   /sdlc-studio story           # Generate Stories from Epics
   ```

3. **Start Development:**
   ```bash
   /sdlc-studio status          # Check project health
   /sdlc-studio hint            # Get next actionable step
   /sdlc-studio story implement # Execute story workflow
   ```

### Daily Workflow

```bash
/sdlc-studio status          # Visual dashboard
/sdlc-studio hint            # What's next?
/sdlc-studio story implement # Auto-execute next story
```

### Manual Development Cycle

```bash
/sdlc-studio code plan       # Plan implementation
/sdlc-studio code implement  # Write code
/sdlc-studio code test       # Run tests
/sdlc-studio code verify     # Verify acceptance criteria
/sdlc-studio code check      # Quality checks
```

## Command Reference

Run `/sdlc-studio help` for full command reference, or:

- `/sdlc-studio prd help` - PRD commands
- `/sdlc-studio epic help` - Epic generation
- `/sdlc-studio story help` - Story generation
- `/sdlc-studio code help` - Development workflow
- `/sdlc-studio test-spec help` - Test specifications
- `/sdlc-studio bug help` - Bug tracking

## Configuration

Edit `.config.yaml` to customize:

- Coverage targets (unit, integration, e2e)
- Story quality gates (edge cases, test scenarios)
- TDD thresholds
- Review severity levels

See `reference-config.md` in the skill directory for full documentation.

## Schema Version

Current schema version: **2**

To upgrade to the latest schema:
```bash
/sdlc-studio upgrade --dry-run  # Preview changes
/sdlc-studio upgrade            # Apply upgrade
```

## Support

For help with SDLC Studio commands, run:
```bash
/sdlc-studio help
```

---

**Initialized:** 2026-01-30
