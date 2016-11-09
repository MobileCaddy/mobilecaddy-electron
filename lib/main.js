const electron = require('electron')
// Module to control application life.
const {app, ipcMain, Menu} = require('electron')
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const sqlite3 = require('sqlite3').verbose();

const fs = require('fs');
const storage = require('electron-json-storage');
const querystring = require('query-string');
const p = require('path');
let pjson = require(p.join(p.dirname(module.parent.filename),'package.json'));
pjson.config = require(p.join(p.dirname(module.parent.filename),'config.json'));

let authReturned = false

let smartstore;

// Which tit named this... oh me
var queryString = "";


const launcherHTMLPath = process.cwd() +  '/launcher.html';

/**
 * ----------------------------------------------------------------------------
 * M A I N
 * ----------------------------------------------------------------------------
 */

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null

var cmdLineArgs = process.argv;
  // console.log ("cmdLineArgs", cmdLineArgs);
if (cmdLineArgs[2] == "clear") {
  clearCacheAndQuit();
}

storage.set('pjson', { 'pjson': pjson }, function(error) {
  if (error) throw error;
});

function createWindow () {

  // Create the browser window.
  mainWindow = new BrowserWindow({icon: 'icon.png', width: 800, height: 800, minWidth: 800, minHeight: 600})

  // and load the launcher.html of the app.
  mainWindow.loadURL('file://' + launcherHTMLPath)

  // Build the OAuth consent page URL
  var authWindow = new BrowserWindow({ width: 600, height: 650, show: false, 'node-integration': false });

  // Open the DevTools.
  if (cmdLineArgs[2] == "dbg") mainWindow.webContents.openDevTools();

  storage.has('alreadyLoggedIn', function(error, hasKey) {
    if (error) throw error;
    if (hasKey) {
      // console.log('User has already logged in');
      storage.get('alreadyLoggedIn', function(error, data) {
        if (error) throw error;
        // console.log(data);

        // mainWindow.loadURL(`file://${__dirname}/launcher2.html?` + data.queryString);
        mainWindow.loadURL('file://' + launcherHTMLPath + '?' + data.queryString);
      });

    } else {

      // Open the DevTools.
      if (cmdLineArgs[2] == "dbg") authWindow.webContents.openDevTools();
      var authUrl = pjson.loginEndpoint + '/services/oauth2/authorize?client_id=' + pjson.config.salesforce_consumer_key + '&redirect_uri=' + 'testsfdc:///mobilesdk/detect/oauth/done' + '&response_type=token';
      authWindow.loadURL(authUrl);
      authWindow.show();


      // Handle the oauth callback form Salesforce... we don't really have this page
      // so we listen this event to get our token
      authWindow.webContents.on('will-navigate', function(event, newUrl) {
        // console.log("authWindow will-navigate", newUrl);
        if (newUrl.indexOf("oauth/done") > 0) {
          if (newUrl.indexOf("access_token=") > 0) {
              queryString = newUrl.substr(newUrl.indexOf('#') + 1);
              // We have hi-jacked the oauth redirect - yeah baby!
              mainWindow.loadURL('file://' + launcherHTMLPath + '?'  + queryString + '&buildName=' + pjson.buildName);
              authReturned = true;
          } else if (newUrl.indexOf("error=") > 0) {
              queryString = decodeURIComponent(newUrl.substring(newUrl.indexOf('?') + 1));
              obj = querystring.parse(queryString);
              authWindow.close();
          } else {
              if (loginErrorHandler) loginErrorHandler({status: 'access_denied'});
          }
        }
      });


      // Reset the authWindow on close
      authWindow.on('close', function() {
          // console.log("authWindow close queryString: " + queryString);
          if (queryString != "") {
            storage.set('alreadyLoggedIn', { 'queryString': queryString }, function(error) {
              if (error) throw error;
            });
          }
          authWindow = null;
      }, false);
    }
  });


  mainWindow.webContents.on('did-finish-load', function(event, newUrl) {
    // console.log("mainWindow, did-finish-load", newUrl);
    if (authReturned && authWindow) authWindow.close();
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    if (authWindow) authWindow.close();
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', healthCheck)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    if (smartstore) smartstore.close();
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    //createWindow()
  }
})

/**
 * ----------------------------------------------------------------------------
 * I P C   H A N D L I N G  -  G E N E R A L
 * ----------------------------------------------------------------------------
 */

