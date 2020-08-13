---
id: developers-guide-env-tech
title: Developer Links + Environment
sidebar_label: Dev Links & Env
---

## Links

Below is a collection of links that are can be useful when tackling some of the technology involved with Stratos

### ES6

* [http://stack.formidable.com/es6-interactive-guide](http://stack.formidable.com/es6-interactive-guide)
* [http://es6-features.org](http://es6-features.org)

### TypeScript

* [https://learnxinyminutes.com/docs/typescript/](https://learnxinyminutes.com/docs/typescript/) (cheat sheet)
* [https://www.tutorialspoint.com/typescript/](https://www.tutorialspoint.com/typescript/)
* [https://tutorialzine.com/2016/07/learn-typescript-in-30-minutes](https://tutorialzine.com/2016/07/learn-typescript-in-30-minutes)

### Angular

#### Angular

* [https://www.youtube.com/watch?v=KhzGSHNhnbI](https://www.youtube.com/watch?v=KhzGSHNhnbI) (very basic 1h video of angular covering basic app features in a demo)
* [https://angular.io/guide/architecture](https://angular.io/guide/architecture) (official angular intro)
* [https://angular.io/tutorial](https://angular.io/tutorial) (official angular tutorial. Basic to start with but good introduction to routing, http requests, promises, observables and observable event stream later on)

#### Angular CLI

* [https://cli.angular.io/reference.pdf](https://cli.angular.io/reference.pdf) (cheat sheet)
* [https://github.com/angular/angular-cli](https://github.com/angular/angular-cli)

#### Example Apps

* https://github.com/aviabird/angularspree (covers everything)

### Redux

* [http://redux.js.org](http://redux.js.org)
* [https://gist.github.com/btroncone/a6e4347326749f938510](https://gist.github.com/btroncone/a6e4347326749f938510)
* [https://code-cartoons.com/a-cartoon-intro-to-redux-3afb775501a6](https://code-cartoons.com/a-cartoon-intro-to-redux-3afb775501a6)
* [https://www.youtube.com/watch?v=WIqbzHdEPVM](https://www.youtube.com/watch?v=WIqbzHdEPVM)
* [https://egghead.io/courses/getting-started-with-redux](https://egghead.io/courses/getting-started-with-redux)

#### Observables

* [http://reactivex.io/documentation/observable.html](http://reactivex.io/documentation/observable.html)

## VS Code Plug-ins

There's no mandated IDE, but if you choose Visual Studio Code here's some helpful plug-ins

### Really Helpful

* TSLint
* TS Hero
* Git Lens
* gitignore
* Move TS - Move files and automatically update imports

### Helpful

* Beautify
* Document This
* Git History
* TODO Parser
  * see icon bottom left for todo's in current file
  * Add the following config to settings to exclude some folders

   ```
   "TodoParser": {
        "folderExclude": ["node_modules", ".vscode"]
   }
   ```

  * F1 + `Parse TODOs (all files)` to see all TODOs
* Code Spell Checker
  * List of words to exclude coming soon
* Eclipse Keymap


## Guides

### ExpressionChangedAfterItHasBeenCheckedError Error

#### Links

* https://blog.angularindepth.com/everything-you-need-to-know-about-the-expressionchangedafterithasbeencheckederror-error-e3fd9ce7dbb4
* https://github.com/angular/angular/issues/17572
* https://github.com/angular/angular/issues/6005

#### In summary

* AVOID
  * setTimeout
  * forcing change detecting
* TRY TO USE
  * observeOn(asapScheduler) in observable chain
  * ngAfterViewInit
* Generally
  * Avoid changing state in child components that will affect a binding in parent component/s