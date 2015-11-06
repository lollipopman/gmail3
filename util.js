function extractEmailAddress(emailAddress) {
  var emailAddressRegex = /^(?:.*<)?([^<>]+)(?:>)?$/;
  return emailAddressRegex.exec(emailAddress)[1].toLowerCase();
}

function unfoldHeaders(foldedHeaders) {
  var unfoldRegex = /\r\n[ \t]+/g;
  return foldedHeaders.replace(unfoldRegex, " ");
}

function extractHeaders(rawMessage) {
  var headers = {};
  var parseHeaderRegex = /^[ \n\t]*([^:]+):[ \t]*(.*)$/;
  var extractHeadersRegex = /\r\n\r\n/;
  var printableRegex = /[^ -~]+/g;
  var foldedHeaders = rawMessage.split(extractHeadersRegex)[0];
  var unfoldedHeaders = unfoldHeaders(foldedHeaders);
  var headerLines = unfoldedHeaders.split(/\r\n/);
  for (var i = 0; i < headerLines.length; i++) {
    var printableHeader = headerLines[i].replace(printableRegex, "");
    var headerMatch = parseHeaderRegex.exec(printableHeader);
    if (headerMatch === null) {
      throw new Error("headerMatch returned null");
    }
    if (headerMatch[1] !== "") {
      var headerField = headerMatch[1].toLowerCase();
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
  file = DriveApp.getFileById(ID);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
}

// These are admittedly swiss cheese tests for robots, but I am at loss to
// find better methods.
function emailSentByRobot(rawMessage) {
  var msgFromRobot = false;
  var headers = extractHeaders(rawMessage);
  var robotMailerRegex = /\s\(Postfix/;
  var fromRobots = [
    /^no-?reply@.*$/,
    /^alert@pingdom.com$/,
  ];
  if (headers.hasOwnProperty("received")) {
    var firstHop = headers.received[headers.received.length - 1];
    if (robotMailerRegex.test(firstHop)) {
      msgFromRobot = true;
    }
  }
  for (var i = 0; i < fromRobots.length; i++) {
    if (fromRobots[i].test(headers.from)) {
      msgFromRobot = true;
      break;
    }
  }
  return msgFromRobot;
}
