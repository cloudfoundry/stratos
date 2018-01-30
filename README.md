# Stratos UI
<a href="https://travis-ci.org/SUSE/stratos"><img src="https://travis-ci.org/SUSE/stratos.svg?branch=master"></a>
<a href="https://codeclimate.com/github/SUSE/stratos"><img src="https://img.shields.io/codeclimate/maintainability/SUSE/stratos.svg"></a>
<a href="https://codecov.io/gh/SUSE/stratos"><img src="https://codecov.io/gh/SUSE/stratos/branch/master/graph/badge.svg"/></a>
<a href="https://zenhub.com"><img src="https://raw.githubusercontent.com/ZenHubIO/support/master/zenhub-badge.png"/></a>
[![GitHub release](https://img.shields.io/github/release/SUSE/stratos-ui.svg)](https://github.com/SUSE/stratos-ui/releases/latest)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/SUSE/stratos-ui/blob/master/LICENSE.md)

Stratos UI is an Open Source Web-based UI (Console) for managing Cloud Foundry. It allows users and administrators to both manage applications running in the Cloud Foundry cluster and perform cluster management tasks.

![Stratos UI Application view](docs/images/screenshots/app-wall.png)

## Deploying Stratos UI

Stratos UI can be deployed in the following environments:

1. Cloud Foundry, as an application. See [guide](deploy/cloud-foundry)
2. Kubernetes, using a Helm chart. See [guide](deploy/kubernetes)
3. Docker, using docker compose. See [guide](deploy/docker-compose)
4. Docker, single container deploying all components. See [guide](deploy/all-in-one)

## Quick Start

To get started quickly, we recommend following the steps to deploy the Stratos UI Console as a Cloud Foundry Application - see [here](deploy/cloud-foundry).

You can also quickly deploy Stratos UI, using the all-in-one container:
```
$ docker run -p 4443:443 splatform/stratos-ui:latest 
```

You can access the UI on `https://localhost:4443`

## Project Planing
We use [ZenHub](https://zenhub.com) for project planning. Feel free to head over to the [Boards](https://github.com/SUSE/stratos#boards)
tab and have a look through our pipelines and milestones. Please note in order to view the ZenHub Boards tab you will need the [ZenHub
browser extension](https://www.zenhub.com/extension)

## Further Reading
 
Take a look at the [Feature Set](docs/features.md) for details on the feature set that Stratos UI provides.
 
Get an [Overview](docs/overview.md) of Stratos UI, its components and the different ways in which it can be deployed.

Browse through features and issues in the project's [issues](https://github.com/SUSE/stratos-ui/issues) page or [Zenhub Board](https://github.com/SUSE/stratos-ui#boards).

What kind of code is in Stratos? We've integrated [Code Climate](https://codeclimate.com) for some code quality and maintainability metrics. Take a stroll around the [project page](https://codeclimate.com/github/SUSE/stratos)


## Contributing

We very much welcome developers who would like to get involved and contribute to the development of the Stratos UI project. Please refer to the [Contributing guide](CONTRIBUTING.md) for more information.

For information to help getting started with development, please read the [Developer's Guide](docs/development.md).

## Support and feedback

We have a channel (#stratos) on the Cloud Foundy Slack where you can ask questions, get support or give us feedback. We'd love to hear from you if you are using Stratos.

You can join the Cloud Foundry Slack here - https://slack.cloudfoundry.org/  - and then join the #stratos channel.

## License

The work done has been licensed under Apache License 2.0. The license file can be found [here](LICENSE.md).

