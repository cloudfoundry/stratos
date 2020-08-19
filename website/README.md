# Stratos Website

This website is built using [Docusaurus 2](https://v2.docusaurus.io/), a modern static website generator.

> Run the commands below in the `website` folder.

### Installing Dependencies

```
$ npm install
```

### Local Development

```
$ npm start
```

This command starts a local development server and open up a browser window. Most changes are reflected live without having to restart the server.

> Note this command will open a web browser on the locally served site (http://localhost:3000)

### Build

```
$ ./deploy.sh -b
```

This command generates static content into the `build` directory and can be served using any static contents hosting service, or `npm run serve` to see locally.

### Deployment

We use GitHub pages - this command is a convenient way to build the website and push to the `gh-pages` branch.

```
$ ./deploy.sh
```


> Note: The website is deployed to the GitHub Repository `cf-stratos/wesbite` which hosts https://stratos.app

### Version

Versions is handled automatically by `npm run versions` which is called as part of `npm run build`. The `versions` target runs `build-versions.sh` which

> The files is `docs/` will be marked as `next`.

1. clones a local copy of the repo
1. cleans up any previous run (repo aside)
1. Loop through each version defined in `internal-versions.json` (latest version is highest)
  - checkout that version in temp repo
  - tag that version with it's version label using docusaurus
  - copy the files docusaurus creates back into the main repo
  - store the label

#### Add a new version

1. Open `internal-versions.json`
1. Add to the top `<label of version to be displayed in website>:<version of repo to checkout that contains required docs>`. For example `[ "4.0.0:4.0.0"]`
1. Commit, push and merge changes

Everything else should be handled by the CI process (building with all versions in file and publishing)
