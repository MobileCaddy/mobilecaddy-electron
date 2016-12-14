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
var mainWindow = null;

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
      // if (cmdLineArgs[2] == "dbg") authWindow.webContents.openDevTools();
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
    case 'upsertSoupEntries' :
      smartstoreUpsertSoupEntries(arg.args, success);
      break;
    case 'querySoup' :
      smartstoreQuerySoup(arg.args, success);
      break;
    case 'removeFromSoup' :
      smartstoreRemoveFromSoup(arg.args, success);
      break;
    case 'removeSoup' :
      smartstoreRemoveSoup(arg.table, success);
      break;
    case 'smartQuerySoupFull' :
      smartstoreSmartQuerySoupFull(arg.args.querySpec, success);
      break;
    case 'inject' :
      inject(arg.args, success);
    default:
      event.returnValue = new Error('Unknown method ' + arg.method);
  }
})

function inject(sql, success) {
  console.log("sql", sql);
  smartstore.get(sql, function(err, row){
      console.log("row", row);
      if (!err) {
        success(row);
      } else {
        console.log("err", err);
      }
    }
  );
}

function smartstoreregisterSoup(args, success) {
  console.log("smartstoreregisterSoup", args);
  let colDefs = ""
  args.indexSpecs.forEach(function(spec){
    let fieldType = "";
    if (spec.type == "integer") {
      fieldType = "INTEGER";
    } else if (spec.type == "floating"){
      fieldType = "REAL";
    }
    if (args.table == "dotsRecordTypes" && spec.path == "Table") spec.path = "dotTable";
    colDefs += " '" + spec.path + "' " + fieldType + ",";
  });
  let createSql = "CREATE TABLE " + args.table + "('_soupEntryId' INTEGER PRIMARY KEY ASC," + colDefs.slice(0, colDefs.length - 1) + ")";
  console.log("createSql", createSql);
  smartstore.run(createSql, function(err, row){
      console.log("row", row);
      if (!err) {
        success(args.table);
      } else {
        console.log("err", err);
      }
    }
  );
}

function smartstoreSoupExists(tableName, success) {
  console.log("smartstoreSoupExists", tableName);
  smartstore.get("SELECT * FROM sqlite_master WHERE name = ? and type='table'",
    tableName, function(err, row){
      console.log("row", row);
      if (!err) {
        (row) ? success(true) : success(false);
      } else {
        console.log("err", err);
      }
    }
  );
}


function getLastRows(table, rowCount) {
  return new Promise(function(resolve, reject) {
    smartstore.all("SELECT * from " + table + " ORDER BY _soupEntryId DESC LIMIT " + rowCount, [], function(err, rows){
      console.log("getLastRows rows", rows);
      resolve(rows);
    })
  });
}

function doInsertEntries(table, entries) {
  console.log("doInsertEntries")
  return new Promise(function(resolve, reject) {
    if (entries.length > 0) {
      smartstore.serialize(function() {
        for (var i = 0; i < entries.length;  i++) {
          let cols = "";
          let vals = [];
          let placeholders = "";
          let sql = '';
          let myError = null;
          let entry = entries[i];
          for(var propertyName in entry) {
            if (table == "dotsRecordTypes" && propertyName == "Table") {
              cols += "dotTable" + ",";
            } else {
              cols += propertyName + ",";
            }
            placeholders += "?,";
            vals.push(entry[propertyName]);
          }
          cols = cols.slice(0, cols.length - 1);
          placeholders = placeholders.slice(0, placeholders.length - 1);
          sql = "INSERT OR IGNORE INTO " + table + " (" + cols + ") VALUES (" + placeholders + ")";
          // console.log("vals", vals);
          // console.log("sql", sql);
          smartstore.run(sql, vals);
        }
        getLastRows(table, entries.length).then(function(rows){
          resolve(rows);
        }).catch(function(e){
          console.error(e);
          reject(e);
        });
      });
    } else {
      resolve([]);
    }
  });
}

function doUpdateEntries(args, entries) {
  return new Promise(function(resolve, reject) {
    if (entries.length > 0) {
      let entryIdStr = "";
      smartstore.serialize(function() {
        entries.forEach(function(entry) {
          console.log("entry", entry);
          let vals = [];
          let placeholders = "";
          entryIdStr += entry._soupEntryId + ",";
          for (var propertyName in entry) {
            // let val = (typeof(entry[propertyName]) === "string" ) ? "'" + entry[propertyName] + "'" : entry[propertyName];
            if (args.table == "dotsRecordTypes") propertyName = "dotTable";
            placeholders += propertyName + " = ?,";
            vals.push(entry[propertyName]);
          }
          placeholders = placeholders.slice(0, placeholders.length - 1);
          let sql = "UPDATE " + args.table + " SET "  + placeholders + " WHERE " + args.externalIdPath + " = '" + entry[args.externalIdPath] +"'";
          console.log("vals", vals);
          console.log("sql", sql);
          smartstore.run(sql, vals);
        });
        entryIdStr = entryIdStr.slice(0, entryIdStr.length - 1);
        if (entries.length == 1) {
          sql = "SELECT * FROM " + args.table + " WHERE _soupEntryId = " + entryIdStr;
        } else {
          sql = "SELECT * FROM " + args.table + " WHERE _soupEntryId IN (" + entryIdStr +")";
        }
        console.log("sql", sql);
        smartstore.all(sql, [], function(err, rows){
          if (!err) {
            console.log("rows", rows);
            resolve(rows);
          } else {
            console.log("err", err);
            reject(err);
          }
        });
      });
    } else {
      resolve([]);
    }
  });
}

