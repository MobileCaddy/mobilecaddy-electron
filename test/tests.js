
// NAUGHTY NAUGHTY - THESE SHOULD BE RUN SEQUENTIALLY

// const {app, ipcRenderer} = require('electron')
const {app} = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const sqlite3 = require('sqlite3').verbose();
var device = ipcRenderer.sendSync('request-device-info', '');


/*******************************************************************************
*
* S E T U P    D A T A
*
*******************************************************************************/
var logTag = "";

let myDB;

const appDataPath = app.getPath('userData');
myDB = new sqlite3.Database(appDataPath + "/net.mobilecaddy-electron-test.db");


const TEST_TABLE = 'testTable';
const TEST_TABLE_SPEC = {
  table: TEST_TABLE,
    indexSpecs: [
                 { path: 'Name', type: 'string' },
                 { path: 'Id', type: 'string' }
                 ]
  };

let testData = [
  {Id : 'id111', Name: "T1"},
  {Id : 'id222', Name: "T2"},
]

let testData2 = [
  {Id : 'id111', Name: "T1"},
  {Id : 'id222', Name: "T1"},
]

var soups = [
  {
    table: 'appSoup',
    indexSpecs: [{path: 'Name', type: 'string'},{path: 'CurrentValue', type: 'string'}, {path: 'NewValue', type: 'string'}]
  },
  {
    table: 'recsToSync',
    indexSpecs: [{ path: 'Mobile_Table_Name', type: 'string' },
                 { path: 'SOUP_Record_Id', type: 'string' },
                 { path: 'Id', type: 'string' },
                 { path: 'LastModifiedDateTime', type: 'integer' },
                 { path: 'CRUD_Operation', type: 'string' },
                 { path: 'Current_Connection_Session', type: 'string' }]
  },
  {
    table: 'syncLib_system_data',
    indexSpecs: [{ path: 'MC_Var_String_002', type: 'string' },
                 { path: 'MC_Var_Integer_002', type: 'integer' },
                 { path: 'MC_Var_Integer_006', type: 'integer' },
                 { path: 'MC_Var_String_009', type: 'string' },
                 { path: 'MC_Var_String_016', type: 'string' },
                 { path: 'MC_Var_String_015', type: 'string' },
                 { path: 'MC_Var_String_014', type: 'string' },
                 { path: 'MC_Var_String_005', type: 'string' },
                 { path: 'MC_Var_Integer_005', type: 'integer' },
                 { path: 'MC_Var_String_010', type: 'string' },
                 { path: 'MC_Var_Integer_001', type: 'integer' },
                 { path: 'MC_Var_String_012', type: 'string' },
                 { path: 'MC_Var_Integer_003', type: 'integer' },
                 { path: 'MC_Var_Integer_004', type: 'integer' },
                 { path: 'MC_Var_String_007', type: 'string' },
                 { path: 'MC_Var_String_001', type: 'string' },
                 { path: 'MC_Var_String_020', type: 'string' },
                 { path: 'MC_Var_String_011', type: 'string' },
                 { path: 'MC_Var_String_018', type: 'string' },
                 { path: 'MC_Var_String_008', type: 'string' },
                 { path: 'MC_Var_String_003', type: 'string' },
                 { path: 'MC_Var_String_017', type: 'string' },
                 { path: 'MC_Var_String_019', type: 'string' },
                 { path: 'MC_Var_String_013', type: 'string' },
                 { path: 'MC_Var_String_006', type: 'string' },
                 { path: 'MC_Var_String_004', type: 'string' },
                 { path: 'MC_Var_String_021', type: 'string' }]
  },
  {
    table: 'Connection_Session__mc',
    indexSpecs: [{ path: 'LastModifiedDate', type: 'integer' },
                 { path: 'CreatedDate', type: 'integer' },
                 { path: 'mobilecaddy1__Session_Created_Location__Longitude__s',
                   type: 'floating' },
                 { path: 'mobilecaddy1__Status__c', type: 'string' },
                 { path: 'IsDeleted', type: 'string' },
                 { path: 'Name', type: 'string' },
                 { path: 'mobilecaddy1__Application_User_Device_AUD__c',
                   type: 'string' },
                 { path: 'Id', type: 'string' },
                 { path: 'mobilecaddy1__Session_Created_Location_Error__c',
                   type: 'string' },
                 { path: 'mobilecaddy1__Session_Type__c', type: 'string' },
                 { path: 'mobilecaddy1__Device_Call_Date_Time__c',
                   type: 'floating' },
                 { path: 'mobilecaddy1__Session_Created_Location__Latitude__s',
                   type: 'floating' },
                 { path: 'mobilecaddy1__Mobile_Process_Status__c',
                   type: 'string' },
                 { path: 'SystemModstamp', type: 'integer' },
                 { path: 'mobilecaddy1__MC_Proxy_ID__c', type: 'string' }]
  },
  {
    table: 'Mobile_Log__mc',
    indexSpecs: [{ path: 'IsDeleted', type: 'string' },
                 { path: 'RecordTypeId', type: 'string' },
                 { path: 'SystemModstamp', type: 'integer' },
                 { path: 'mobilecaddy1__Connection_Session__c', type: 'string' },
                 { path: 'mobilecaddy1__MC_Proxy_ID__c', type: 'string' },
                 { path: 'Name', type: 'string' },
                 { path: 'Id', type: 'string' },
                 { path: 'mobilecaddy1__Error_Text__c', type: 'string' },
                 { path: 'mobilecaddy1__Log_Type__c', type: 'string' },
                 { path: 'mobilecaddy1__Data_Dump__c', type: 'string' },
                 { path: 'mobilecaddy1__Application_User_Device__c',
                   type: 'string' }]
  },
  TEST_TABLE_SPEC
]

