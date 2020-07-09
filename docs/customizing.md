# Customizing Stratos

Stratos provides a mechanism for customization - the following customizations are currently supported:

- Changing the theme colors
- Changing certain image assets (favorite icon, login background and logo)
- Overriding styles
- Adding new functionality
- Changing the initial loading indicator

# Migrating to Stratos V4 Customization
In V4 there are breaking customization changes. These changes allow a much improved approach to extensions by opening the door to npm style plugins.
To aid in migrating we've provided these instructions.

1) Before updating to the latest code...
    1) Run `npm run customize-reset` to remove all previously created sym links.
    2) Read through the customization documentation below to get a better understanding of the new process.
1) Update your codebase with the desired v4 code.
1) Run `npm install` (only required first time, this will ensure you have the required version of Angular).
1) Change directory to `./build/tools/v4-migration` and run the migration script `./migrate.sh`.
    - This will copy your customizations from `custom-src` to a new Angular package `src/frontend/packages/custom_extensions`.
1) Check that the new package exports your custom module and if applicable your custom-routing module.
    - The migrate script should do this in `src/frontend/packages/custom_extensions/src/public-api.ts`.
1) Check that your ts config file defines the public api file.
    - `src/tsconfig.json` file's `compilerOptions/paths` section should contain something like `"@custom/extensions": ["frontend/packages/custom_extensions/src/public-api.ts"]`.
1) Check that your new package's package.json defines your custom module and if application custom-routing module.
    - See `src/frontend/packages/custom_extensions/package.json` file's `stratos` section.
    - Note your `routingModule` entry label should not have a preceding `_`.
1) Build Stratos in your usual way, for instance `npm run build`.
    - It could be that this fails due to TypeScript import issues, if so go through these and fix.
    - During build time the custom packages will be discovered and output, see section starting `Building with these extensions`. These should contain the modules your require.
1) Run Stratos your usual way. Ensure you can navigate to all your custom parts.
1) Once you are happy everything works as intended remove the old `./custom-src` directory and commit you changes.

## Approach

In order to customize Stratos, you will need to fork the Stratos GitHub repository and apply customizations in your fork. Our aim is to minimize any merge conflicts that might occur when re-basing your fork with the upstream Stratos repository.

<!-- All customizations are placed within a top-level folder named `custom-src`. This folder should only exist in forks and will not exist in the main Stratos repository, so any changes made within this folder should be free from merge conflicts. -->
Customizations are placed in angular packages in the folder named `src/frontend/packages`. In the future you will be able to host these packages in npm and bring them into Stratos in the usual npm dependency way.

Each package should contain custom Stratos configuration in it's package.json pointing to the modules it will be required to import. 

stratos.yaml
custom theme
custom styles
custom assets


The Stratos approach to customization uses symbolic links. We maintain a default set of resources in the folder `src/misc/custom`. When you run `npm install` or when you explicitly run `npm run customize`, a gulp task (in the file `build/fe-build.js`) runs and creates symbolic links, linking the required files to their expected locations withing the `src` folder.

If a required file exists in the `custom-src` folder location, the build script will link this file, otherwise, it will link the default resource from `src/misc/custom`.

Normally, you do not need to run any scripts to apply customizations - they will be applied as part of a `postinstall` script that runs automatically when you do an `npm install`. You can manually run the following scripts if you update or change the customizations:

- `npm run customize` - creates symbolic links for the required files, looking at the provided customizations and then falling back to default files

- `npm run customize-default` - creates symbolic links for the required files, ignoring any provided customizations and using the default files

- `npm run customize-reset` - remove all symbolic links. If you build after running this command you will see errors, as required files are not present.

### Customizing Images

The following image resources can be changed by creating the specified file in the folder shown:

|File name|Folder|Description|
|---|---|---|
|favicon.ico|custom-src/frontend|Favorite icon to use|
|logo.png|custom-src/frontend/assets|Logo to use on login screen and about page|
|nav-logo.png|custom-src/frontend/assets|Logo to use in the top-left side navigation for the application logo|
|login-bg.jpg|custom-src/frontend/assets|Image to use for the login page background|

> NOTE: The `nav-logo.png` logo should have a height of 36px and a maximum width of 180 pixels.

### Customizing the Theme

