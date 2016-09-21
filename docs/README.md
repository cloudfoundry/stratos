# Helion Stackato Console UI
The Helion Stackato Console UI provides a single comprehensive and ubiquitous user experience for: discovering, composing, developing and managing Cloud Native workloads which are hosted in a myriad of: public, managed and private cloud/compute providers.

The Angular-based application is composed of three layers and an event bus. The source code is therefore organized by those four components: `api`, `event`, `model` and `view`. The application can be extended by registering plugins with the same organizational structure.

* [Architecture](architecture.md)
* [Plugins](plugins.md)

### Source Code Structure
```
  src
    └── app
        ├── api
        ├── event
        ├── model
        ├── view
        ├── app.scss
        ├── app.module.js
        └── app.spec.js
    └── lib
    └── plugins
        └── my-app
            ├── api
            │   └── api.module.js
            ├── event
            │   └── event.module.js
            ├── model
            │   └── model.module.js
            ├── view
            │   └── view.module.js
            ├── my-app.scss
            ├── my-app.module.js
            └── plugin.config.js
```

### Style Sheets
Styles are defined in `.scss` files and the Sass preprocessor is used to compile these files into a single `index.css` file. This application uses the default Bootstrap styles, but can be extended with your custom theme/styles through imports in `src/index.scss`.

### Testing
This application uses Karma for unit testing and Protractor for end-to-end testing. Currently, only the `src/app` directory is included for unit testing with Karma. The `e2e` directory contains the Protractor tests. Unit tests can be run in the `tools` directory with: `npm test`.

### Linting
This application uses ESLint as the linting utility for Javascript files in the `src` directory (excluding `lib`). To enable rules, please modify the .eslintrc file in the root directory. Linting can be run in the `tools` directory with: `./node_modules/.bin/gulp lint`.

### Tools
We use Gulp to automate our development and build workflow, and Bower for managing packages and dependencies. Please use `gulp.config.js` to abstract out configuration information (such as paths) from the main Gulp file.