QUnit.config.reorder = false;

function setLogTag(){
  logTag = "QU > " + QUnit.config.current.module.name + " > " + QUnit.config.current.testName + "\n";
}

function createTestSoup(soupName){
  // Note at the moment we hardcoded use TEST_TABLE_SPEC
  return new Promise(function(resolve, reject) {
    ipcRenderer.sendSync('smartstore', {method: 'removeSoup', args: TEST_TABLE_SPEC});
    ipcRenderer.sendSync('smartstore', {method: 'registerSoup', args: TEST_TABLE_SPEC});
    resolve();
  });
}

function addTestData(){
  // console.log(logTag, "addTestData");
  return new Promise(function(resolve, reject) {
    myDB.serialize(function() {
      myDB.run("BEGIN");
      testData.forEach(function(i){
        let soupLastModifiedDate = new Date().valueOf();
        let sql = "INSERT OR IGNORE INTO " + TEST_TABLE + "('Id', 'Name', '_soupLastModifiedDate') VALUES ('" + i.Id + "','" + i.Name + "'," + soupLastModifiedDate + ")";
        myDB.run(sql);
      });
      myDB.run("COMMIT", function(err, row){
        let sql = "SELECT * FROM " + TEST_TABLE;
        myDB.all(sql, [], function(err, rows){
          resolve(rows);
        });
      });
    });
  });
}

function addTestData2(){
  // console.log(logTag, "addTestData");
  return new Promise(function(resolve, reject) {
    myDB.run("BEGIN");
    testData2.forEach(function(i){
      let sql = "INSERT OR IGNORE INTO " + TEST_TABLE + "('Id', 'Name') VALUES ('" + i.Id + "','" + i.Name + "')";
      myDB.run(sql);
    });
    myDB.run("COMMIT", function(err, row){
      resolve();
    });
  });
}


/*******************************************************************************
*
* I P C    T E S T S
*
*******************************************************************************/

