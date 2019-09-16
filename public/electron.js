const electron = require("electron");
const { app, BrowserWindow, Menu, ipcMain } = electron;

const path = require("path");
const isDev = require("electron-is-dev");

let controlWindow;
let videoWindow;

let width;
let height;

//Function for creating the two windows - controls and video
function createWindows() {
  // Creates the two windows with positioning, width and height fitting the screen
  videoWindow = new BrowserWindow({
    title: "Video feed",
    width: width / 2,
    height: height,
    x: 0,
    y: 0,
    webPreferences: {
      nodeIntegration: true
    }
  });
  //Adds a search parameter to the url to be loaded - this is then handled in the index.js/ViewManager.js, which finds the correct .js-file to load.
  videoWindow.loadURL(
    isDev
      ? "http://localhost:3000?videoWindow"
      : `file://${path.join(__dirname, "../build/index.html?videoWindow")}`
  );
  controlWindow = new BrowserWindow({
    title: "Controls",
    width: width / 2,
    height: height,
    x: width - width / 2,
    y: 0,
    webPreferences: {
      nodeIntegration: true
    }
  });
  controlWindow.loadURL(
    isDev
      ? "http://localhost:3000?controlWindow"
      : `file://${path.join(__dirname, "../build/index.html?controlWindow")}`
  );
  // Opens developer tools in both windows on launch.
  if (isDev) {
    // BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    controlWindow.webContents.openDevTools();
    videoWindow.webContents.openDevTools();
  }
  //Deferences the windows when the app is closed, to save resources.
  controlWindow.on("closed", () => (controlWindow = null));
  videoWindow.on("closed", () => (videoWindow = null));
}

// Sets the width and height of screen - for positioning the created windows according to screen size
function setWidthAndHeight() {
  const display = electron.screen.getPrimaryDisplay();
  width = display.bounds.width;
  height = display.bounds.height;
}

// Functions that are run when the app is ready
app.on("ready", () => {
  setWidthAndHeight();
  createWindows();
});

// Boilerplate code - probably just quits the app when all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Boilerplate code - probably just opens windows when app is launched
app.on("activate", () => {
  if (controlWindow === null) {
    createWindows();
  }
});
