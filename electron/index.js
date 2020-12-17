const {
  app,
  BrowserWindow,
  Menu,
  shell,
  dialog,
  nativeTheme,
  Notification,
  ipcMain
} = require('electron')
const url = require("url");
const path = require("path");
const https = require('https');
const chokidar = require('chokidar');

const ElectronStore = require('./electron-store.js');

const findFreePort = require("./freeport");
const {
  exec,
  spawn
} = require('child_process');
const contextMenu = require('electron-context-menu');
const mainMenu = require('./menu');
const homeDir = require('os').homedir();
const fs = require('fs-extra');
const windowStateKeeper = require('electron-window-state');
// const {
//   escapeRegExp
// } = require('lodash');

// Auto-update - won't work without signed developer account
// require('update-electron-app')({
//   repo: 'nwmac/stratos-desktop',
//   updateInterval: '5 minutes',
//   //logger: require('electron-log')
// })

//const LOG_FILE = '/Users/nwm/stratos.log';
const icon = path.join(__dirname, '/icon.png');

const ELECTRON_NOTIFICATION = 'ELECTRON_NOTIFICATION';
// See node_modules/electron/electron.d.ts NotificationConstructorOptions
const standardNotificationSettings = {
  title: 'Stratos',
  silent: false,
  icon,
};

let mainWindow;
let jetstream;

const lastLocation = 'lastLocation';
const store = new ElectronStore({
  configName: 'settings',
  defaults: {
    [lastLocation]: ''
  }
});

function addContextMenu(mainWindow) {
  let rightClickPosition = null

  const menu = new Menu()
  const menuItem = new MenuItem({
    label: 'Inspect Element',
    click: () => {
      remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y)
    }
  })
  menu.append(menuItem)

  mainWindow.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    rightClickPosition = {
      x: e.x,
      y: e.y
    }
    menu.popup(remote.getCurrentWindow())
  }, false);
}

function createWindow() {

  // fs.writeFileSync(LOG_FILE, 'STRATOS\n');
  // fs.appendFileSync(LOG_FILE, __dirname);

  findFreePort(30000, 40000, '127.0.0.1', function (err, port) {
    let url = `127.0.0.1:${port}`;
    const prog = path.join(__dirname, `./jetstream`);
    jetstream = spawn(prog, [], {
      env: getEnvironment(url),
      cwd: __dirname,
      stdio: 'inherit'
    });

    waitForBackend(`https://${url}`, () => {
      doCreateWindow(url);
    }, 0);
  });
}

function doCreateWindow(url) {

  let mainWindowState = windowStateKeeper({
    defaultWidth: 1024,
    defaultHeight: 768
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    // title: 'Stratos', // Set automatically by html title
    webPreferences: {
      nodeIntegration: true
    },
    icon,
  });
  // Remember last position and size
  mainWindowState.manage(mainWindow);
  mainWindow.on('close', function () {
    savePath(mainWindow.webContents.getURL())
  });
  mainWindow.on('closed', function () {
    mainWindow = null;
    jetstream.kill();
  });

  // Context menu
  contextMenu({
    window: mainWindow,
    // Hide the 'inspect element' menu item
    // showInspectElement: false
  });

  // Load the UI from the dev version beign served by `ng serve`
  if (isDev()) {
    url = '127.0.0.1:4200'
  }
  url = `https://${url}`

  const menu = Menu.buildFromTemplate(mainMenu(mainWindow, url));
  Menu.setApplicationMenu(menu)

  mainWindow.loadURL(addPath(url));

  ipcMain.on(ELECTRON_NOTIFICATION, (event, args) => {
    new Notification({
      ...standardNotificationSettings,
      title: 'Stratos',
      body: args.message,
    }).show()
  })

  // Open the DevTools.
  //mainWindow.webContents.openDevTools({mode:'undocked'});

  // Watch for changed in ant of the local configuration files
  // We will reload endpoints when these change
  const watcher = chokidar.watch([
    getCFConfigFile(),
    getKubeConfigFile(),
    getHelmRepoFolder()
  ]);
  watcher.on('all', (action, filePath) => {
    mainWindow.webContents.send('endpointsChanged', action, filePath);
  });
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  //if (process.platform !== 'darwin') app.quit()
  // Even on MacOS, quit when the last window is closed
  app.quit();
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {

  if (url.indexOf('https://127.0.0.1') === 0 || url.indexOf('wss://127.0.0.1') === 0) {
    // Verification logic.
    event.preventDefault()
    callback(true)
  } else {
    callback(false);
  }
});

function addPath(url) {
  return url + store.get(lastLocation);
}

function savePath(url) {
  const oUrl = new URL(url);
  store.set(lastLocation, oUrl.pathname);
}

function getConfigFolder() {
  const configFolder = store.path;
  fs.ensureDirSync(configFolder);
  return configFolder;
}

function getEnvironment(url) {
  return {
    'CONSOLE_PROXY_TLS_ADDRESS': url,
    'SQLITE_KEEP_DB': 'true',
    'SQLITE_DB_DIR': getConfigFolder(),
    //'LOG_LEVEL': 'DEBUG',
    'SESSION_STORE_EXPIRY': 5000,
    'AUTH_ENDPOINT_TYPE': 'none'
  };
}

function isDev() {
  const args = process.argv
  return args.length > 1 && args[2] === 'dev';
}

function waitForBackend(url, done, retry) {
  const opts = {
    rejectUnauthorized: false,
  }
  const ping = `${url}/pp/v1/version`;
  https.get(ping, opts, (resp) => {
    if (resp.statusCode === 200) {
      done();
    } else {
      jetstreamDidNotStart(url, done, retry + 1)
    }
  }).on('error', (err) => {
    jetstreamDidNotStart(url, done, retry + 1)
  });

}

function jetstreamDidNotStart(url, done, retry) {
  if (retry === 100) {
    dialog.showMessageBoxSync({
      type: 'error',
      title: 'Failed to start Stratos backend',
      message: 'The Stratos backend could not be reached'
    });
    jetstream.kill();
    app.quit();
  } else {
    setTimeout(() => waitForBackend(url, done, retry), 50);
  }
}

function getHelmRepoFolder() {
  var isMac = process.platform === "darwin";
  if (isMac) {
    return path.join(homeDir, 'Library', 'Preferences', 'helm');
  }
  return path.join(homeDir, '.config', 'helm');
}

function getCFConfigFile() {
  return path.join(homeDir, '.cf', 'config.json');
}

function getKubeConfigFile() {
  return process.env.KUBECONFIG || path.join(homeDir, '.kube', 'config');
}
