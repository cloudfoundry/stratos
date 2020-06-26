---
id: developers-guide-env-tech
title: Stratos Tech + Developer Environment
sidebar_label: Dev Environment 
---

## ES6

* [http://stack.formidable.com/es6-interactive-guide](http://stack.formidable.com/es6-interactive-guide)
* [http://es6-features.org](http://es6-features.org)

## TypeScript

* [https://www.sitepen.com/blog/2013/12/31/definitive-guide-to-typescript/](https://www.sitepen.com/blog/2013/12/31/definitive-guide-to-typescript/)
* [https://learnxinyminutes.com/docs/typescript/](https://learnxinyminutes.com/docs/typescript/) (cheat sheet)
* [https://www.tutorialspoint.com/typescript/](https://www.tutorialspoint.com/typescript/)
* [https://tutorialzine.com/2016/07/learn-typescript-in-30-minutes](https://tutorialzine.com/2016/07/learn-typescript-in-30-minutes)
* [https://www.sitepen.com/blog/2013/12/31/typescript-cheat-sheet/](https://www.sitepen.com/blog/2013/12/31/typescript-cheat-sheet/) (advanced cheat sheet)

## Angular

### Angular

* [https://www.youtube.com/watch?v=KhzGSHNhnbI](https://www.youtube.com/watch?v=KhzGSHNhnbI) (very basic 1h video of angular covering basic app features in a demo)
* [https://angular.io/guide/architecture](https://angular.io/guide/architecture) (official angular intro)
* [https://angular.io/tutorial](https://angular.io/tutorial) (official angular tutorial. Basic to start with but good introduction to routing, http requests, promises, observables and observable event stream later on)

### Angular CLI

* [https://cli.angular.io/reference.pdf](https://cli.angular.io/reference.pdf) (cheat sheet)
* [https://github.com/angular/angular-cli](https://github.com/angular/angular-cli)

### Example Apps

* https://github.com/aviabird/angularspree (covers everything)

## Redux

* [http://redux.js.org](http://redux.js.org)
* [https://gist.github.com/btroncone/a6e4347326749f938510](https://gist.github.com/btroncone/a6e4347326749f938510)
* [https://code-cartoons.com/a-cartoon-intro-to-redux-3afb775501a6](https://code-cartoons.com/a-cartoon-intro-to-redux-3afb775501a6)
* [https://www.youtube.com/watch?v=WIqbzHdEPVM](https://www.youtube.com/watch?v=WIqbzHdEPVM)
* [https://egghead.io/courses/getting-started-with-redux](https://egghead.io/courses/getting-started-with-redux)

### Observables

* [http://reactivex.io/documentation/observable.html](http://reactivex.io/documentation/observable.html)

## VS Code Plug-ins

There's no mandated IDE, but if you choose VS Code here's some helpful plug-ins

### Super Helpful

* TSLint
* SassLint
* TS Hero
* Beautify
* gitignore

### Helpful

* Angular 2+ Snippets
* Angular v4 TypeScript Snippets
* Git Lens
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
* Move TS - Move files and automatically update imports

### Of Interest

* Eclipse Keymap
* Code Spell Checker
  * List of words to exclude coming soon

Example settings

```
{
    "gitlens.blame.line.enabled": false,
    "gitlens.codeLens.recentChange.enabled": false,
    "gitlens.codeLens.authors.enabled": false,
    "gitlens.blame.highlight.locations": [
        "gutter",
        "overview"
    ],
    "gitlens.currentLine.enabled": false,
    "gitlens.hovers.currentLine.enabled": false,
    "editor.fontSize": 12,
    "editor.formatOnSave": true,
    "editor.rulers": [
        140
    ],
    "editor.renderLineHighlight": "none",
    "search.exclude": {
        "node_modules": true,
        "**/node_modules": true,
        "**/bower_components": true,
        "coverage": true,
        "components/*/backend/vendor": true,
        "*.orig": true
    },
    "search.useIgnoreFilesByDefault": true,
    "tslint.validateWithDefaultConfig": true,
    "tslint.configFile": "tslint.json",
    "tslint.autoFixOnSave": true,
    "tslint.alwaysShowStatus": true,
    "tslint.alwaysShowRuleFailuresAsWarnings": true,
    "explorer.autoReveal": false,
    "extensions.ignoreRecommendations": false,
    "TodoParser": {
        "folderExclude": [
            "node_modules",
            ".vscode"
        ]
    },
    "cSpell.userWords": [
        "Guids",
        "action",
        "api",
        "cnsi",
        "cnsis",
        "confirmation",
        "dialog",
        "falsies",
        "guid",
        "iapi",
        "initialise",
        "initialised",
        "injectable",
        "memberof",
        "ngrx",
        "normalizr",
        "strat",
        "unsubscribe",
        "vars"
    ],
    "cSpell.language": ",en-GB",
    "cSpell.enabledLanguageIds": [
        "c",
        "css",
        "cpp",
        "csharp",
        "fonts",
        "go",
        "handlebars",
        "javascript",
        "javascriptreact",
        "json",
        "latex",
        "markdown",
        "php",
        "plaintext",
        "python",
        "restructuredtext",
        "text",
        "typescript",
        "typescriptreact",
        "yml",
        "html"
    ],
    "files.exclude": {
        "**/.git": true,
        "**/.svn": true,
        "**/.hg": true,
        "**/CVS": true,
        "**/.DS_Store": true,
        "**/tmp": true,
        "**/node_modules": true,
        "**/bower_components": true,
        "**/dist": true,
        "**/.orig": true
    },
    "files.watcherExclude": {
        "**/.git/objects/**": true,
        "**/.git/subtree-cache/**": true,
        "**/node_modules/**": true,
        "**/tmp/**": true,
        "**/bower_components/**": true,
        "**/dist/**": true
    },
}
```

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