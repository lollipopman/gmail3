function main() {
  gmail3AddMsgConsumers();
  gmail3.main();
}

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