Stratos uses Material Design and the [angular-material](https://material.angular.io/) library. It uses the same approach to theming.

To create your own theme, create the file `custom.scss` in the folder `custom-src/frontend/sass`.

In this file you can set any or all of the following variables:

|Variable|Purpose|
|---|---|
|$stratos-theme|The main theme to use for Stratos|
|$stratos-nav-theme|Theme to use for the side navigation panel|
|$stratos-status-theme|Theme to use for displaying status in Stratos|

Note that you do not have to specify all of these - defaults will be used if they are not set.

In most cases you will probably want to generate a palette for the primary color for your version of Stratos - an example `custom.scss` this for this is shown below:

```
$suse-green: ( 50: #E0F7F0, 100: #B3ECD9, 200: #80E0C0, 300: #4DD3A7, 400: #26C994, 500: #00C081, 600: #00BA79, 700: #00B26E, 800: #00AA64, 900: #009C51, A100: #C7FFE0, A200: #94FFC4, A400: #61FFA8, A700: #47FF9A, contrast: (50: #000000, 100: #000000, 200: #000000, 300: #000000, 400: #ffffff, 500: #ffffff, 600: #ffffff, 700: #ffffff, 800: #ffffff, 900: #ffffff, A100: #000000, A200: #000000, A400: #000000, A700: #000000 ));

$suse-red: ( 50: #ffebee, 100: #ffcdd2, 200: #ef9a9a, 300: #e57373, 400: #ef5350, 500: #f44336, 600: #e53935, 700: #d32f2f, 800: #c62828, 900: #b71c1c, A100: #ff8a80, A200: #ff5252, A400: #ff1744, A700: #d50000, contrast: ( 50: $black-87-opacity, 100: $black-87-opacity, 200: $black-87-opacity, 300: $black-87-opacity, 400: $black-87-opacity, 500: white, 600: white, 700: white, 800: $white-87-opacity, 900: $white-87-opacity, A100: $black-87-opacity, A200: white, A400: white, A700: white, ));

// Create palettes
$suse-app-primary: mat-palette($suse-green);
$suse-theme-warn: mat-palette($suse-red);

// Create a theme from the palette (secondary theme is the same as the primary in this example)
$suse-app-theme: mat-light-theme($suse-app-primary, $suse-app-primary, $suse-theme-warn);

// Set this theme as the one to use
$stratos-theme: $suse-app-theme;
```

#### Creating or disabling the Dark theme

You can also change the Dark theme, if you wish, by defining the following variables:

|Variable|Purpose|
|---|---|
|$stratos-dark-theme|The dark theme to use for Stratos|
|$stratos-dark-nav-theme|Dark theme to use for the side navigation panel|
|$stratos-dark-status-theme|Dark theme to use for displaying status in Stratos|

Note that minimally you must supply `stratos-dark-theme` to create a dark theme.

By default a dark theme is assumed to be available and the default will be used if not overridden. You can disable dark theme support in the UI by setting the following variable in your `custom.scss`:

```
$stratos-dark-theme-supported: false;
```

### Changing Styles

We don't generally recommend modifying styles, since from version to version of Stratos, we may change the styles used slightly which can mean any modifications you made will need updating. Should you wish to do so, you can modify these in the same `custom.scss` file that is used for theming.

As an example, to disable the login background image, add the following to `custom.scss`:

```
.stratos .intro {
  background-image: none;
}
```

Note that the class `stratos` has been placed on the `BODY` tag of the Stratos application to assist with css selector specificity.

### Adding new Features

Code for new features should be placed within the `custom-src/frontend/app/custom` folder. You can create any sub-folder structure within this folder.

When you perform an `npm install` or explicitly run `npm run customize`, the customize script is run and will symlink the folder `custom-src/frontend/app/custom` to `src/frontend/app/custom`. It will also create a module to import your custom code - this is placed in the file `src/frontend/app/custom/custom-import.module.ts`. You should _not_ edit this file.

Within the `custom-src/frontend/app/custom` folder you must create a module in the file `custom.module.ts` named `CustomModule` - this will be imported into the Stratos application and is the mechanism by which you can add custom code to the front-end.

We currently expose the following extension points in the Stratos UI:

- Changing the component to use for the login screen
- Adding new items to the side navigation menu
- Adding new tabs to the Application, Cloud Foundry, Organization and Space views
- Adding new action buttons to the Application Wall, Application, Cloud Foundry, Organization and Space and Endpoint views

We use Decorators to annotate components to indicate that they are Stratos extensions.

See [Extensions](extensions.md) for more detail and examples of front-end extensions.


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

