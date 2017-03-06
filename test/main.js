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

var cmdLineArgs = process.argv;
  // console.log ("cmdLineArgs", cmdLineArgs);
if (cmdLineArgs[2] == "scrub") {
  console.log("Gonna clear out");
  let fs = require('fs');
	let dbFile = app.getPath('userData') + "/net.mobilecaddy-electron-test.db"
	fs.exists(dbFile, function(exists) {
    if(exists) {
      // File exists deletings
      fs.unlink(dbFile,function(err){
      	console.log("err", err);
      	app.exit();
      })
		} else {
    	console.log("DB does not exist");
			const mobilecaddy = require('../lib/main')
		}
	});
} else {
	// Kick of the MC lib

	const mobilecaddy = require('../lib/main')
}
