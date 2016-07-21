## Database Migrations
We use [Goose](https://bitbucket.org/liamstask/goose/) for database migrations, both in our development workflow via docker compose and when we deploy to HCP.

### Development (Docker Compose)
TBD

### Production (HCP)
Our production deployment architecture should be familiar if you have experience with HCP.

It shouldn't matter whether you manually use the `build_and_tag.sh` script to build and tag images and generate the necessary SDL/IDL to deploy the Console or depend on the Concourse pipeline to do the same. At the end of the day, you have Docker images on the shared internal registry and a SDL that tells HCP how to stand up the Console.

There are three sections of the SDL that are of interest here:
- the `components` section
- the `preflight` section
- the `postflight` section

#### The Preflight Job/Task
The preflight job or task is run first, and the success of the install rests on a successful return code (0). The job is really simple: it is used to create a file called `upgrade.lock` on a shared volume. This file will let the rest of the components that make up the Console know that an upgrade is in process.

#### The Components
The `components` section defines the components that make up the Console: the user interface container, the proxy container, and the Postgres database container.

#### The Postflight Job/Task
The `preflight` job or task is run last, after all of the components have successfully arrived at a `running` state. This job has the key role in an upgrade: it runs the database migrations to bring the database up to date as of the current deployment. If that fails in some way, a non-zero return code will abort the upgrade. If the migration succeeds, the `upgrade.lock` file from the preflight task is removed, and the Console can proceed as normal.
