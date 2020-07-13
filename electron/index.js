
const {app, BrowserWindow, Menu, shell} = require('electron')
const url = require("url");
const path = require("path");
const findFreePort = require("./freeport");
const { exec, spawn } = require('child_process');
const contextMenu = require('electron-context-menu');
const mainMenu = require('./menu');
const homeDir = require('os').homedir();
const fs = require('fs-extra');
const windowStateKeeper = require('electron-window-state');

let mainWindow

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
    rightClickPosition = {x: e.x, y: e.y}
    menu.popup(remote.getCurrentWindow())
  }, false);
}

function createWindow () {

  // mainWindow.loadURL(
  //   url.format({
  //     pathname: path.join(__dirname, `../dist/index.html`),
  //     protocol: "file:",
  //     // pathname: '127.0.0.1:5443/',
  //     // protocol: "https:",
  //     slashes: true
  //   })
  // );
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1024,
    defaultHeight: 768
  });

  findFreePort(30000, 40000, '127.0.0.1', function(err, port) {
    let url = `127.0.0.1:${port}`;
    const prog = path.join(__dirname, `./jetstream`);
    const jetstream = spawn(prog, [], { env: getEnvironment(url),
      stdio: 'inherit'});

    setTimeout(function() { 
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
      contextMenu({});

      const menu = Menu.buildFromTemplate(mainMenu(mainWindow));
      Menu.setApplicationMenu(menu)

      // Load the UI from the dev version beign served by `ng serve`
      if (isDev()) {
        url = '127.0.0.1:4200'
      }
  
      mainWindow.loadURL(`https://${url}`);
      // Open the DevTools.
      //mainWindow.webContents.openDevTools({mode:'undocked'});
    }, 2000);

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

  if (url.indexOf('https://127.0.0.1') === 0 || url.indexOf('wss://127.0.0.1') === 0)  {
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
  return  {
    'CONSOLE_PROXY_TLS_ADDRESS': url,
    'SQLITE_KEEP_DB': 'true',
    'SQLITE_DB_DIR': getConfigFolder(),
    //'LOG_LEVEL': 'DEBUG',
  };
}

function isDev() {
  const args = process.argv
  return args.length > 1 && args[2] === 'dev';
}