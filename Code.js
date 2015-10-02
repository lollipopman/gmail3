function clearUserProperties() {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteAllProperties();
}

function sendEmail(msgConsumers) {
  var htmlBody = "";
  var inlineImages = {};
  var blob;

  for(i = 0; i < msgConsumers.length; i += 1) {
    htmlBody += msgConsumers[i].name + " <img src='cid:" + i + "'> <br>\n";
    blob = msgConsumers[i].chart.getAs('image/png').setName(msgConsumers[i].name + ".png");
    inlineImages[i] = blob;
  }

  MailApp.sendEmail({
    to: "jesse.hathaway@getbraintree.com",
    subject: "Email Email Email!",
    htmlBody: htmlBody,
    inlineImages: inlineImages
  });
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

function main() {
  var i;
  var dataPopulated = false;
  var userProperties = PropertiesService.getUserProperties();
  var ssID = userProperties.getProperty("ssID");
  var msgConsumers = getMsgConsumers();

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

  for(i = 0; i < msgConsumers.length; i += 1) {
    msgConsumers[i].graphFunction();
  }

  Logger.log('Sending Email');
  sendEmail(msgConsumers);

  if (ss.getSheetByName("Sheet1") !== null) {
    ss.deleteSheet(ss.getSheetByName("Sheet1"));
  }
}
