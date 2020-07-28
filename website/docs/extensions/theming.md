---
title: Theming Stratos
sidebar_label: Theming Stratos
---

Stratos provides a mechanism for customizing the theme, including:

- Changing the theme colors
- Changing image assets (favorite icon, login background and logo)
- Overriding styles
- Changing the initial loading indicator
- Applying theme colors to components

Theme's are best encapsulated in a new stratos package, for example like [this](https://github.com/cloudfoundry/stratos/tree/master/src/frontend/packages/example-theme). It should contain a `package.json` file with a `stratos` section which will contain some of the customization hooks (more on this later).

## Colors
Stratos uses Material Design and the [angular-material](https://material.angular.io/) library. It uses the same approach to theming.

To create your own theme you will need to create a color pallet and provide it to Stratos as a material theme. This theme can also contain
additional colors that customize core parts of the page (header, side navigator menu, avatar, etc).

To do this create the file `_index.scss` in the root of your theme package. This should contain a Stratos scss function that will return a `theme`
object via the Stratos helper function `stratos-theme-helper`, for [example](https://github.com/cloudfoundry/stratos/blob/master/src/frontend/packages/example-theme/_index.scss). 

### Core Pallet
In most cases you will probably want to generate a palette for the primary color for your version of Stratos - an example `custom.scss` for this is shown below:

```
$acme-primary: (50: #e8eaf6, 100: #c5cbe9, 200: #9fa8da, 300: #7985cb, 400: #5c6bc0, 500: #3f51b5, 600: #394aae, 700: #3140a5, 800: #29379d, 900: #1b278d, A100: #c6cbff, A200: #939dff, A400: #606eff, A700: #4757ff, contrast: (  50: #000000,  100: #000000,  200: #000000,  300: #000000,  400: #ffffff,  500: #ffffff,  600: #ffffff,  700: #ffffff,  800: #ffffff,  900: #ffffff,  A100: #000000,  A200: #000000,  A400: #ffffff,  A700: #ffffff, ));
$mat-red: ( 50: #ffebee, 100: #ffcdd2, 200: #ef9a9a, 300: #e57373, 400: #ef5350, 500: #f44336, 600: #e53935, 700: #d32f2f, 800: #c62828, 900: #b71c1c, A100: #ff8a80, A200: #ff5252, A400: #ff1744, A700: #d50000, contrast: ( 50: $black-87-opacity, 100: $black-87-opacity, 200: $black-87-opacity, 300: $black-87-opacity, 400: $black-87-opacity, 500: white, 600: white, 700: white, 800: $white-87-opacity, 900: $white-87-opacity, A100: $black-87-opacity, A200: white, A400: white, A700: white, ));

// Create palettes
$acme-theme-primary: mat-palette($acme-primary);
$acme-theme-warn: mat-palette($mat-red);

// Create a theme from the palette (secondary theme is the same as the primary in this example)
$stratos-theme: mat-light-theme($acme-theme-primary, $acme-theme-primary, $acme-theme-warn);

// Create a similar theme but make it for dark mode
$stratos-dark-theme: mat-dark-theme($acme-theme-primary, $acme-theme-primary, $acme-theme-warn);

```

### Stratos Colors

Additional Stratos colors can be customized by supplying more colors to the `theme` object. Defining these colors here helps reduce the amount of custom SCSS overrides the theme has to use.

> Note - You do not have to specify all of these - defaults will be used if they are not set.

|Property|Description|
|---|---|
|app-background-color| Base color to show in the background of the application |
|app-background-text-color| Color of text when placed on the basic background |
|side-nav| See [below](/docs/extensions/theming#side-nav-colors) |
|status| See [below](/docs/extensions/theming#status-colors)|
|subdued-color| Lighter color meant to be a subdued version of the primary color |
|ansi-colors| See [below](/docs/extensions/theming#ansi-colors)|
|header-background-color| Background color for the main stratos header|
|header-foreground-color| Foreground color for the main stratos |
|stratos-title-show-text| Boolean - Show `Stratos` or provided title with the large logo in the about page, default log in page, etc |
|header-background-span|Does the header background color span across the top, or is the sidenav background color used for the top-left portion|
|underflow-background-color|Background colors to use for things like the about page header (underflow)|
|underflow-foreground-color|Background colors to use for things like the about page header (underflow)|
|link-color| Color for hyperlinks|
|link-active-color| Color of visited hyperlinks|
|user-avatar-background-color| Background color of the default avatar in the main header|
|user-avatar-foreground-color| Foreground color of the default avatar in the main header|
|user-avatar-underflow-invert-colors| Boolean - Invert the user-avatar colors|
|user-avatar-header-invert-colors| Boolean - Invert the user-avatar colors in the main header|
|intro-screen-background-color| Color of the background to introduction style screens (log in, log out, etc)|


#### Side Nav Colors
Colors that define how the top level navigation menu on the left of Stratos appears.

|Property|Description|
|---|---|
|background| Background color of the side nav|
|text| Color of text when menu item is not selected|
|active| Color of background of a selected item|
|active-text| Color of text of a selected item|
|hover| Color of background of an item when hovered on|
|hover-text| Color of text of an item when hovered on|

#### Status Colors
Colors that are associated with the standard levels of statuses.

|Property|Description|
|---|---|
|success||
|info||
|warning||
|danger||
|tentative||
|busy||
|text||

#### Ansi Colors
Terminal style set of colors to show for logging output.

|Property|Description|
|---|---|
|default-foreground||
|default-background||
|black||
|red||
|green||
|yellow||
|blue||
|magenta||
|cyan||
|white||


### Dark theme

By default the theme will not contain a dark mode and the UX for enabled/disabling will be hidden.

In order to add a dark mode to your theme an additional `dark` color theme should be provided by the `stratos-theme` theme function in your
theme's `_index.scss`, for example 
in [_index.scss](https://github.com/cloudfoundry/stratos/blob/master/src/frontend/packages/example-theme/_index.scss).

```
@function stratos-theme() {
  $theme: stratos-theme-helper($stratos-theme);
  @return (
    default: create-custom-theme($stratos-theme),
    dark: create-dark-theme()
  );
}
```

Within the dark theme the default theme's additional Stratos colors can be overwritten.


## Images

### Replace Stratos Images




Images that Stratos uses can be overwritten by a theme. To do so the new images should be added to the package and then referenced
in the theme's `package.json` including the path of the image they overwrite. Below are some prominent examples.


|File name|Path|Description|
|---|---|---|
|`favicon.ico`|`favicon.ico`|Favorite icon to use|
|`logo.png`|`core/assets/logo.png`|Logo to use on login screen and about page|
|`nav-logo.png`|`core/assets/nav-logo.png`|Logo to use in the top-left side navigation for the application logo|


> NOTE: The `nav-logo.png` logo should have a height of 36px and a maximum width of 180 pixels. -->

> NOTE: Files written to `core/assets` should be done in one line, see below

Example `package.json`

```
  "stratos": {
    ...
    "assets": {
      "assets/core": "core/assets",
      "assets/favicon.ico": "favicon.ico",
    },
    ...
  },
```

### New Images

When images are used by custom components they should also be referenced in the theme's `package.json`. Whole folders can be included and should
be written to `core/assets`. When references by the components they use that path `src="/core/assets/custom_image.png"`

```
  "stratos": {
    ...
    "assets": {
      "local/assets": "core/assets",
    },
    ...
  },
```

## Fonts
Any custom fonts used by the theme or extensions can be provided in a similar way to images, the files should be added to the theme's package
and then referenced in the theme's `package.json`.

```
  "stratos": {
    "assets": {
      ...
      "assets/fonts": "suse/fonts"
      ...
  },
```

## Styles

We don't generally recommend modifying styles, since from version to version of Stratos, we may change the styles used slightly which can mean any modifications you made will need updating. Should you wish to do so, you can modify these in the same `_index_.scss`. For example the Acme[_index.scss](https://github.com/cloudfoundry/stratos/blob/master/src/frontend/packages/example-theme/_index.scss) imports a file that adds a text color 

```
body.stratos {
  .favorite-list {
    .app-no-content-container {
      color: $acme-dark-blue;
    }
  }
}
```

Note that the class `stratos` has been placed on the `BODY` tag of the Stratos application to assist with css selector specificity.

## Loading Indicator

The loading indicator is a page shown immediately when Stratos is visited and before any Angular loads. This helps on slow connections where
the bulk of content may take longer to download.

To add a loading indicator create a `html` and `css` file in your theme package and then reference them from your theme's `package.json`.
For example

```
  "stratos": {
    ...
    "theme": {
      "loadingCss": "loader/loading.css",
      "loadingHtml": "loader/loading.html"
    }
    ...
  },
```

## Components

Angular components in your packages can be themed, which provides them access to the theme's colors. To do this, in your extensions package that contains
the components (this may be different to your theme package), add a `_all-theme.scss` file containing a scss function. This function should be
referenced in the package's package.json and is called by the Stratos extension mechanism.

The `_all-theme.scss` and `package.json` content may look like below

```
@mixin apply-theme-suse-extensions($stratos-theme) {

  $theme: map-get($stratos-theme, theme);
  $app-theme: map-get($stratos-theme, app-theme);

}
```

```
  "stratos": {
    ...
    "theming": "sass/_all-theme#apply-theme-suse-extensions",
    ...
  }
```

Component theme files can then be defined and their own scss functions being called from `_all-theme.scss`

```
@mixin apply-theme-suse-extensions($stratos-theme) {
  ...
  @include kube-analysis-report-theme($theme, $app-theme);
  ...
}
```

```
@mixin kube-analysis-report-theme($theme, $app-theme) {
  $backgrounds: map-get($theme, background);
  $background: mat-color($backgrounds, card);
  $background-color:  map-get($app-theme, app-background-color);
}
```