QUnit.module( "IPC", function( hooks ){
  hooks.beforeEach(function() {
    setLogTag();
  });

  /**
   * registerSoup / soupExists
   */
	QUnit.test( "registerSoup / soupExists", function( assert ) {
	  soups.forEach(function(soup) {
		  let soupExists = ipcRenderer.sendSync('smartstore', {method: 'soupExists', args: {table: soup.table}});
		  console.log(logTag,"soupExists", soupExists);
		  if (!soupExists) {
		  	ipcRenderer.sendSync('smartstore', {method: 'registerSoup', args: soup});
		  	soupExists = ipcRenderer.sendSync('smartstore', {method: 'soupExists', args: {table: soup.table}});
		  }
	  	assert.ok( soupExists == true, "soupExists : "  + soup.table);
	  });

	  soupExists = ipcRenderer.sendSync('smartstore', {method: 'soupExists', args: {table: 'DUFF'}});
  	assert.ok( soupExists == false, "soup DOESN'T Exist : DUFF");
	});


  /**
   * removeSoup / soupExists
   */
	QUnit.test( "removeSoup / soupExists", function( assert ) {
	  soups.forEach(function(soup) {
		  let soupExists = ipcRenderer.sendSync('smartstore', {method: 'soupExists', args: {table: soup.table}});
		  console.log(logTag,"soupExists", soupExists);
		  if (soupExists) {
		  	ipcRenderer.sendSync('smartstore', {method: 'removeSoup', args: soup});
		  	soupExists = ipcRenderer.sendSync('smartstore', {method: 'soupExists', args: {table: soup.table}});
		  }
	  	assert.ok( soupExists == false, "soup DOESN'T Exist : "  + soup.table);
	  });
	});


  /**
   * U P S E R T
   */
  QUnit.module("upsertSoupEntries", function() {

    // TEST SCENARIOS
    //    unknown table
    //    -
    //    empty entries
    //    -
    //    empty DB - ok single - with externalIdPath -> insert
    //    empty DB - ok single - matching externalIdPath supplied -> insert
    //    empty DB - ok multi - with externalIdPath -> insert
    //    empty DB - ok multi - matching externalIdPath supplied -> insert
    //    empty DB - ok multi - mixed externalIdPath supplied -> insert
    //    -
    //    non-empty DB - ok single - with externalIdPath -> insert
    //    non-empty DB - ok single - matching externalIdPath supplied -> insert
    //    non-empty DB - ok multi - with externalIdPath -> insert
    //    non-empty DB - ok multi - matching externalIdPath supplied -> insert
    //    non-empty DB - ok multi - mixed externalIdPath supplied -> insert
    //    -
    //    non-empty DB - ok single - with externalIdPath -> update (CANNOT EXIST)
    //    non-empty DB - ok single - matching externalIdPath supplied -> update
    //    non-empty DB - ok multi - with externalIdPath -> updates only  (CANNOT EXIST)
    //    non-empty DB - ok multi - matching externalIdPath supplied -> updates only
    //    non-empty DB - ok multi - with externalIdPath -> insert and update (CANNOT EXIST)
    //    non-empty DB - ok multi - matching externalIdPath supplied -> insert and update
    //    -

    // TODO - Need to check real device response for this
    QUnit.skip( "unknown table", function( assert ) {
      let res = ipcRenderer.sendSync('smartstore', {method: 'upsertSoupEntries', args: {table : 'DUFF', entries : [], externalIdPath : 'Id'}});
      console.log(logTag,logTag, "TODO");
      assert.ok( true == true, "TODO");
    });


    QUnit.test( "'empty DB - empty entries'", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        let res = ipcRenderer.sendSync('smartstore', {method: 'upsertSoupEntries', args: {table : TEST_TABLE, entries : [], externalIdPath : 'Id'}});
        console.log(logTag, res);
        assert.equal( res.length, 0, "[ ] returned");
        assert.equal( typeof(res), "object", "object returned");
        done();
      })
    });


    QUnit.test( "'empty DB - ok single - with externalIdPath -> insert'", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        let myId = 'id111';
        let myName = 'T1';

        let res = ipcRenderer.sendSync('smartstore', {method: 'upsertSoupEntries', args: {table : TEST_TABLE, entries : [{Id: myId, Name: myName}], externalIdPath : '_soupEntryId'}});
        console.log(logTag, res);
        assert.equal( res.length, 1, "array of 1 returned");
        assert.equal( typeof(res), "object", "object returned");
        assert.equal( res[0].Id, myId, "Id=" + myId);
        assert.equal( res[0].Name, myName, "Name=" + myName);
        assert.equal( res[0]._soupEntryId, 1, "_soupEntryId = 1");
        assert.notEqual( res[0]._soupLastModifiedDate, null, "_soupLastModifiedDate != null");
        done();
      })
    });


    QUnit.test( "'empty DB - ok single - matching externalIdPath supplied -> insert'", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        let myId = 'id111';
        let myName = 'T1';

        let res = ipcRenderer.sendSync('smartstore', {method: 'upsertSoupEntries', args: {table : TEST_TABLE, entries : [{Id: myId, Name: myName}], externalIdPath : 'Id'}});
        console.log(logTag, res);
        assert.equal( res.length, 1, "array of 1 returned");
        assert.equal( typeof(res), "object", "object returned");
        assert.equal( res[0].Id, myId, "Id=" + myId);
        assert.equal( res[0].Name, myName, "Name=" + myName);
        assert.equal( res[0]._soupEntryId, 1, "_soupEntryId = 1");
        done();
      })
    });



    QUnit.test( "'empty DB - ok multi - externalIdPath supplied -> insert'", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        let myName = 'T1';
        let myName2 = 'T2';

        let res = ipcRenderer.sendSync('smartstore', {method: 'upsertSoupEntries', args: {table : TEST_TABLE, entries : [{Name: myName}, {Name: myName2}], externalIdPath : 'Id'}});
        console.log(logTag, res);
        assert.equal( res.length, 2, "array of 2 returned");
        assert.equal( typeof(res), "object", "object returned");
        assert.equal( res[1].Name, myName, "Name=" + myName);
        assert.equal( res[1]._soupEntryId, 1, "_soupEntryId = 1");
        assert.equal( res[0].Name, myName2, "Name=" + myName2);
        assert.equal( res[0]._soupEntryId, 2, "_soupEntryId = 1");
        done();
      })
    });


    QUnit.test( "'empty DB - ok multi - matching externalIdPath supplied -> insert'", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        let myId = 'id111';
        let myName = 'T1';
        let myId2 = 'id222';
        let myName2 = 'T2';

        let res = ipcRenderer.sendSync('smartstore', {method: 'upsertSoupEntries', args: {table : TEST_TABLE, entries : [{Id: myId, Name: myName}, {Id: myId2, Name: myName2}], externalIdPath : 'Id'}});
        console.log(logTag, res);
        assert.equal( res.length, 2, "array of 2 returned");
        assert.equal( typeof(res), "object", "object returned");
        assert.equal( res[1].Id, myId, "Id=" + myId);
        assert.equal( res[1].Name, myName, "Name=" + myName);
        assert.equal( res[1]._soupEntryId, 1, "_soupEntryId = 1");
        assert.equal( res[0].Id, myId2, "Id=" + myId2);
        assert.equal( res[0].Name, myName2, "Name=" + myName2);
        assert.equal( res[0]._soupEntryId, 2, "_soupEntryId = 1");
        done();
      })
    });


    QUnit.test( "'empty DB - ok multi - mixed externalIdPath supplied -> insert'", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        let myId = 'id111';
        let myName = 'T1';
        let myName2 = 'T2';

        let res = ipcRenderer.sendSync('smartstore', {method: 'upsertSoupEntries', args: {table : TEST_TABLE, entries : [{Id: myId, Name: myName}, {Name: myName2}], externalIdPath : 'Id'}});
        console.log(logTag, res);
        assert.equal( res.length, 2, "array of 2 returned");
        assert.equal( typeof(res), "object", "object returned");
        assert.equal( res[0].Id, myId, "Id=" + myId);
        assert.equal( res[0].Name, myName, "Name=" + myName);
        assert.equal( res[0]._soupEntryId, 2, "_soupEntryId = 1");
        assert.equal( res[1].Name, myName2, "Name=" + myName2);
        assert.equal( res[1]._soupEntryId, 1, "_soupEntryId = 1");
        done();
      })
    });


    QUnit.test( "'non-empty DB - ok single - with externalIdPath -> insert'", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        return addTestData();
      }).then(function(){
        console.log(logTag, "H1");
        myId = 'id333';
        let myName = 'T3';

        let res = ipcRenderer.sendSync('smartstore', {method: 'upsertSoupEntries', args: {table : TEST_TABLE, entries : [{Id: myId, Name: myName}], externalIdPath : '_soupEntryId'}});
        console.log(logTag, res);
        assert.equal( res.length, 1, "array of 1 returned");
        assert.equal( typeof(res), "object", "object returned");
        assert.equal( res[0].Id, myId, "Id=" + myId);
        assert.equal( res[0].Name, myName, "Name=" + myName);
        assert.equal( res[0]._soupEntryId, 3, "_soupEntryId = 3");
        done();
      })
    });


    QUnit.test( "'non-empty DB - ok single - matcing externalIdPath -> insert'", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        return addTestData();
      }).then(function(){
        myId = 'id333';
        let myName = 'T3';

        let res = ipcRenderer.sendSync('smartstore', {method: 'upsertSoupEntries', args: {table : TEST_TABLE, entries : [{Id: myId, Name: myName}], externalIdPath : 'Id'}});
        assert.equal( res.length, 1, "array of 1 returned");
        assert.equal( typeof(res), "object", "object returned");
        assert.equal( res[0].Id, myId, "Id=" + myId);
        assert.equal( res[0].Name, myName, "Name=" + myName);
        assert.equal( res[0]._soupEntryId, 3, "_soupEntryId = 3");
        done();
      })
    });


    QUnit.test( "'non-empty DB - ok multi - with externalIdPath -> insert'", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        return addTestData();
      }).then(function(){
        myId = 'id333';
        let myName = 'T3';
        myId2 = 'id444';
        let myName2 = 'T4';

        let res = ipcRenderer.sendSync('smartstore', {method: 'upsertSoupEntries', args: {table : TEST_TABLE, entries : [{Id: myId, Name: myName},{Id: myId2, Name: myName2}], externalIdPath : 'Id'}});
        assert.equal( res.length, 2, "array of 2 returned");
        assert.equal( typeof(res), "object", "object returned");
        assert.equal( res[1].Id, myId, "Id=" + myId);
        assert.equal( res[1].Name, myName, "Name=" + myName);
        assert.equal( res[1]._soupEntryId, 3, "_soupEntryId = 3");
        assert.equal( res[0].Id, myId2, "Id=" + myId2);
        assert.equal( res[0].Name, myName2, "Name=" + myName2);
        assert.equal( res[0]._soupEntryId, 4, "_soupEntryId = 4");
        done();
      })
    });



    QUnit.test( "'non-empty DB - ok multi - mixed externalIdPath -> insert'", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        return addTestData();
      }).then(function(){
        myId = 'id333';
        let myName = 'T3';
        let myName2 = 'T4';

        let res = ipcRenderer.sendSync('smartstore', {method: 'upsertSoupEntries', args: {table : TEST_TABLE, entries : [{Id: myId, Name: myName},{Name: myName2}], externalIdPath : 'Id'}});
        assert.equal( res.length, 2, "array of 2 returned");
        assert.equal( typeof(res), "object", "object returned");
        assert.equal( res[0].Id, myId, "Id=" + myId);
        assert.equal( res[0].Name, myName, "Name=" + myName);
        assert.equal( res[0]._soupEntryId, 4, "_soupEntryId = 3");
        // assert.equal( res[1].Id, myId2, "Id=" + myId2);
        assert.equal( res[1].Name, myName2, "Name=" + myName2);
        assert.equal( res[1]._soupEntryId, 3, "_soupEntryId = 4");
        done();
      })
    });


    QUnit.test( "'non-empty DB - ok single - matching externalIdPath -> update'", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        return addTestData();
      }).then(function(rows){
        console.log(logTag, "testData", rows);

        let myNewName = 'T3';
        let res = ipcRenderer.sendSync('smartstore', {method: 'upsertSoupEntries', args: {table : TEST_TABLE, entries : [{'Id': rows[0].Id, 'Name': myNewName}], externalIdPath : 'Id'}});
        console.log(logTag, res);
        assert.equal( res.length, 1, "array of 1 returned");
        assert.equal( typeof(res), "object", "object returned");
        assert.equal( res[0].Id, rows[0].Id, "Id=" + rows[0].Id);
        assert.equal( res[0].Name, myNewName, "Name=" + myNewName);
        assert.equal( res[0]._soupEntryId, 1, "_soupEntryId = 1");
        assert.notEqual( res[0]._soupLastModifiedDate, rows[0]._soupLastModifiedDate, "_soupLastModifiedDate (" + res[0]._soupLastModifiedDate + ") != " + rows[0]._soupLastModifiedDate);
        done();
      })
    });


    QUnit.test( "'non-empty DB - ok multi - matching externalIdPath -> update'", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        return addTestData();
      }).then(function(){
        console.log(logTag, "H1");
        myId = 'id111'; // This matches an existing entry
        let myName = 'T3';
        myId2 = 'id222'; // This matches an existing entry
        let myName2 = 'T4';

        let res = ipcRenderer.sendSync('smartstore', {method: 'upsertSoupEntries', args: {table : TEST_TABLE, entries : [{'Id': myId, 'Name': myName},{'Id': myId2, 'Name': myName2}], externalIdPath : 'Id'}});
        console.log(logTag, res);
        assert.equal( res.length, 2, "array of 2 returned");
        assert.equal( typeof(res), "object", "object returned");
        assert.equal( res[0].Id, myId, "[0] Id=" + myId);
        assert.equal( res[0].Name, myName, "[0]Name=" + myName);
        assert.equal( res[0]._soupEntryId, 1, "[0]_soupEntryId = 1");
        assert.equal( res[1].Id, myId2, "[1]Id=" + myId2);
        assert.equal( res[1].Name, myName2, "[1]Name=" + myName2);
        assert.equal( res[1]._soupEntryId, 2, "[1]_soupEntryId = 2");
        done();
      })
    });


    QUnit.test( "'non-empty DB - ok multi - matching externalIdPath -> insert and update'", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        return addTestData();
      }).then(function(){
        console.log(logTag, "H1");
        myId = 'id111'; // This matches an existing entry
        let myName = 'T3';
        myId2 = 'id444'; // This matches an existing entry
        let myName2 = 'T4';

        let res = ipcRenderer.sendSync('smartstore', {method: 'upsertSoupEntries', args: {table : TEST_TABLE, entries : [{'Id': myId, 'Name': myName},{'Id': myId2, 'Name': myName2}], externalIdPath : 'Id'}});
        console.log(logTag, res);
        assert.equal( res.length, 2, "array of 2 returned");
        assert.equal( typeof(res), "object", "object returned");
        assert.equal( res[0].Id, myId, "[0] Id=" + myId);
        assert.equal( res[0].Name, myName, "[0]Name=" + myName);
        let matchingSeid = (res[0]._soupEntryId == 1) ? 1 : 2;
        assert.equal( res[0]._soupEntryId, matchingSeid, "[0]_soupEntryId");
        assert.equal( res[1].Id, myId2, "[1]Id=" + myId2);
        assert.equal( res[1].Name, myName2, "[1]Name=" + myName2);
        assert.equal( res[1]._soupEntryId, 3, "[1]_soupEntryId = 3");
        done();
      })
    });

  }); // end upsertSoupEntries sub module

  /**
   * Q U E R Y    S O U P
   */
  QUnit.module("querySoup", function() {

    // TODO - Need to check real device response for this
    QUnit.skip( "unknown table", function( assert ) {

    });


    QUnit.test( "empty table", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        let smartstore = cordova.require("com.salesforce.plugin.smartstore");
        let querySpec = smartstore.buildAllQuerySpec("_soupEntryId", null, 50);

        let res = ipcRenderer.sendSync('smartstore', {method: 'querySoup', args: {table : TEST_TABLE,querySpec : querySpec}});
        console.log(logTag, res);
        assert.equal( res.length, 0, "array of 0 returned");
        assert.equal( typeof(res), "object", "object returned");
        done();
      });
    });


    QUnit.test( "all", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        return addTestData();
      }).then(function(){
        let smartstore = cordova.require("com.salesforce.plugin.smartstore");
        let querySpec = smartstore.buildAllQuerySpec("_soupEntryId", null, 50);

        let res = ipcRenderer.sendSync('smartstore', {method: 'querySoup', args: {table : TEST_TABLE,querySpec : querySpec}});
        console.log(logTag, res);
        assert.equal( res.length, 2, "array of 2 returned");
        assert.equal( typeof(res), "object", "object returned");
        done();
      });
    });



    QUnit.test( "col = val - no match single", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        return addTestData();
      }).then(function(){
        let smartstore = cordova.require("com.salesforce.plugin.smartstore");
        let querySpec = smartstore.buildExactQuerySpec("Id", "DUFF", 50);

        let res = ipcRenderer.sendSync('smartstore', {method: 'querySoup', args: {table : TEST_TABLE,querySpec : querySpec}});
        console.log(logTag, res);
        assert.equal( res.length, 0, "array of 0 returned");
        assert.equal( typeof(res), "object", "object returned");
        done();
      });
    });


    QUnit.test( "col = val - match single", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        return addTestData();
      }).then(function(){
        let smartstore = cordova.require("com.salesforce.plugin.smartstore");
        let querySpec = smartstore.buildExactQuerySpec("Id", testData[0].Id, 50);

        let res = ipcRenderer.sendSync('smartstore', {method: 'querySoup', args: {table : TEST_TABLE,querySpec : querySpec}});
        console.log(logTag, res);
        assert.equal( res.length, 1, "array of 1 returned");
        assert.equal( typeof(res), "object", "object returned");
        assert.equal( res[0].Name, testData[0].Name, "[0]Name=" + testData[0].Name);
        done();
      });
    });


    QUnit.test( "col = val - match multi", function( assert ) {
      var done = assert.async();
      createTestSoup(TEST_TABLE).then(function(){
        return addTestData2();
      }).then(function(){
        let smartstore = cordova.require("com.salesforce.plugin.smartstore");
        let querySpec = smartstore.buildExactQuerySpec("Name", testData2[0].Name, 50);

        let res = ipcRenderer.sendSync('smartstore', {method: 'querySoup', args: {table : TEST_TABLE,querySpec : querySpec}});
        console.log(logTag, res);
        assert.equal( res.length, 2, "array of 2 returned");
        assert.equal( typeof(res), "object", "object returned");
        assert.equal( res[0].Id, testData2[0].Id, "[0]Id=" + testData2[0].Id);
        assert.equal( res[1].Id, testData2[1].Id, "[0]Id=" + testData2[1].Id);
        done();
      });
    });
  }); // end querySoup sub module

});



