var gmail3 = function () {
  var gmail3 = {};
  var msgConsumers = [];

  function addMsgConsumer(msgConsumer) {
    msgConsumers.push(msgConsumer);
  }

  function isEmpty(db, sheet) {
    var rows = objDB.getRows(db, sheet, [], {}, 1);
    if (rows.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  function emailReport(scriptState, msgConsumers) {
    var db = objDB.open(scriptState.ssID);
    var htmlBody = "";
    var inlineImages = {};
    var blob;
    Logger.log('Sending last months report via Email');
    for(i = 0; i < msgConsumers.length; i += 1) {
      if (! msgConsumers[i].isEmpty(db)) {
        msgConsumers[i].graphFunction(scriptState);
      }
    }

    for(i = 0; i < msgConsumers.length; i += 1) {
      if (! msgConsumers[i].isEmpty(db)) {
        htmlBody += "<img src='cid:" + i + "'> <br>\n";
        blob = msgConsumers[i].chart.getAs('image/png').setName(msgConsumers[i].name + ".png");
        inlineImages[i] = blob;
      }
    }

    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: "[gmail3] - " + "Gmail usage analysis for " + scriptState.monthToProcess.format('MMMM YYYY'),
      htmlBody: htmlBody,
      inlineImages: inlineImages
    });
    scriptState.reportEmailed = true;
  }

  function createSpreadSheet(monthToProcess) {
    Logger.log("gmail3 Data - " + monthToProcess.format('MMM YYYY'));
    var ssNew = SpreadsheetApp.create("gmail3 Data - " + monthToProcess.format('MMM YYYY'));
    var ssID = ssNew.getUrl().split('/')[7];
    // This is needed so we can use the Google Visualization API Query Language
    // to set the data source URL for graphs
    allowPublicViewing(ssID);
    return ssID;
  }

  function initializeSpreadSheet(scriptState) {
    var ss = SpreadsheetApp.openById(scriptState.ssID);
    for(i = 0; i < msgConsumers.length; i += 1) {
      msgConsumers[i].initSpreadSheet(ss);
    }
  }

  function populateData(scriptState, msgConsumers) {
    var msg;
    var i;
    var db = objDB.open(scriptState.ssID);
    Logger.log('Populating Data');
    // Process up to 100 gmail threads at once
    var batchSize = 100;
    if (scriptState.debugEnabled) {
      // If we have debugEnabled only process 20, so runs are quicker
      batchSize = 20;
    }
    var after = scriptState.monthToProcess.clone().startOf('month').format('YYYY/MM/DD');
    var before = scriptState.monthToProcess.clone().endOf('month').add(1, 'days').format('YYYY/MM/DD');
    var query = "in:anywhere -label:sms -label:call-log -label:chats -label:spam -filename:ics";
    query += " -from:maestro.bounces.google.com -from:unified-notifications.bounces.google.com -from:docs.google.com";
    query += " -from:group.calendar.google.com -from:apps-scripts-notifications@google.com";
    query += " -from:sites.bounces.google.com";
    query += " after:" + after + " before:" + before;

    Logger.log('Searching: ' + query);
    var threads = GmailApp.search(query, scriptState.threadIndex, batchSize);
    if (scriptState.debugEnabled && scriptState.threadIndex >= 40) {
      scriptState.dataPopulated = true;
    } else if (threads.length === 0) {
      scriptState.dataPopulated = true;
    } else {
      for (thread = 0; thread < threads.length; thread += 1) {
        msg = threads[thread].getMessages()[0];
        for(i = 0; i < msgConsumers.length; i += 1) {
          if (scriptState.debugEnabled) {
            Logger.log('Calling Message function for, ' + msgConsumers[i].name);
          }
          try {
            msgConsumers[i].msgFunction(msg, db);
          } catch (e) {
            throw new Error("msgConsumer, " + msgConsumers[i].name + ", threw error: " + e.message);
          }
        }
      }
    }
    scriptState.threadIndex += batchSize;
    Logger.log('PopulateData run complete: threads: ' + threads.length + ', threadIndex: ' + scriptState.threadIndex);
  }

  function setScriptState(scriptState) {
    var scriptStateString = JSON.stringify(scriptState);
    PropertiesService.getUserProperties().setProperty("scriptState", scriptStateString);
    Logger.log("New scriptState set: " + scriptStateString);
  }

  function getScriptState() {
    var currentMonth;
    var scriptState = null;
    var nextMonthToProcess;
    var scriptStateString = PropertiesService.getUserProperties().getProperty("scriptState");
    var debugEnabledUserProperty = PropertiesService.getUserProperties().getProperty("debugEnabled");
    if (debugEnabledUserProperty === "true") {
      debugEnabled = true;
      Logger.log("Debugging enabled");
    } else {
      debugEnabled = false;
      Logger.log("Debugging disabled");
    }
    Logger.log("Retrieved scriptState: " + scriptStateString);
    if (scriptStateString === null) {
      Logger.log('No stored scriptState, creating an empty one');
      scriptState = {};
      scriptState.debugEnabled = debugEnabled;
      currentMonth = moment().startOf('month');
      if (scriptState.debugEnabled) {
        nextMonthToProcess = currentMonth.clone().startOf('year');
      } else {
        nextMonthToProcess = currentMonth.clone().subtract(1, 'days').startOf('month');
      }
      scriptState.ssID = createSpreadSheet(nextMonthToProcess);
      initializeSpreadSheet(scriptState);
      scriptState.monthToProcess = nextMonthToProcess;
      scriptState.dataPopulated = false;
      scriptState.reportEmailed = false;
      scriptState.threadIndex = 0;
      scriptState.triggers = [];
      scriptState.dailyRunningTimeTotalSeconds = 0;
      scriptState.currentDay = moment().startOf('day');
    } else {
      scriptState = JSON.parse(scriptStateString);
      scriptState.debugEnabled = debugEnabled;
      scriptState.monthToProcess = moment(scriptState.monthToProcess);
      scriptState.currentDay = moment(scriptState.currentDay);
    }

    // Reset the running total, if it is a new day
    if (! moment().startOf('day').isSame(scriptState.currentDay)) {
      scriptState.dailyRunningTimeTotalSeconds = 0;
      scriptState.currentDay = moment().startOf('day');
    }

    // Create a daily trigger if it does not exist
    dailyTrigger = _.find(scriptState.triggers, function (trigger) {
      return trigger.type === "atHour";
    });
    if (dailyTrigger === undefined) {
      Logger.log("No daily trigger, adding one");
      trigger = ScriptApp.newTrigger("main")
      .timeBased()
      .atHour(1)
      .everyDays(1)
      .create();
      scriptState.triggers.push({
        type: "atHour",
        uniqueId: trigger.getUniqueId(),
      });
    }

    return scriptState;
  }

  function deleteSheet1(scriptState) {
    var ss = SpreadsheetApp.openById(scriptState.ssID);
    if (ss.getSheetByName("Sheet1") !== null) {
      ss.deleteSheet(ss.getSheetByName("Sheet1"));
    }
  }

  function incrementMonth(scriptState) {
    Logger.log('Processing done for the current month, incrementing the month');
    var nextMonthToProcess = scriptState.monthToProcess.clone()
    .endOf('month')
    .add(1, 'days')
    .startOf('month');
    // This may not succeed so do it first, before changing the script state
    scriptState.ssID = createSpreadSheet(nextMonthToProcess);
    initializeSpreadSheet(scriptState);
    scriptState.monthToProcess = nextMonthToProcess;
    scriptState.dataPopulated = false;
    scriptState.reportEmailed = false;
    scriptState.threadIndex = 0;
    scriptState.dailyRunningTimeTotalSeconds = 0;
    scriptState.currentDay = moment().startOf('day');

    return scriptState;
  }

  function deleteAtTriggers(scriptState) {
    var trigger;
    var projectTriggers;
    var i;
    var uniqueId;
    Logger.log("Deleting all existing at triggers");
    function uniqueIdMatchProjectTrigger(projectTrigger) {
      return function (trigger) {
        return trigger.uniqueId === projectTrigger.getUniqueId();
      };
    }
    function uniqueIdMatch(uniqueId) {
      return function (trigger) {
        return trigger.uniqueId === uniqueId;
      };
    }
    projectTriggers = ScriptApp.getProjectTriggers();
    for (i = 0; i < projectTriggers.length; i++) {
      trigger = _.find(scriptState.triggers, uniqueIdMatchProjectTrigger(projectTriggers[i]));
      if (trigger === undefined) {
        // We have no record of this trigger, so delete it
        ScriptApp.deleteTrigger(projectTriggers[i]);
      } else {
        if (trigger.type === "at") {
          uniqueId = projectTriggers[i].getUniqueId();
          ScriptApp.deleteTrigger(projectTriggers[i]);
          scriptState.triggers = _.reject(scriptState.triggers, uniqueIdMatch(uniqueId));
        }
      }
    }
  }

  function setupNextAtTrigger(scriptState) {
    // Delete any previous at triggers, so we don't exceed the trigger quota
    deleteAtTriggers(scriptState);

    // If less than daily run time, 3 hours, and there is still time left in the
    // day, add a new trigger
    if (scriptState.dailyRunningTimeTotalSeconds < (170 * 60) &&
      moment().add(35, 'minutes').date() === moment().date()) {
      Logger.log("Scheduling a new at trigger at: " + moment().add(15, "minutes").toISOString());
      trigger = ScriptApp.newTrigger("main").timeBased().after(15 * 60 * 1000).create();
      scriptState.triggers.push({
        type: "at",
        uniqueId: trigger.getUniqueId(),
      });
    } else {
      Logger.log("Not scheduling any further triggers for today to avoid exceeding execution quota of 3 hours");
      Logger.log("Running time total today " + (scriptState.dailyRunningTimeTotalSeconds / 60) + " minutes");
    }
  }

  function extractEmailAddress(emailAddress) {
    var emailAddressRegex = /^(?:.*<)?([^<>]+)(?:>.*)?$/;
    var extractedEmailAddress = emailAddressRegex.exec(emailAddress);
    return extractedEmailAddress === null ? emailAddress : extractedEmailAddress[1].toLowerCase();
  }

  function unfoldHeaders(foldedHeaders) {
    var unfoldRegex = /\r\n[ \t]+/g;
    return foldedHeaders.replace(unfoldRegex, " ");
  }

  function extractHeaders(rawMessage) {
    var i;
    var headers = {};
    var parseHeaderRegex = /^[ \n\t]*([^:]+):[ \t]*(.*)$/;
    var extractHeadersRegex = /\r\n\r\n/;
    var printableRegex = /[^ -~]+/g;
    var foldedHeaders = rawMessage.split(extractHeadersRegex)[0];
    var unfoldedHeaders = unfoldHeaders(foldedHeaders);
    var headerLines = unfoldedHeaders.split(/\r\n/);
    var printableHeader;
    var headerMatch;
    var headerField;
    for (i = 0; i < headerLines.length; i++) {
      printableHeader = headerLines[i].replace(printableRegex, "");
      headerMatch = parseHeaderRegex.exec(printableHeader);
      if (headerMatch === null) {
        throw new Error("headerMatch returned null");
      }
      if (headerMatch[1] !== "") {
        headerField = headerMatch[1].toLowerCase();
        if (headers.hasOwnProperty(headerField)) {
          headers[headerField].push(headerMatch[2]);
        } else {
          headers[headerField] = [headerMatch[2]];
        }
      }
    }
    return headers;
  }

  function allowPublicViewing(ID) {
    Logger.log("Setting drive file public, with ID: " + ID);
    file = DriveApp.getFileById(ID);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  // These are admittedly swiss cheese tests for robots, but I am at loss to
  // find better methods.
  function emailSentByRobot(rawMessage) {
    var firstHop;
    var msgFromRobot = false;
    var headers = extractHeaders(rawMessage);
    var from = extractEmailAddress(headers.from);
    var i;
    var robotMessageIds = [
      /JavaMail/,
    ];
    var robotMailers = [
      /\s\(Postfix/,
      /mailgun.net/,
      /sendgrid.net/,
      /smtp-out.amazonses.com/,
    ];
    var fromRobots = [
      /^no-?reply@.*$/,
      /^do-?not-?reply@.*$/,
      /^alert@pingdom.com$/,
    ];
    if (headers.hasOwnProperty("x-php-originating-script")) {
      msgFromRobot = true;
    }
    if (! msgFromRobot && headers.hasOwnProperty("received")) {
      firstHop = headers.received[headers.received.length - 1];
      for (i = 0; i < robotMailers.length; i++) {
        if (robotMailers[i].test(firstHop)) {
          msgFromRobot = true;
          break;
        }
      }
    }
    if (! msgFromRobot && headers.hasOwnProperty("message-id")) {
      for (i = 0; i < robotMessageIds.length; i++) {
        if (robotMessageIds[i].test(headers["message-id"])) {
          msgFromRobot = true;
          break;
        }
      }
    }
    if (! msgFromRobot) {
      for (i = 0; i < fromRobots.length; i++) {
        if (fromRobots[i].test(from)) {
          msgFromRobot = true;
          break;
        }
      }
    }
    return msgFromRobot;
  }

  function main() {
    var i;
    var lock = LockService.getUserLock();
    if (!lock.tryLock(1000)) {
      Logger.log('Could not obtain lock after a second');
      return;
    }
    var currentMonth = moment().startOf('month');
    var scriptStartTime = moment();
    var scriptState = null;

    try {
      scriptState = getScriptState();
    } catch (e) {
      Logger.log('Error: ' + e.message);
      return;
    }

    if (scriptState.monthToProcess.isBefore(currentMonth)) {
      Logger.log("Beginning processing of: gmail3 - " + scriptState.monthToProcess.format('MMM YYYY'));
      if (scriptState.dataPopulated) {
        if (scriptState.reportEmailed) {
          try {
            deleteSheet1(scriptState);
          } catch (e) {
            Logger.log('Error: Unable to delete Sheet1 for the previous month: ' + e.message);
          }
          try {
            incrementMonth(scriptState);
          } catch (e) {
            Logger.log('Error: Unable to increment month: ' + e.message);
          }
        } else {
          try {
            emailReport(scriptState, msgConsumers);
          } catch (e) {
            Logger.log('Error: Unable to email report for the previous month: ' + e.message);
          }
        }
      } else {
        try {
          populateData(scriptState, msgConsumers);
        } catch (e) {
          Logger.log('Error: Unable to populate data: ' + e.message);
        }
      }
      scriptState.dailyRunningTimeTotalSeconds += moment().diff(scriptStartTime, 'seconds');
      try {
        setupNextAtTrigger(scriptState);
      } catch (e) {
        Logger.log('Error: Unable to schedule next at trigger: ' + e.message);
      }
    } else {
      Logger.log('Previous month processed complete, nothing todo');
    }

    for (i = 0; i < 5; i++) {
      try {
        setScriptState(scriptState);
        break;
      } catch (e) {
        Logger.log('Error: Unable to set script state: ' + e.message);
      }
    }
    lock.releaseLock();
  }

  gmail3.emailReport = emailReport;
  gmail3.addMsgConsumer = addMsgConsumer;
  gmail3.createSpreadSheet = createSpreadSheet;
  gmail3.initializeSpreadSheet = initializeSpreadSheet;
  gmail3.isEmpty = isEmpty;
  gmail3.populateData = populateData;
  gmail3.setScriptState = setScriptState;
  gmail3.getScriptState = getScriptState;
  gmail3.deleteSheet1 = deleteSheet1;
  gmail3.incrementMonth = incrementMonth;
  gmail3.deleteAtTriggers = deleteAtTriggers;
  gmail3.setupNextAtTrigger = setupNextAtTrigger;
  gmail3.extractEmailAddress = extractEmailAddress;
  gmail3.unfoldHeaders = unfoldHeaders;
  gmail3.extractHeaders = extractHeaders;
  gmail3.allowPublicViewing = allowPublicViewing;
  gmail3.emailSentByRobot = emailSentByRobot;
  gmail3.main = main;

  return gmail3;
}();
