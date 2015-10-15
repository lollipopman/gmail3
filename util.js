function extractEmailAddress(emailAddress) {
  var emailAddressRegex = /^(?:.*<)?([^<>]+)(?:>)?$/;
  return emailAddressRegex.exec(emailAddress)[1].toLowerCase();
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
  var foldedHeaders = rawMessage.split(extractHeadersRegex)[0];
  var unfoldedHeaders = unfoldHeaders(foldedHeaders);
  var headerLines = unfoldedHeaders.split(/\r\n/);
  for (i = 0; i < headerLines.length; i++) {
    var headerMatch = parseHeaderRegex.exec(headerLines[i]);
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

function emailSentByRobot(rawMessage) {
  var headers = extractHeaders(rawMessage);
  // This is admittedly a swiss cheese test for robots, but I am at loss to
  // find a better method.
  var robotRegex = /\s\(Postfix/;
  var firstHop = headers.received[headers.received.length - 1];
  return robotRegex.test(firstHop);
}
