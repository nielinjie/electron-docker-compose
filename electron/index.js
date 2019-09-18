const electron = require('electron');
const path = require('path');
const url = require('url');
var findPort = require("find-free-port");
const isDev = require('electron-is-dev');
const logger = require('./logger');
const customize = require('./customize');

const { app, BrowserWindow, dialog } = electron;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// The server process
const Yml = 'docker-compose.yml'; // how to avoid manual update of this?
const MAX_CHECK_COUNT = 10;
let serverProcess;

function startServer(port) {
  const platform = process.platform;

  const server = `${path.join(app.getAppPath(), '..', '..', Yml)}`;
  // logger.info(`Launching server with docker-compose ${server} at port ${port}...`);
  //TODO 实现寻找主端口，需要传递到compose 文件中。
  logger.info(`Launching server with docker-compose ${server} ...`);

  serverProcess = require('child_process')
    .spawn('docker-compose', ['-f', server, 'up']);

  serverProcess.stdout.on('data', logger.server);

  if (serverProcess.pid) {
    logger.info("Server PID: " + serverProcess.pid);
  } else {
    logger.error("Failed to launch server process.")
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false
    }
  })

  // and load the splash screen of the app
  mainWindow.loadURL(url.format({
    //TODO 可以有个比较动态的splash，有个vue的程序可以动态看到docker-compose的启动，可以学习下。
    pathname: path.join(__dirname, 'splash.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });
}

function loadHomePage(baseUrl, health) {
  logger.info(`Loading home page at ${baseUrl}`);
  // check server health and switch to main page
  checkCount = 0;
  const axios = require('axios');
  setTimeout(function cycle() {
    //TODO 实现单独的health检查
    axios.get(health)
      .then(response => {
        mainWindow.loadURL(`${baseUrl}?_=${Date.now()}`);
      })
      .catch(e => {
        if (e.code === 'ECONNREFUSED') {
          if (checkCount < MAX_CHECK_COUNT) {
            checkCount++;
            setTimeout(cycle, 1000);
          } else {
            dialog.showErrorBox('Server timeout',
              `UI does not receive server response for ${MAX_CHECK_COUNT} seconds.`);
            app.quit()
          }
        } else {
          logger.error(e)
          dialog.showErrorBox('Server error', 'UI receives an error from server.');
          app.quit()
        }
      });
  }, 200);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
  logger.info('###################################################')
  logger.info('#                Application Start                #')
  logger.info('###################################################')
  // Create window first to show splash before starting server
  createWindow();

  if (isDev) {
    // Assume the webpack dev server is up at port 3000  
    loadHomePage(customize.homeUrl,customize.healthUrl);
  } else {
    // Start server at an available port (prefer 8080)
    findPort(8080, function (err, port) {
      logger.info(`Starting server at port ${port}`)
      startServer(port);
      // loadHomePage(`http://localhost:${port}`)
      //TODO findport 暂没有生效
      loadHomePage(customize.homeUrl,customize.healthUrl)
    });
  }
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});

app.on('will-quit', () => {
  if (serverProcess) {
    logger.info(`Killing server process ${serverProcess.pid}`);
    const kill = require('tree-kill');
    kill(serverProcess.pid, 'SIGTERM', function (err) {
      logger.info('Server process killed');
      serverProcess = null;
    });
  }
  const server = `${path.join(app.getAppPath(), '..', '..', Yml)}`;
  serverProcess = require('child_process')
    .spawn('docker-compose', ['-f', server, 'down']);

});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.