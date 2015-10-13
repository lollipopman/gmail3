function getMsgConsumers() {
  var msgConsumers = [];

  var topSenders = {
    name: "Top Senders",
    db: null,
    ssID: null,
    chart: null,
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
      .setTitle(this.name)
      .setOption('vAxis', {title: "Sender"})
      .setOption('hAxis', {title: "Message Count", format: "decimal"})
      .setDimensions(1024, 768)
      .setOption('chartArea', {left: '40%'})
      .setDataSourceUrl(dataSourceURL);
      this.chart = chartBuilder.build();
    },
  };

  var topMailingLists = {
    name: "Top Mailing Lists",
    db: null,
    ssID: null,
    chart: null,
    initSpreadSheet: function () {
      var ss = SpreadsheetApp.openById(this.ssID);
      var sheet = ss.insertSheet(this.name);
      sheet.appendRow(["MailingList", "Count"]);
    },
    msgFunction: function (msg) {
      var headers = extractHeaders(msg.getRawContent());
      if (headers.hasOwnProperty("list-id") && headers["list-id"].length === 1) {
        var listId = extractEmailAddress(headers["list-id"]);
        var rows = objDB.getRows(this.db, this.name, ['MailingList','Count'], {MailingList:listId});
        if ( rows.length === 0) {
          objDB.insertRow(this.db, this.name, {MailingList:listId, Count:1} );
        } else {
          var newCount = rows[0].Count + 1;
          objDB.updateRow(this.db, this.name, {MailingList:listId, Count:newCount}, {MailingList:listId} );
        }
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
      .setTitle(this.name)
      .setDimensions(1024, 768)
      .setOption('vAxis', {title: "Mailing List"})
      .setOption('hAxis', {title: "Message Count", format: "decimal"})
      .setOption('chartArea', {left: '40%'})
      .setDataSourceUrl(dataSourceURL);
      this.chart = chartBuilder.build();
    },
  };

  var topNonMailingListSenders = {
    name: "Top Non Mailing List Senders",
    db: null,
    ssID: null,
    chart: null,
    initSpreadSheet: function () {
      var ss = SpreadsheetApp.openById(this.ssID);
      var sheet = ss.insertSheet(this.name);
      sheet.appendRow(["From", "Count"]);
    },
    msgFunction: function (msg) {
      var headers = extractHeaders(msg.getRawContent());
      if (! headers.hasOwnProperty("list-id")) {
        var rawFrom = msg.getFrom();
        var from = extractEmailAddress(rawFrom);
        var rows = objDB.getRows(this.db, this.name, ['From','Count'], {From:from});
        if ( rows.length === 0) {
          objDB.insertRow(this.db, this.name, {From:from, Count:1} );
        } else {
          var newCount = rows[0].Count + 1;
          objDB.updateRow(this.db, this.name, {From:from, Count:newCount}, {From:from} );
        }
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
      .setTitle(this.name)
      .setDimensions(1024, 768)
      .setOption('vAxis', {title: "Sender"})
      .setOption('hAxis', {title: "Message Count", format: "decimal"})
      .setOption('chartArea', {left: '40%'})
      .setDataSourceUrl(dataSourceURL);
      this.chart = chartBuilder.build();
    },
  };

  msgConsumers.push(topSenders);
  msgConsumers.push(topMailingLists);
  msgConsumers.push(topNonMailingListSenders);

  return msgConsumers;
}
