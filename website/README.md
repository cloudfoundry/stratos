# Stratos Website

This website is built using [Docusaurus 2](https://v2.docusaurus.io/), a modern static website generator.

> Run the commands below in the `website` folder.

### Installing Dependencies

```
$ npm
```

### Local Development

```
$ npm start
```

This command starts a local development server and open up a browser window. Most changes are reflected live without having to restart the server.

> Note this command will open a web browser on the locally served site (http://localhost:3000)

### Build

```
$ npm build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

We use GitHub pages - this command is a convenient way to build the website and push to the `gh-pages` branch.

```
$ GIT_USER=<Your GitHub username> USE_SSH=true npm deploy
```
