# Technology Refresh

The focus for the first part of 2018 is to complete the move from AngularJS to Angular. This is a significant amount of work.

## Migrate Angular from AngularJS

Move to a newer framework that is being actively developed and will carry us forward for longer. This will make future migrations much easier (Angular 2 => 4 => 5 => 6)

Note:
- Back-end stays the same (folder structure will most likely be moved around)
- Deployment and other scripts, artefacts remain the same (tweaks as necessary to build the V2 code)

Stack:

- Angular 5
- Typescript
- RxJS
- Angular Material

## Migrate to Material Design

Adopt material design while keeping essence of the current Angular 1 app:

- Use Material Design as the visual language for the UX
  - Rich language
  - Used by a growing number of projects, not just those from Google
- Adopt Material Design approach, patterns and components
- Leverage angular-material library for UI components
- Only create custom components when needed
- Adopt angular-material approach to theming
- Improve layout and use more visual cues to help locate date and issues


# Migration Milestones

> This material is out of date. We will update once schedule planning is complete.

### Milestone 1: CF Applications -> Endpoint mgmt and Application views (Complete in Sprint 22)

- App Wall
- App View
  - Edit
  - Routes
  - Instances
  - SSH
- Endpoints

### Milestone 1b (Complete in Sprint 22)

- Deployment of an Application as per V1.

### Milestone 2 (Complete in Sprint 24)

-  Cloud Foundry View (excluding "assign users")

### Milestone 3 (Complete in Sprint 26)

- Services view
  - Services as a top-level concept
  - Improve support for services: Service Keys etc

### Milestone 4: Misc (Complete in Sprint 28)

- Add dashboard
- About page
- User profile viewing and edit

### Milestone 5 (Complete in Sprint 30)

- Equivalent functionality of "Assign Users"

### To be scheduled into Milestones:

- e2e tests
- unit tests
- error handling
- Support for plugins/extensions
- Support for vendor modifications
- Internationalisation (i18n)
- Theming/Branding
- Deployment support
  - cf push
  - helm
  - bosh

