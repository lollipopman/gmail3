function getMsgConsumers(scriptState) {
  var db = objDB.open(scriptState.ssID);
  var msgConsumers = [];

  var topSenders = {
    name: "Top Senders",
    db: null,
    scriptState: null,
    chart: null,
    initSpreadSheet: function () {
      var ss = SpreadsheetApp.openById(this.scriptState.ssID);
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
      var ss = SpreadsheetApp.openById(this.scriptState.ssID);
      var sheetID = ss.getSheetByName(this.name).getSheetId();
      var encodedQuery = encodeURIComponent("select A,B order by B desc limit 10");
      var dataSourceURL = 'https://docs.google.com/spreadsheet/tq?key=' + this.scriptState.ssID;
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
    scriptState: null,
    chart: null,
    initSpreadSheet: function () {
      var ss = SpreadsheetApp.openById(this.scriptState.ssID);
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
      var ss = SpreadsheetApp.openById(this.scriptState.ssID);
      var sheetID = ss.getSheetByName(this.name).getSheetId();
      var encodedQuery = encodeURIComponent("select A,B order by B desc limit 10");
      var dataSourceURL = 'https://docs.google.com/spreadsheet/tq?key=' + this.scriptState.ssID;
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
    scriptState: null,
    chart: null,
    initSpreadSheet: function () {
      var ss = SpreadsheetApp.openById(this.scriptState.ssID);
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
      var ss = SpreadsheetApp.openById(this.scriptState.ssID);
      var sheetID = ss.getSheetByName(this.name).getSheetId();
      var encodedQuery = encodeURIComponent("select A,B order by B desc limit 10");
      var dataSourceURL = 'https://docs.google.com/spreadsheet/tq?key=' + this.scriptState.ssID;
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

  var topRobotSenders = {
    name: "Top Robot Senders",
    db: null,
    scriptState: null,
    chart: null,
    initSpreadSheet: function () {
      var ss = SpreadsheetApp.openById(this.scriptState.ssID);
      var sheet = ss.insertSheet(this.name);
      sheet.appendRow(["From", "Count"]);
    },
    msgFunction: function (msg) {
      if (emailSentByRobot(msg.getRawContent())) {
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
      var ss = SpreadsheetApp.openById(this.scriptState.ssID);
      var sheetID = ss.getSheetByName(this.name).getSheetId();
      var encodedQuery = encodeURIComponent("select A,B order by B desc limit 10");
      var dataSourceURL = 'https://docs.google.com/spreadsheet/tq?key=' + this.scriptState.ssID;
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

  var topHumanSenders = {
    name: "Top Human Senders",
    db: null,
    scriptState: null,
    chart: null,
    initSpreadSheet: function () {
      var ss = SpreadsheetApp.openById(this.scriptState.ssID);
      var sheet = ss.insertSheet(this.name);
      sheet.appendRow(["From", "Count"]);
    },
    msgFunction: function (msg) {
      if (! emailSentByRobot(msg.getRawContent())) {
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
      var ss = SpreadsheetApp.openById(this.scriptState.ssID);
      var sheetID = ss.getSheetByName(this.name).getSheetId();
      var encodedQuery = encodeURIComponent("select A,B order by B desc limit 10");
      var dataSourceURL = 'https://docs.google.com/spreadsheet/tq?key=' + this.scriptState.ssID;
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

  var topApplicationErrors = {
    name: "Top Application Errors",
    db: null,
    scriptState: null,
    chart: null,
    initSpreadSheet: function () {
      var ss = SpreadsheetApp.openById(this.scriptState.ssID);
      var sheet = ss.insertSheet(this.name);
      sheet.appendRow(["Subject", "Count"]);
    },
    msgFunction: function (msg) {
      var fullSubject = msg.getSubject();
      // This is a crude attempt to group errors together, by only including
      // the first three words of the error.
      var errorRegex = /^\[Error [^\]]+\]\s\S+\s\S+\s\S+/;
      var match = fullSubject.match(errorRegex);
      if (match !== null) {
        var subject = match[0];
        var rows = objDB.getRows(this.db, this.name, ['Subject','Count'], {Subject:subject});
        if ( rows.length === 0) {
          objDB.insertRow(this.db, this.name, {Subject:subject, Count:1} );
        } else {
          var newCount = rows[0].Count + 1;
          objDB.updateRow(this.db, this.name, {Subject:subject, Count:newCount}, {Subject:subject} );
        }
      }
    },
    graphFunction: function () {
      var ss = SpreadsheetApp.openById(this.scriptState.ssID);
      var sheetID = ss.getSheetByName(this.name).getSheetId();
      var encodedQuery = encodeURIComponent("select A,B order by B desc limit 10");
      var dataSourceURL = 'https://docs.google.com/spreadsheet/tq?key=' + this.scriptState.ssID;
      dataSourceURL += '&tq=' + encodedQuery;
      dataSourceURL += '&gid=' + sheetID;
      dataSourceURL += '&headers=-1';
      var chartBuilder = Charts.newBarChart()
      .setTitle(this.name)
      .setDimensions(1024, 768)
      .setOption('vAxis', {title: "Application Error Partial Subject", textStyle: {fontSize: 10}})
      .setOption('hAxis', {title: "Message Count", format: "decimal"})
      .setOption('chartArea', {left: '50%'})
      .setDataSourceUrl(dataSourceURL);
      this.chart = chartBuilder.build();
    },
  };

  var historicalEmailVolume = {
    name: "Historical Email Volume",
    db: null,
    scriptState: null,
    chart: null,
    initSpreadSheet: function () {
      var ss = SpreadsheetApp.openById(this.scriptState.ssID);
      var sheet = ss.insertSheet(this.name);
      sheet.appendRow(["MailingList", "Human"]);
    },
    msgFunction: function (msg) {
      var rows = objDB.getRows(this.db, this.name, ['MailingList','Human']);
      var headers = extractHeaders(msg.getRawContent());
      if (headers.hasOwnProperty("list-id") && headers["list-id"].length === 1) {
        if (rows.length === 0) {
          objDB.insertRow(this.db, this.name, {MailingList:1, Human:0} );
        } else {
          objDB.updateRow(this.db, this.name, {MailingList:(rows[0].MailingList + 1), Human:rows[0].Human});
        }
      } else {
        if (rows.length === 0) {
          objDB.insertRow(this.db, this.name, {MailingList:0, Human:1} );
        } else {
          objDB.updateRow(this.db, this.name, {MailingList:rows[0].MailingList, Human:(rows[0].Human + 1)});
        }
      }
    },
    graphFunction: function () {
      var historicalData = Charts.newDataTable()
        .addColumn(Charts.ColumnType.STRING, "Month")
        .addColumn(Charts.ColumnType.NUMBER, "MailingList")
        .addColumn(Charts.ColumnType.NUMBER, "Human");
      var rows;
      var file;
      var monthDatabase;
      var months = 0;
      var month = scriptState.monthToProcess.clone();
      var files = DriveApp.getFilesByName("Email3 Data - " + month.format('MMM YYYY'));
      while (months < 11 && files.hasNext()) {
        file = files.next();
        if (file.isTrashed()) {
          continue;
        }
        Logger.log(file.getName());
        monthDatabase = objDB.open(file.getId());
        rows = objDB.getRows(monthDatabase, this.name, ['MailingList','Human']);
        if (rows.length === 1) {
          Logger.log("MailingList: " + rows[0].MailingList + " Human: " + rows[0].Human);
          historicalData.addRow([month.format('MMM YYYY'), rows[0].MailingList, rows[0].Human]);
        }
        months += 1;
        month = month.subtract(1, 'days').startOf('month');
        files = DriveApp.getFilesByName("Email3 Data - " + month.format('MMM YYYY'));
      }

      var chartBuilder = Charts.newAreaChart()
        .setTitle(this.name)
        .setXAxisTitle('Month')
        .setYAxisTitle('Message Count')
        .setDimensions(1024, 768)
        .setStacked()
        .setPointStyle(Charts.PointStyle.MEDIUM)
        .setDataTable(historicalData);
      this.chart = chartBuilder.build();
    },
  };

  msgConsumers.push(historicalEmailVolume);
  msgConsumers.push(topSenders);
  msgConsumers.push(topMailingLists);
  msgConsumers.push(topNonMailingListSenders);
  msgConsumers.push(topRobotSenders);
  msgConsumers.push(topHumanSenders);
  msgConsumers.push(topApplicationErrors);

  for(i = 0; i < msgConsumers.length; i += 1) {
    msgConsumers[i].db = db;
    msgConsumers[i].scriptState = scriptState;
  }

  return msgConsumers;
}
