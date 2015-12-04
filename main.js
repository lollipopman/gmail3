/**
 * Used to start the script. Adds a daily trigger and then begins to process
 * messages. Once it is through processing a batch of messages it will schedule
 * the next trigger. 
 */
function main() {
  gmail3AddMsgConsumers();
  gmail3.main();
}

/**
 * Enables more verbose logging and only processes 20 messages per run. Also
 * restricts the total messages processed per month to 40.
 */
function enableDebugMode() {
  PropertiesService.getUserProperties().setProperty("debugEnabled", "true");
  Logger.log("Debugging enabled");
}

/** Disables debug mode */
function disableDebugMode() {
  PropertiesService.getUserProperties().setProperty("debugEnabled", "false");
  Logger.log("Debugging disabled");
}

/**
 * Deletes all existing gmail3 Google sheets, and deletes all triggers. This
 * effectively disables the script.
 */
function resetScriptState() {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteAllProperties();
  var projectTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < projectTriggers.length; i++) {
    ScriptApp.deleteTrigger(projectTriggers[i]);
  }
  var files = DriveApp.searchFiles("title contains 'gmail3 Data'");
  while (files.hasNext()) {
    var file = files.next();
    Logger.log("Trashing: " + file.getName());
    file.setTrashed(true);
  }
}
