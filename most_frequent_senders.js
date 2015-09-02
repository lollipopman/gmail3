function main() {
  Logger.log('Starting');
  var userProperties = PropertiesService.getUserProperties();
  ssID = userProperties.getProperty('ssID')
  if ( ssID == null ) {
    Logger.log("Spreadsheet ID not set, creating a new one")
    var spreadsheet_new = SpreadsheetApp.create("email email email - " + Date());
    ssID = spreadsheet_new.getUrl().split('/')[7]
    userProperties.setProperty('ssID', ssID)
    var ss = SpreadsheetApp.openById(ssID);
    Logger.log(ss.getName());
    var sheet = ss.getSheets()[0];
    sheet.appendRow(["From", "Count"]);
  }
  var db = objDB.open( ssID );
  var batchSize = 10

  // Process up to 100 threads at once
  for (j = 0; j < 100; j+=batchSize) {
    Logger.log('Searching');
    var threads = GmailApp.search('after:2015/07/30 before:2015/08/01', j, batchSize);
    Logger.log('Search Complete: ' + threads.length);
    for (thread = 0; thread < threads.length; thread += 1) {
      var messages = threads[thread].getMessages();
      var from = messages[0].getFrom();
      var rows = objDB.getRows( db, 'Sheet1', ['From','Count'], {From:from} );
      if ( rows.length == 0) {
        Logger.log( {From:from, Count:1} );
        objDB.insertRow( db, 'Sheet1', {From:from, Count:1} );
      } else {
        var newCount = rows[0].Count + 1
        Logger.log( {From:from, Count:newCount} );
        objDB.updateRow( db, 'Sheet1', {From:from, Count:newCount}, {From:from} );
      }
    }
    Logger.log('Batch: ' + j);
  }
}

function clearUserProperties() {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteAllProperties();
}
