const {
  app,
  BrowserWindow,
  Menu,
  shell,
  dialog
} = require('electron')
const url = require("url");
const path = require("path");
const https = require('https');

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
const {
  escapeRegExp
} = require('lodash');

//const LOG_FILE = '/Users/nwm/stratos.log';

let mainWindow;
let jetstream;

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
    title: 'Stratos',
    webPreferences: {
      nodeIntegration: true
    }
  });
  // Remember last position and size
  mainWindowState.manage(mainWindow);
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

  mainWindow.loadURL(url);

  // Open the DevTools.
  //mainWindow.webContents.openDevTools({mode:'undocked'});
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

function getConfigFolder() {
  const configFolder = path.join(homeDir, '.config', 'stratos');
  fs.ensureDirSync(configFolder);
  return configFolder;
}

function getEnvironment(url) {
  return {
    'CONSOLE_PROXY_TLS_ADDRESS': url,
    'SQLITE_KEEP_DB': 'true',
    'SQLITE_DB_DIR': getConfigFolder(),
    //'LOG_LEVEL': 'DEBUG',
    'SESSION_STORE_EXPIRY': Number.MAX_SAFE_INTEGER
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
