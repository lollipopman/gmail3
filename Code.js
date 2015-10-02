function main() {
  var userProperties = PropertiesService.getUserProperties();

  ssID = userProperties.getProperty('ssID');

  if ( ssID === null ) {
    Logger.log("Spreadsheet ID not set, creating a new one");
    ssInfo = createSpreadSheet(userProperties);
    ssID = userProperties.getProperty('ssID');
    populateSpreadSheet(ssID);
    // This is needed so we can use the Google Visualization API Query Language
    // to set the data source URL
    allowPublicViewing(ssID);
  }

  Logger.log('ssID' + ssID);
  Logger.log('Drawing Bar Chart');
  chartBlob = drawChart(ssID);
  Logger.log('Sending Email');
  sendEmail(chartBlob);
}

function clearUserProperties() {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteAllProperties();
}

function extractEmailAddress(emailAddress) {
  emailAddressRegex = /^(?:.*<)?([^<>]+)(?:>)?$/;
  return emailAddressRegex.exec(emailAddress)[1].toLowerCase();
}

function drawChart(ssID) {
  encodedQuery = encodeURIComponent("select A,B order by B desc limit 10");
  dataSourceUrl = 'https://docs.google.com/spreadsheet/tq?key=' + ssID + '&tq=' + encodedQuery + '&headers=-1';
  var chartBuilder = Charts.newBarChart()
  .setTitle('Top Senders')
  .setXAxisTitle('Count')
  .setYAxisTitle('Sender')
  .setDimensions(1024, 768)
  .setOption('hAxis.format', {format: 'decimal'})
  .setOption('chartArea', {left: '40%'})
  .setDataSourceUrl(dataSourceUrl);

  // .setLegendPosition(Charts.Position.NONE)
  // .setOption('fontSize', 10)

  // var chartBuilder = Charts.newPieChart()
  // .setTitle('Top Recepients')
  // .setDimensions(1024, 768)
  // .setDataSourceUrl('https://docs.google.com/spreadsheet/tq?key=' + ssID + '&tq=select%20A%2CB%20order%20by%20B%20desc%20limit%205&headers=-1');

  var chart = chartBuilder.build();
  return chart.getAs('image/png').setName("chart.png");
}

function sendEmail(chartBlob) {
  MailApp.sendEmail({
    to: "jesse.hathaway@getbraintree.com",
    subject: "Email Email Email!",
    htmlBody: "inline chart <img src='cid:chart'> images! <br>",
    inlineImages:
      {
      chart: chartBlob
    }
  });
}

function allowPublicViewing(ID) {
  file = DriveApp.getFileById(ID);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
}

function createSpreadSheet(userProperties) {
  var spreadsheet_new = SpreadsheetApp.create("email email email - " + Date());

  ssID = spreadsheet_new.getUrl().split('/')[7];
  userProperties.setProperty('ssID', ssID);

  var ss = SpreadsheetApp.openById(ssID);
  var sheet = ss.getSheets()[0];
  sheet.appendRow(["From", "Count"]);
}

function populateSpreadSheet(ssID) {
  var db = objDB.open(ssID);
  var batchSize = 10;
  // Process up to 100 gmail threads at once
  for (j = 0; j < 100; j+=batchSize) {
    Logger.log('Searching');
    var threads = GmailApp.search('after:2015/07/30 before:2015/08/01', j, batchSize);
    Logger.log('Search Complete: ' + threads.length);
    for (thread = 0; thread < threads.length; thread += 1) {
      var messages = threads[thread].getMessages();
      var rawFrom = messages[0].getFrom();
      var from = extractEmailAddress(rawFrom);
      var rows = objDB.getRows( db, 'Sheet1', ['From','Count'], {From:from} );
      if ( rows.length === 0) {
        objDB.insertRow( db, 'Sheet1', {From:from, Count:1} );
      } else {
        var newCount = rows[0].Count + 1;
        objDB.updateRow( db, 'Sheet1', {From:from, Count:newCount}, {From:from} );
      }
    }
    Logger.log('Batch: ' + j);
  }
}
