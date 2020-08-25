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
1. remove the local clone

#### Add a new version

1. Open `internal-versions.json`
1. Add to the top `<label of version to be displayed in website>:<version of repo to checkout that contains required docs>:<show version in versions drop down`. For example `[ "4.0.0:4.0.0:true"]`
1. Commit, push and merge changes

Everything else should be handled by the CI process (building with all versions in file and publishing)


# Updating Docusaurus Version
If the version of Docusaurus is updated be careful of changes to components that have been 'swizzled`. These are theme components that we have copied using the swizzle command and tweaked locally. 

For example

```
npm run docusaurus -- swizzle @docusaurus/theme-classic Navbar
```

Currently these components are in `./website/src/theme`
- DocVersionSuggestions
- NavBar

After Docusaurus is updated these will remain the Stratos version of the old Docusaurus version. Therefore may need to be recreated using swizzle and applying the same changes.

Note, there are also two non-swizzled custom pages that may also need updating. Current these components are in `./website/src/pages/*.js`
- index.js (home page)
- versions.js (all versions page)
