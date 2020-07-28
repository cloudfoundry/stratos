---
title: Frontend Extensions
sidebar_label: Frontend Extensions
---

An example illustrating the various front-end extension points of Stratos is included in the folder `examples/custom-src`.

To include the customizations in this example, either copy or symlink the `examples/custom-src` to `custom-src` at the top-level of the Stratos repository.

Next, run the customization script (this is done automatically when you do an `npm install`) with:

```
npm run customize
```

You can now run Stratos locally to see the customizations - see the [Developer's Guide](../developer/frontend) for details.

For a walk-through of extending Stratos, see [Example: Adding a Custom Tab](#example-adding-a-custom-tab).

## Extension Points

### Side Navigation

New items can be added to the Side Navigation menu with extensions.

To do so, annotate the routes for your extension with custom metadata, which Stratos will then pick up and add to the side menu.

A full example is in the folder `examples/custom-src/frontend/app/custom/nav-extension`.

Your route should have the following metadata in the `data` field:

```
    stratosNavigation: {
      text: '<TITLE>',
      matIcon: '<ICON NAME>'
    }
```

Where `<TITLE>` is the text label to show in the side navigation and `<ICON NAME>` is the icon to use.

You should place your route declaration in a module named `CustomRoutingModule` in the file `custom-src/frontend/app/custom/custom-routing.module.ts`.

An example routing module would be:

```
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const customRoutes: Routes = [{
  path: 'example',
  loadChildren: 'app/custom/nav-extension/nav-extension.module#NavExtensionModule',
  data: {
    stratosNavigation: {
      text: 'Example',
      matIcon: 'extension'
    }
  }
}];

@NgModule({
  imports: [
    RouterModule.forRoot(customRoutes),
  ],
  declarations: []
})
export class CustomRoutingModule { }
```

This approach ensures that the Angular compiler creates a separate chunk for the extension at compile time.

### Custom Tabs

Tabs can be added to the following views in Stratos:

- The Application view that shows the detail of an application
- The Cloud Foundry view that shows detail for a Cloud Foundry
- The Cloud Foundry Org view that shows detail for a Cloud Foundry organization
- The Cloud Foundry Space view that shows detail for a Cloud Foundry space

For example:

![Example Application tab extension](../images/extensions/app-tab-example.png)

The approach for all of these is the same:

1. Create a new component that will provide the tab contents
2. Ensure that your component is included in the `EntryComponent` section of your custom module
2. Decorate the component with the `StratosTab` decorator, for example:

```
@StratosTab({
  type: StratosTabType.Application,
  label: '<LABEL>',
  link: '<LINK>'
})
```

Where:

- < TYPE > indicates where the tab should appear and can be:
  - StratosTabType.Application - Application View
  - StratosTabType.CloudFoundry - Cloud Foundry view
  - StratosTabType.CloudFoundryOrg - Cloud Foundry Org view
  - StratosTabType.CloudFoundrySpace - Cloud Foundry Space view
- < LABEL > is the text label to use for the tab
- < LINK > is the name to use for the route (this must only contain characters permitted in URLs)

An example is included in the file `examples/custom-src/frontend/app/custom/app-tab-extension`.

### Custom Actions

Actions can be added to the following views in Stratos:

- The Application Wall view that shows all applications
- The Application view that shows the detail of an application
- The Cloud Foundry view that shows detail for a Cloud Foundry
- The Cloud Foundry Org view that shows detail for a Cloud Foundry organization
- The Cloud Foundry Space view that shows detail for a Cloud Foundry space
- The Endpoints view that shows all endpoints

An action is a icon button that appears at the top-right of a View. For example:

![Example Application action extension](../images/extensions/appwall-action-example.png)

The approach for all of these is the same:

1. Create a new component that will provide the contents to show when the action is clicked
2. Ensure that your component is included in the `EntryComponent` section of your custom module
2. Decorate the component with the `StratosAction` decorator, for example:

```
@StratosAction({
  type: StratosActionType.Applications,
  label: '<LABEL>',
  link: '<LINK>',
  icon: '<ICON>
})
```

Where:

- < TYPE > indicates where the action should appear and can be:
  - StratosActionType.Applications - Application Wall View
  - StratosActionType.Application - Application View
  - StratosActionType.CloudFoundry - Cloud Foundry view
  - StratosActionType.CloudFoundryOrg - Cloud Foundry Org view
  - StratosActionType.CloudFoundrySpace - Cloud Foundry Space view
  - StratosActionType.Endpoints - Endpoints view
- < ICON > is the icon to show
- < LABEL > is the text label to use for the tooltip of the icon (optional)
- < LINK > is the name to use for the route (this must only contain characters permitted in URLs)

An example is included in the file `examples/custom-src/frontend/app/custom/app-action-extension`.

## Example: Adding a Custom Tab

In this example, we will walk through extending the Stratos front-end.

This walk-through assumes that you have installed the Angular CLI globally - this can be done with `npm install -g @angular/cli`.

### Create a new module

First, create the custom-src folder structure - from the top-level of the Stratos repository run:

```
mkdir -p custom-src/frontend/app/custom
mkdir -p custom-src/frontend/assets/custom
```

Next, run the customize task:

```
npm run customize
```

This will symlink our custom folder into the Stratos application source folder.

Next, use the Angular CLI to create the root module for our custom code with:

```
ng generate module custom
```

This create a new Angular module `CustomModule`.

Run the customize script again, now that that we have created the custom module with:

```
npm run customize
```

### Create a new Component for our Tab

Create a new Angular component with the CLI:

```
ng generate component custom/example-tab-extension
```

### Add Decorator to make this Component an Extension

In a text editor, open the file:

```
src/frontend/app/custom/example-tab-extension/example-tab-extension.component.ts
```

Add the following decorator to the component at the top of the file:

```
import { StratosTab, StratosTabType } from '../../core/extension/extension-service';

@StratosTab({
  type: StratosTabType.Application,
  label: 'Example App Tab',
  link: 'example'
})
```

The file should now look like this:

```
import { Component, OnInit } from '@angular/core';
import { StratosTab, StratosTabType } from '../../core/extension/extension-service';

@StratosTab({
  type: StratosTabType.Application,
  label: 'Example App Tab',
  link: 'example'
})
@Component({
  selector: 'app-example-tab-extension',
  templateUrl: './example-tab-extension.component.html',
  styleUrls: ['./example-tab-extension.component.scss']
})
export class ExampleTabExtensionComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
```

Save the file.


### Mark the component as an entry component

The last thing we need to do is to mark our Extension component as an entry component.

To do this, in a text editor, open the file `src/frontend/app/custom/custom.module.ts` and add the entry components section so it looks like this:

```
@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ExampleTabExtensionComponent],
  entryComponents: [ExampleTabExtensionComponent]
})
export class CustomModule { }
```

### Run it

You should now be able to run Stratos locally and see this new tab on the application page for an application - as illustrated below:

![Example tab extension](../images/extensions/tab-example.png)





// TODO: RC
### Adding new Features

Code for new features should be placed within the `custom-src/frontend/app/custom` folder. You can create any sub-folder structure within this folder.

When you perform an `npm install` or explicitly run `npm run customize`, the customize script is run and will symlink the folder `custom-src/frontend/app/custom` to `src/frontend/app/custom`. It will also create a module to import your custom code - this is placed in the file `src/frontend/app/custom/custom-import.module.ts`. You should _not_ edit this file.

Within the `custom-src/frontend/app/custom` folder you must create a module in the file `custom.module.ts` named `CustomModule` - this will be imported into the Stratos application and is the mechanism by which you can add custom code to the front-end.

We currently expose the following extension points in Stratos:

- Changing the component to use for the login screen
- Adding new items to the side navigation menu
- Adding new tabs to the Application, Cloud Foundry, Organization and Space views
- Adding new action buttons to the Application Wall, Application, Cloud Foundry, Organization and Space and Endpoint views

We use Decorators to annotate components to indicate that they are Stratos extensions.

See [Extensions](../extensions/frontend) for more detail and examples of front-end extensions.

// TODO: RC      "assets/core/custom/acme_logo.png": "core/assets/nav-logo2.png"


### Changing the Initial Loading Indicator

On slower connections, it can take a few seconds to load the main Javascript resources for Stratos.

In order to give the user some initial feedback that Stratos is loading, a loading indicator is included in the `index.html` file. This gets shown as early as possible, as soon as this main html file has loaded. Once the main code has been fetched, the view refreshes to show the application.

A default loading indicator is provided that can be changed. To do so, create the following two files:

- `custom-src/frontend/loading.css` - CSS styles to be included in a style block in the head of the index page
- `custom-src/frontend/loading.html` - HTML markup to be included the the index page to render the loading indicator

The files for the default indicator can be found in the `src/frontend/packages/core/misc/custom` folder.

An example of a different loading indicator is included with the ACME sample in `examples/custom-src/frontend`.

The customization task will insert the appropriate CSS and HTML files into the main index.html file when it runs.

Take a look at the template for the `index.html` file in `src/frontend/packages/core/misc/custom/index.html`. The CSS file is inserted where the marker `/** @@LOADING_CSS@@ **/` is and the HTML file where `<!-- @@LOADING_HTML@@ -->` is.