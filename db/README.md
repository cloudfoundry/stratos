## Database Migrations
We use [Goose](https://bitbucket.org/liamstask/goose/) for database migrations, both in our development workflow via docker compose and when we deploy to HCP.

### Development (Docker Compose)

#### Creating a new migrations
Check out the [main Goose Page](https://bitbucket.org/liamstask/goose/) for details on creating database migrations.

One note: you'll want to choose SQL based migrations vs Golang based migrations. This choice requires the `sql` keyword at the end of the `goose create` command. Ex:
```
$ goose create AddSomeColumns sql
$ goose: created db/migrations/20130106093224_AddSomeColumns.sql
```

#### Testing the new migration
Our development workflow now uses Goose to migrate the database each time Compose is run. The `goose` container runs *after* the Postgres container is up (thanks to the link in the `docker-compose.development.yml` file) and migrates the database.

Look at the logs for the `goose-<blah>` container after compose finishes to be sure your migration was applied successfully.

### Production (HCP)
Our production deployment architecture should be familiar if you have experience with HCP.

It shouldn't matter whether you manually use the `build_and_tag.sh` script to build and tag images and generate the necessary SDL/IDL, or depend on the Concourse pipeline to do the same. At the end of the day, you have Docker images on the shared internal registry and a SDL that tells HCP how to stand up the Console.

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
