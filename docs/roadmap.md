# Stratos Roadmap

Last Updated: 31 January 2018

The current high-level features are:

* Angular 2 - move to Angular 2 for the front-end UI
* Services - make Services a first-class citizen in the UI
* Metrics - add metrics to Stratos. See [here](planning/metrics.md) for some initial thoughts


## Agile

We work on a 2-week Sprint cycle. Sprints start on Wednesdays.

We are using GitHub issues to track all work items. We use ZenHub to manage these in an agile fashion - see:

https://app.zenhub.com/workspace/o/cloudfoundry-incubator/stratos/boards

## Angular 2

The focus for the first part of 2018 is to complete the move from AngularJS to Angular. This is a significant amount of work.

Note:
- Back-end stays the same (folder structure will most likely be moved around)
- Deployment and other scrpts, artiefcts remaint the sames (tweaks as neccessary to build the V2 code)

Stack:

- Angular 5
- Typescript
- RxJS
- Angular Material
- Material Design => Adopt material design while keeping essence of the current Angular 1 app

We plan to accomplish this work in a number of milestones, so that we reach parity with the AngularJS version. For references, Sprint 22 started 24 Jan 2018.

### Milestone 1: CF Applications -> Endpoint mgmt and Application views (Complete in Sprint 22)

- App Wall
- App View
  - Edit
  - Routes
  - Instances
  - SSH
- Endpoints

### Milestonte 1b (Complete in Sprint 22)

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
  - docker compose
  - helm
  - bosh

