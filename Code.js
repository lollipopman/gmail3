function main() {
  var i;
  var msgConsumers = [{
    name: "Top Senders",
    db: null,
    ssID: null,
    initSpreadSheet: function () {
      var ss = SpreadsheetApp.openById(this.ssID);
      var sheet = ss.insertSheet(this.name);
      sheet.appendRow(["From", "Count"]);
    },
    msgFunction: function (msg) {
      var rawFrom = msg.getFrom();
      var from = extractEmailAddress(rawFrom);
      var rows = objDB.getRows(this.db, this.name, ['From','Count'], {From:from});
      if ( rows.length === 0) {
        objDB.insertRow(this.db, this.name, {From:from, Count:1} );
      } else {
        var newCount = rows[0].Count + 1;
        objDB.updateRow(this.db, this.name, {From:from, Count:newCount}, {From:from} );
      }
    },
    graphFunction: function () {
      var ss = SpreadsheetApp.openById(this.ssID);
      var sheetID = ss.getSheetByName(this.name).getSheetId();
      var encodedQuery = encodeURIComponent("select A,B order by B desc limit 10");
      var dataSourceURL = 'https://docs.google.com/spreadsheet/tq?key=' + this.ssID;
      dataSourceURL += '&tq=' + encodedQuery;
      dataSourceURL += '&gid=' + sheetID;
      dataSourceURL += '&headers=-1';
      var chartBuilder = Charts.newBarChart()
      .setTitle('Top Senders')
      .setXAxisTitle('Count')
      .setYAxisTitle('Sender')
      .setDimensions(1024, 768)
      .setOption('hAxis.format', {format: 'decimal'})
      .setOption('chartArea', {left: '40%'})
      .setDataSourceUrl(dataSourceURL);
      var chart = chartBuilder.build();
      return chart.getAs('image/png').setName("chart.png");
    },
  }
  ];

  var dataPopulated = false;
  var userProperties = PropertiesService.getUserProperties();
  var ssID = userProperties.getProperty("ssID");

  if (ssID === null) {
    Logger.log("Spreadsheet ID not set, creating a new one");
    ssInfo = createSpreadSheet(userProperties);
    ssID = userProperties.getProperty('ssID');
    // This is needed so we can use the Google Visualization API Query Language
    // to set the data source URL
    allowPublicViewing(ssID);
  } else {
    dataPopulated = true;
  }

  var ss = SpreadsheetApp.openById(ssID);
  var db = objDB.open(ssID);

  for(i = 0; i < msgConsumers.length; i += 1) {
    msgConsumers[i].db = db;
    msgConsumers[i].ssID = ssID;
  }
  
  if (! dataPopulated) {
    for(i = 0; i < msgConsumers.length; i += 1) {
      msgConsumers[i].initSpreadSheet();
    }
    searchGmail(msgConsumers);
  }

  var chartBlobs = [];
  for(i = 0; i < msgConsumers.length; i += 1) {
    chartBlobs.push(msgConsumers[i].graphFunction());
  }

  Logger.log('Sending Email');
  for(i = 0; i < chartBlobs.length; i += 1) {
    sendEmail(chartBlobs[i]);
  }

  if (ss.getSheetByName("Sheet1") !== null) {
    ss.deleteSheet(ss.getSheetByName("Sheet1"));
  }
}

function clearUserProperties() {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteAllProperties();
}

function extractEmailAddress(emailAddress) {
  emailAddressRegex = /^(?:.*<)?([^<>]+)(?:>)?$/;
  return emailAddressRegex.exec(emailAddress)[1].toLowerCase();
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
  var ssNew = SpreadsheetApp.create("email email email - " + Date());
  var ssID = ssNew.getUrl().split('/')[7];
  userProperties.setProperty('ssID', ssID);
}

function searchGmail(msgConsumers) {
  var batchSize = 10;
  // Process up to 100 gmail threads at once
  for (j = 0; j < 100; j+=batchSize) {
    Logger.log('Searching');
    var threads = GmailApp.search('after:2015/07/30 before:2015/08/01', j, batchSize);
    Logger.log('Search Complete: ' + threads.length);
    for (thread = 0; thread < threads.length; thread += 1) {
      var msg = threads[thread].getMessages()[0];
      for(var i = 0; i < msgConsumers.length; i += 1) {
        msgConsumers[i].msgFunction(msg);
      }
    }
    Logger.log('Batch: ' + j);
  }
}