// IPC - vfRemote is asking for our auth creds
ipcMain.on('request-creds', (event, arg) => {
  // console.log('request-creds', arg)  // prints "ping"
  const org_id = getOrgIdFromQueryString();
  event.returnValue = queryString +
    '&client_id=' + pjson.config.salesforce_consumer_key +
    '&org_id=' + org_id +
    '&buildName=' + pjson.buildName;
})

// IPC - local page is asking for the startPageUrl that we have stored.
ipcMain.on('request-startPageUrl', (event, arg) => {
  // console.log('request-startPageUrl', arg)
  storage.get('startPageUrl', function(error, data) {
    if (error) throw error;
    // console.log(data);
    if (data.startPageUrl) {
      event.returnValue = data.startPageUrl;
    } else {
      clearCacheAndReStart();
    }
  });
})


// IPC - local page is asking for the startPageUrl that we have stored.
ipcMain.on('request-pjson', (event, arg) => {
  // console.log('request-pjson', arg)
  // console.log(pjson);
  event.returnValue = pjson;
})


// IPC - got startPageUrl from the vfRemotePage - store it for future startups
ipcMain.on('startPageUrl', (event, arg) => {
  // console.log('startPageUrl', arg)
  storage.set('startPageUrl', { 'startPageUrl': arg });
})


/**
 * ----------------------------------------------------------------------------
 * I P C   H A N D L I N G  -  D A T A B A S E
 * ----------------------------------------------------------------------------
 */

ipcMain.on('smartstore', (event, arg) => {
  let result;
  let success = function(result){
    event.returnValue = result;
  }
  switch (arg.method) {
    case 'registerSoup' :
      smartstoreregisterSoup(arg.args, success);
      break;
    case 'soupExists' :
      smartstoreSoupExists(arg.args.table, success);
      break;
    default:
      event.returnValue = new Error('Unknown method ' + arg.method);
  }
})



function smartstoreregisterSoup(args, success) {
  console.log("smartstoreregisterSoup", args);
  let colDefs = ""
  args.indexSpecs.forEach(function(spec){
    colDefs += " " + spec.path;
  });
  let createSql = "CREATE TABLE " + args.table + "(" + colDefs + ")";
  console.log("createSql", createSql);
  smartstore.run(createSql, function(err, row){
      console.log("err", err);
      console.log("row", row);
      if (!err) {
        success(args.table);
      }
    }
  );
}

function smartstoreSoupExists(tableName, success) {
  console.log("smartstoreSoupExists", tableName);
  smartstore.get("SELECT * FROM sqlite_master WHERE name = ? and type='table'",
    tableName, function(err, row){
      console.log("err", err);
      console.log("row", row);
      if (!err) {
        (row) ? success(true) : success(false);
      }
    }
  );
}

/**
 * ----------------------------------------------------------------------------
 * U T I L I T Y    F U N C T I O N S
 * ----------------------------------------------------------------------------
 */

/**
 * @function healthCheck
 * @description Check to see if we have files etc that we need
 *              Only partially implemented
 */
function healthCheck() {
  fs.access(launcherHTMLPath, fs.F_OK, function(err) {
    if (!err) {
        smartstore = new sqlite3.Database('smartstore.db');
        createWindow();
    } else {
        console.error("Error", "Missing file", launcherHTMLPath, err);
        const {dialog} = require('electron')
        dialog.showErrorBox("Error", "Missing launcher.html in root directory\nSee documentation");
        app.quit();
    }
  });
}


/**
 * @function getOrgIdFromQueryString
 * @description Get the orgId from our queryString (is inside the id param)
 * @return {string} Salesforce Org ID
 */
function getOrgIdFromQueryString() {
  return getUrlParamByName('id', queryString).split('/')[4];
}

/**
 * @function getUrlParamByName
 * @description Gets value from a querystring by name
 * @param  {string} name Name of the param to pluck out
 * @return {string}      The value
 */
function getUrlParamByName(name, qString) {
  // console.info('getUrlParamByName -> name = ' + name);
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec('?' + qString);
  // console.log('getUrlParamByName results -> ' + results);
  if(results === null) {
    return '';
  }
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
} // end getUrlParamByName

/**
 * @function clearCacheAndQuit
 * @description Clears all applicaition data and quits the app
 */
function clearCacheAndQuit(){
  var appDataPath = app.getPath('userData');
  // console.log('appDataPath', appDataPath);
  if (appDataPath.indexOf('mobilecaddy-desktop') > 0) {
    const rimraf = require('rimraf');
    rimraf(appDataPath, function(){
      app.quit();
    });
  } else {
    // console.log("Did NOT delete app cache");
  }
}

