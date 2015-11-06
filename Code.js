function enableDebugMode() {
  PropertiesService.getUserProperties().setProperty("debugEnabled", "true");
  Logger.log("Debugging enabled");
}

function disableDebugMode() {
  PropertiesService.getUserProperties().setProperty("debugEnabled", "false");
  Logger.log("Debugging disabled");
}

function resetScriptState() {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteAllProperties();
  var projectTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < projectTriggers.length; i++) {
    ScriptApp.deleteTrigger(projectTriggers[i]);
  }
  var files = DriveApp.searchFiles("title contains 'Email3 Data'");
  while (files.hasNext()) {
    var file = files.next();
    Logger.log("Trashing: " + file.getName());
    file.setTrashed(true);
  }
}

function emailReport(scriptState, msgConsumers) {
  Logger.log('Sending last months report via Email');
  for(i = 0; i < msgConsumers.length; i += 1) {
    msgConsumers[i].graphFunction();
  }
  var htmlBody = "";
  var inlineImages = {};
  var blob;

  for(i = 0; i < msgConsumers.length; i += 1) {
    htmlBody += msgConsumers[i].name + " <img src='cid:" + i + "'> <br>\n";
    blob = msgConsumers[i].chart.getAs('image/png').setName(msgConsumers[i].name + ".png");
    inlineImages[i] = blob;
  }

  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: "Email3 - " + scriptState.monthToProcess.format('MMM YYYY'),
    htmlBody: htmlBody,
    inlineImages: inlineImages
  });
  scriptState.reportEmailed = true;
}

function createSpreadSheet(monthToProcess) {
  var ssNew = SpreadsheetApp.create("Email3 Data - " + monthToProcess.format('MMM YYYY'));
  var ssID = ssNew.getUrl().split('/')[7];
  // This is needed so we can use the Google Visualization API Query Language
  // to set the data source URL for graphs
  allowPublicViewing(ssID);
  return ssID;
}

function initializeSpreadSheet(scriptState) {
  var msgConsumers = getMsgConsumers(scriptState);
  for(i = 0; i < msgConsumers.length; i += 1) {
    msgConsumers[i].initSpreadSheet();
  }
}

function populateData(scriptState, msgConsumers) {
  Logger.log('Populating Data');
  // Process up to 100 gmail threads at once
  var batchSize = 100;
  var after = scriptState.monthToProcess.clone().startOf('month').format('YYYY/MM/DD');
  var before = scriptState.monthToProcess.clone().endOf('month').add(1, 'days').format('YYYY/MM/DD');
  var query = "in:anywhere -label:sms -label:call-log -label:chats -label:spam -filename:ics";
  query += " -from:maestro.bounces.google.com -from:unified-notifications.bounces.google.com -from:docs.google.com";
  query += " -from:group.calendar.google.com -from:apps-scripts-notifications@google.com";
  query += " -from:sites.bounces.google.com";
  query += " after:" + after + " before:" + before;

  Logger.log('Searching: ' + query);
  var threads = GmailApp.search(query, scriptState.threadIndex, batchSize);
  if (scriptState.debugEnabled && scriptState.threadIndex > 200) {
    scriptState.dataPopulated = true;
  } else if (threads.length === 0) {
    scriptState.dataPopulated = true;
  } else {
    for (thread = 0; thread < threads.length; thread += 1) {
      var msg = threads[thread].getMessages()[0];
      for(var i = 0; i < msgConsumers.length; i += 1) {
        if (scriptState.debugEnabled) {
          Logger.log('Calling Message function for, ' + msgConsumers[i].name);
        }
        try {
          msgConsumers[i].msgFunction(msg);
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
    var currentMonth = moment().startOf('month');
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
  // This may not suceeed so do it first, before changing the script state
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
  Logger.log("Deleting all existing at triggers");
  var trigger;
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
  var projectTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < projectTriggers.length; i++) {
    trigger = _.find(scriptState.triggers, uniqueIdMatchProjectTrigger(projectTriggers[i]));
    if (trigger === undefined) {
      // We have no record of this trigger, so delete it
      ScriptApp.deleteTrigger(projectTriggers[i]);
    } else {
      if (trigger.type === "at") {
        var uniqueId = projectTriggers[i].getUniqueId();
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

function main() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    Logger.log('Could not obtain lock after a second');
    return;
  }
  var currentMonth = moment().startOf('month');
  var scriptStartTime = moment();
  var scriptState = null;
  var msgConsumers = null;

  try {
    scriptState = getScriptState();
  } catch (e) {
    Logger.log('Error: ' + e.message);
    return;
  }

  try {
    msgConsumers = getMsgConsumers(scriptState);
  } catch (e) {
    Logger.log('Error: ' + e.message);
    try {
      setupNextAtTrigger(scriptState);
    } catch (ee) {
      Logger.log('Error: Unable to schedule next at trigger: ' + ee.message);
    }
    return;
  }

  if (scriptState.monthToProcess.isBefore(currentMonth)) {
    Logger.log("Beginning processing of: Email3 - " + scriptState.monthToProcess.format('MMM YYYY'));
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

  for (var i = 0; i < 5; i++) {
    try {
      setScriptState(scriptState);
      break;
    } catch (e) {
      Logger.log('Error: Unable to set script state: ' + e.message);
    }
  }
  lock.releaseLock();
}
