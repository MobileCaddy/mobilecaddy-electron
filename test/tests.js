
// NAUGHTY NAUGHTY - THESE SHOULD BE RUN SEQUENTIALLY

const ipcRenderer = require('electron').ipcRenderer;
var device = ipcRenderer.sendSync('request-device-info', '');

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
  }
]

QUnit.config.reorder = false;

QUnit.module( "IPC", function() {
	QUnit.test( "registerSoup / soupExists", function( assert ) {
	  soups.forEach(function(soup) {
		  let soupExists = ipcRenderer.sendSync('smartstore', {method: 'soupExists', args: {table: soup.table}});
		  console.log("soupExists", soupExists);
		  if (!soupExists) {
		  	ipcRenderer.sendSync('smartstore', {method: 'registerSoup', args: soup});
		  	soupExists = ipcRenderer.sendSync('smartstore', {method: 'soupExists', args: {table: soup.table}});
		  }
	  	assert.ok( soupExists == true, "soupExists : "  + soup.table);
	  });

	  soupExists = ipcRenderer.sendSync('smartstore', {method: 'soupExists', args: {table: 'DUFF'}});
  	assert.ok( soupExists == false, "soup DOESN'T Exist : DUFF");
	});

	QUnit.test( "removeSoup / soupExists", function( assert ) {
	  soups.forEach(function(soup) {
		  let soupExists = ipcRenderer.sendSync('smartstore', {method: 'soupExists', args: {table: soup.table}});
		  console.log("soupExists", soupExists);
		  if (soupExists) {
		  	ipcRenderer.sendSync('smartstore', {method: 'removeSoup', args: soup});
		  	soupExists = ipcRenderer.sendSync('smartstore', {method: 'soupExists', args: {table: soup.table}});
		  }
	  	assert.ok( soupExists == false, "soup DOESN'T Exist : "  + soup.table);
	  });
	});

});


QUnit.module( "MockCordova", function() {
	QUnit.test( "registerSoup", function( assert ) {
		assert.expect( 5 );
  	var done = assert.async( 5 );

		var smartstore = cordova.require("com.salesforce.plugin.smartstore");
		soups.forEach(function(soup) {
			smartstore.registerSoup(soup.table, soup.indexSpecs, function(res){
				console.log("MockCordova registerSoup", res);
				assert.ok( res == soup.table, "registerSoup : "  + soup.table);
				done();
			});
		});
	});

	QUnit.test( "soupExists", function( assert ) {
		assert.expect( 6 );
  	var done = assert.async( 6 );

		var smartstore = cordova.require("com.salesforce.plugin.smartstore");
		soups.forEach(function(soup) {
			smartstore.soupExists(soup.table, function(soupExists){
				console.log("MockCordova soupExists", soupExists);
				assert.ok( soupExists == true, "soupExists : "  + soup.table);
				done();
			});
		});

		smartstore.soupExists('DUFF', function(soupExists){
  		assert.ok( soupExists == false, "soup DOESN'T Exist : DUFF");
  		done();
  	});
	});

	QUnit.test( "removeSoup", function( assert ) {
		assert.expect( 6 );
  	var done = assert.async( 6 );

		var smartstore = cordova.require("com.salesforce.plugin.smartstore");
		soups.forEach(function(soup) {
			smartstore.removeSoup(soup.table, function(res){
				console.log("MockCordova removeSoup", res);
				assert.ok( res == "OK", "soup removed : "  + soup.table);
				done();
			});
		});

		smartstore.removeSoup('DUFF', function(res){
			console.log("res", res);
  		assert.ok( res == "OK", "soup DOESN'T Exist : DUFF");
  		done();
  	});
	});

});