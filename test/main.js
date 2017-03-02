const electron = require('electron')
// Module to control application life.
const {app, ipcMain, Menu} = require('electron')
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

app.setPath('userData', process.cwd() +  '/test/userDataDir');

console.log("userDataPath", app.getPath('userData'));

// Set up some dummy storage
const storage = require('electron-json-storage');
storage.set('alreadyLoggedIn', { 'queryString': "myQueryString" }, function(error) {
});


// Kick of the MC lib

const mobilecaddy = require('../lib/main')