function smartstoreUpsertSoupEntries(args, success) {
  console.log("smartstoreUpsertSoupEntries", args);
  let resultRows = [];
  let returned = false;
  if (args.entries.length > 0) {
    // Split into INSERTS and UPDATES
    let insertEntries = [],
        updateEntries = [];
    args.entries.forEach(function(entry){
      if (entry._soupEntryId) {
        updateEntries.push(entry);
      } else {
        insertEntries.push(entry);
      }
    });

    doInsertEntries(args.table, insertEntries).then(function(resRows){
      resultRows = resRows;
      return doUpdateEntries(args, updateEntries)
      // success(resRows);
    }).then(function(resRows){
      success(resultRows.concat(resRows));
    }).catch(function(e){
      success(resultRows, e);
    });
  } else {
    success(resultRows);
  }
}


function smartstoreQuerySoup(args, success) {
  console.log("smartstoreQuerySoup", args);
  let querySpec = args.querySpec;
  let mySql = "SELECT * FROM " + args.table;

  // Build our query
  if (!querySpec.likeKey && !querySpec.matchKey && !querySpec.smartSql) {
    // do nothing to our query
  } else if (querySpec.queryType == 'exact') {
    mySql += " WHERE " + querySpec.indexPath + " = '" + querySpec.matchKey + "'";
  }
  console.log("mySql", mySql);
  smartstore.all(mySql, function(err, rows){
      // if (rows) console.log("rows", rows);
      if (!err) {
        success(cleanRows(args.table, rows));
      } else {
        console.log("err", err);
        success(false);
      }
    }
  );
}


function smartstoreRemoveFromSoup(args, success) {
  console.log("smartstoreRemoveFromSoup", args);
  let entryIds = args.entryIds;
  entryIdStr = "";
  entryIds.forEach(function(id){
    entryIdStr +=id + ",";
  })
  entryIdStr = entryIdStr.slice(0, entryIdStr.length - 1);
  let mySql = "DELETE FROM " + args.table + " WHERE _soupEntryId IN (" + entryIdStr + ")";
  console.log("mySql", mySql);
  smartstore.all(mySql, function(err, rows){
      // if (rows) console.log("rows", rows);
      if (!err) {
        success(true);
      } else {
        console.log("err", err);
        success(false);
      }
    }
  );
}


function smartstoreRemoveSoup(table, success) {
  console.log("smartstoreRemoveSoup", table);
  let mySql = "DROP TABLE " + table;
  console.log("mySql", mySql);
  smartstore.exec(mySql, function(err){
      if (!err) {
        success(true);
      } else {
        console.log("err", err);
        success(false);
      }
    }
  );
}


function smartstoreSmartQuerySoupFull(querySpec, success){
  console.log("smartstoreSmartQuerySoupFull", querySpec);
  let mySql = cleanSmartQuery(querySpec.smartSql);
  console.log("mySql", mySql);
  smartstore.all(mySql, function(err, rows){
      console.log("rows", rows);
      if (!err) {
         if (rows) {
          let myRows = rows.map(function(obj){
            return [obj._soupEntryId, obj];
          });
          success(myRows)
        } else {
          success([]);
        }
      } else {
        console.log("err", err);
        success(false);
      }
    }
  );
}

function cleanSmartQuery(sql) {
  let mySql = sql.replace(/{|}/g,'').replace(/:/g, '.');
  return mySql
}

function cleanRows(table, rows) {
  let myRows = rows.map(function(obj){
    if (table == "dotsRecordTypes") {
      obj.Table = obj.dotTable;
      delete obj.Table;
    }
    var propNames = Object.getOwnPropertyNames(obj);
    for (var i = 0; i < propNames.length; i++) {
      var propName = propNames[i];
      if (obj[propName] === null || obj[propName] === undefined) {
        delete obj[propName];
      }
    }
    return obj;
  })
  return (myRows);
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
        var appDataPath = app.getPath('userData');
        smartstore = new sqlite3.Database(appDataPath + '/smartstore.db');
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

