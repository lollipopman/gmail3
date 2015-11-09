function gmail3AddMsgConsumers() {
  var historicalEmailVolume = {
    name: "Historical Email Volume",
    chart: null,
    initSpreadSheet: function (ss) {
      var sheet = ss.insertSheet(this.name);
      sheet.appendRow(["MailingList", "Human"]);
    },
    isEmpty: function (db) {
      return gmail3.isEmpty(db, this.name);
    },
    msgFunction: function (msg, db) {
      var rows = objDB.getRows(db, this.name, ['MailingList','Human']);
      var headers = gmail3.extractHeaders(msg.getRawContent());
      if (headers.hasOwnProperty("list-id") && headers["list-id"].length === 1) {
        if (rows.length === 0) {
          objDB.insertRow(db, this.name, {MailingList:1, Human:0} );
        } else {
          objDB.updateRow(db, this.name, {MailingList:(rows[0].MailingList + 1), Human:rows[0].Human});
        }
      } else {
        if (rows.length === 0) {
          objDB.insertRow(db, this.name, {MailingList:0, Human:1} );
        } else {
          objDB.updateRow(db, this.name, {MailingList:rows[0].MailingList, Human:(rows[0].Human + 1)});
        }
      }
    },
    graphFunction: function (scriptState) {
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

  var topSenders = {
    name: "Top Senders",
    chart: null,
    initSpreadSheet: function (ss) {
      var sheet = ss.insertSheet(this.name);
      sheet.appendRow(["From", "Count"]);
    },
    isEmpty: function (db) {
      return gmail3.isEmpty(db, this.name);
    },
    msgFunction: function (msg, db) {
      var rawFrom = msg.getFrom();
      var from = gmail3.extractEmailAddress(rawFrom);
      var rows = objDB.getRows(db, this.name, ['From','Count'], {From:from});
      if ( rows.length === 0) {
        objDB.insertRow(db, this.name, {From:from, Count:1} );
      } else {
        var newCount = rows[0].Count + 1;
        objDB.updateRow(db, this.name, {From:from, Count:newCount}, {From:from} );
      }
    },
    graphFunction: function (scriptState) {
      var ss = SpreadsheetApp.openById(scriptState.ssID);
      var sheetID = ss.getSheetByName(this.name).getSheetId();
      var encodedQuery = encodeURIComponent("select A,B order by B desc limit 10");
      var dataSourceURL = 'https://docs.google.com/spreadsheet/tq?key=' + scriptState.ssID;
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
    chart: null,
    initSpreadSheet: function (ss) {
      var sheet = ss.insertSheet(this.name);
      sheet.appendRow(["MailingList", "Count"]);
    },
    isEmpty: function (db) {
      return gmail3.isEmpty(db, this.name);
    },
    msgFunction: function (msg, db) {
      var headers = gmail3.extractHeaders(msg.getRawContent());
      if (headers.hasOwnProperty("list-id") && headers["list-id"].length === 1) {
        var listId = gmail3.extractEmailAddress(headers["list-id"]);
        var rows = objDB.getRows(db, this.name, ['MailingList','Count'], {MailingList:listId});
        if ( rows.length === 0) {
          objDB.insertRow(db, this.name, {MailingList:listId, Count:1} );
        } else {
          var newCount = rows[0].Count + 1;
          objDB.updateRow(db, this.name, {MailingList:listId, Count:newCount}, {MailingList:listId} );
        }
      }
    },
    graphFunction: function (scriptState) {
      var ss = SpreadsheetApp.openById(scriptState.ssID);
      var sheetID = ss.getSheetByName(this.name).getSheetId();
      var encodedQuery = encodeURIComponent("select A,B order by B desc limit 10");
      var dataSourceURL = 'https://docs.google.com/spreadsheet/tq?key=' + scriptState.ssID;
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
    chart: null,
    initSpreadSheet: function (ss) {
      var sheet = ss.insertSheet(this.name);
      sheet.appendRow(["From", "Count"]);
    },
    isEmpty: function (db) {
      return gmail3.isEmpty(db, this.name);
    },
    msgFunction: function (msg, db) {
      var headers = gmail3.extractHeaders(msg.getRawContent());
      if (! headers.hasOwnProperty("list-id")) {
        var rawFrom = msg.getFrom();
        var from = gmail3.extractEmailAddress(rawFrom);
        var rows = objDB.getRows(db, this.name, ['From','Count'], {From:from});
        if ( rows.length === 0) {
          objDB.insertRow(db, this.name, {From:from, Count:1} );
        } else {
          var newCount = rows[0].Count + 1;
          objDB.updateRow(db, this.name, {From:from, Count:newCount}, {From:from} );
        }
      }
    },
    graphFunction: function (scriptState) {
      var ss = SpreadsheetApp.openById(scriptState.ssID);
      var sheetID = ss.getSheetByName(this.name).getSheetId();
      var encodedQuery = encodeURIComponent("select A,B order by B desc limit 10");
      var dataSourceURL = 'https://docs.google.com/spreadsheet/tq?key=' + scriptState.ssID;
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
    chart: null,
    initSpreadSheet: function (ss) {
      var sheet = ss.insertSheet(this.name);
      sheet.appendRow(["From", "Count"]);
    },
    isEmpty: function (db) {
      return gmail3.isEmpty(db, this.name);
    },
    msgFunction: function (msg, db) {
      if (gmail3.emailSentByRobot(msg.getRawContent())) {
        var rawFrom = msg.getFrom();
        var from = gmail3.extractEmailAddress(rawFrom);
        var rows = objDB.getRows(db, this.name, ['From','Count'], {From:from});
        if ( rows.length === 0) {
          objDB.insertRow(db, this.name, {From:from, Count:1} );
        } else {
          var newCount = rows[0].Count + 1;
          objDB.updateRow(db, this.name, {From:from, Count:newCount}, {From:from} );
        }
      }
    },
    graphFunction: function (scriptState) {
      var ss = SpreadsheetApp.openById(scriptState.ssID);
      var sheetID = ss.getSheetByName(this.name).getSheetId();
      var encodedQuery = encodeURIComponent("select A,B order by B desc limit 10");
      var dataSourceURL = 'https://docs.google.com/spreadsheet/tq?key=' + scriptState.ssID;
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
    chart: null,
    initSpreadSheet: function (ss) {
      var sheet = ss.insertSheet(this.name);
      sheet.appendRow(["From", "Count"]);
    },
    isEmpty: function (db) {
      return gmail3.isEmpty(db, this.name);
    },
    msgFunction: function (msg, db) {
      if (! gmail3.emailSentByRobot(msg.getRawContent())) {
        var rawFrom = msg.getFrom();
        var from = gmail3.extractEmailAddress(rawFrom);
        var rows = objDB.getRows(db, this.name, ['From','Count'], {From:from});
        if ( rows.length === 0) {
          objDB.insertRow(db, this.name, {From:from, Count:1} );
        } else {
          var newCount = rows[0].Count + 1;
          objDB.updateRow(db, this.name, {From:from, Count:newCount}, {From:from} );
        }
      }
    },
    graphFunction: function (scriptState) {
      var ss = SpreadsheetApp.openById(scriptState.ssID);
      var sheetID = ss.getSheetByName(this.name).getSheetId();
      var encodedQuery = encodeURIComponent("select A,B order by B desc limit 10");
      var dataSourceURL = 'https://docs.google.com/spreadsheet/tq?key=' + scriptState.ssID;
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
    chart: null,
    initSpreadSheet: function (ss) {
      var sheet = ss.insertSheet(this.name);
      sheet.appendRow(["Subject", "Count"]);
    },
    isEmpty: function (db) {
      return gmail3.isEmpty(db, this.name);
    },
    msgFunction: function (msg, db) {
      var fullSubject = msg.getSubject();
      // This is a crude attempt to group errors together, by only including
      // the first three words of the error.
      var errorRegex = /^\[Error [^\]]+\]\s\S+\s\S+\s\S+/;
      var match = fullSubject.match(errorRegex);
      if (match !== null) {
        var subject = match[0];
        var rows = objDB.getRows(db, this.name, ['Subject','Count'], {Subject:subject});
        if ( rows.length === 0) {
          objDB.insertRow(db, this.name, {Subject:subject, Count:1} );
        } else {
          var newCount = rows[0].Count + 1;
          objDB.updateRow(db, this.name, {Subject:subject, Count:newCount}, {Subject:subject} );
        }
      }
    },
    graphFunction: function (scriptState) {
      var ss = SpreadsheetApp.openById(scriptState.ssID);
      var sheetID = ss.getSheetByName(this.name).getSheetId();
      var encodedQuery = encodeURIComponent("select A,B order by B desc limit 10");
      var dataSourceURL = 'https://docs.google.com/spreadsheet/tq?key=' + scriptState.ssID;
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

  gmail3.addMsgConsumer(historicalEmailVolume);
  gmail3.addMsgConsumer(topSenders);
  gmail3.addMsgConsumer(topMailingLists);
  gmail3.addMsgConsumer(topNonMailingListSenders);
  gmail3.addMsgConsumer(topRobotSenders);
  gmail3.addMsgConsumer(topHumanSenders);
  gmail3.addMsgConsumer(topApplicationErrors);
}