/*******************************************************************************
*
* M O C K C O R D O V A    T E S T S
*
*******************************************************************************/
QUnit.module( "MockCordova", function( hooks ){
  hooks.beforeEach(function() {
    setLogTag();
  });

  /**
   * registerSoup
   */
	QUnit.test( "registerSoup", function( assert ) {
		assert.expect( 6 );
  	var done = assert.async( 6 );

		var smartstore = cordova.require("com.salesforce.plugin.smartstore");
		soups.forEach(function(soup) {
			smartstore.registerSoup(soup.table, soup.indexSpecs, function(res){
				console.log(logTag,"MockCordova registerSoup", res);
				assert.ok( res == soup.table, "registerSoup : "  + soup.table);
				done();
			});
		});
	});


  /**
   * soupExists
   */
	QUnit.test( "soupExists", function( assert ) {
		assert.expect( 7 );
  	var done = assert.async( 7 );

		var smartstore = cordova.require("com.salesforce.plugin.smartstore");
		soups.forEach(function(soup) {
			smartstore.soupExists(soup.table, function(soupExists){
				console.log(logTag,"MockCordova soupExists", soupExists);
				assert.ok( soupExists == true, "soupExists : "  + soup.table);
				done();
			});
		});

		smartstore.soupExists('DUFF', function(soupExists){
  		assert.ok( soupExists == false, "soup DOESN'T Exist : DUFF");
  		done();
  	});
	});


  /**
   * removeSoup
   */
	QUnit.test( "removeSoup", function( assert ) {
		assert.expect( 7 );
  	var done = assert.async( 7 );

		var smartstore = cordova.require("com.salesforce.plugin.smartstore");
		soups.forEach(function(soup) {
			smartstore.removeSoup(soup.table, function(res){
				console.log(logTag,"MockCordova removeSoup", res);
				assert.ok( res == "OK", "soup removed : "  + soup.table);
				done();
			});
		});

		smartstore.removeSoup('DUFF', function(res){
			console.log(logTag,"res", res);
  		assert.ok( res == "OK", "soup DOESN'T Exist : DUFF");
  		done();
  	});
	});

});// end MockCordova Module