# Plugins

### Generate a New Plugin
To generate a new plugin that will be integrated into the UI platform, run:
```
cd tools
node create-plugin
```
When prompted, enter a name for the new plugin. On success, a new directory will appear in the `plugins` folder with the following file structure:
```
  plugins
  └── helion.my-app
      ├── api
      │   └── api.module.js
      ├── event
      │   └── event.module.js
      ├── model
      │   └── model.module.js
      ├── view
      │   └── view.module.js
      ├── helion.my-app.module.js
      ├── helion.my-app.scss
      └── plugin.config.js
```

To integrate the plugin, in the `tools` directory, run:
```
./node_modules/.bin/gulp
```