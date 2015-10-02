function extractEmailAddress(emailAddress) {
  emailAddressRegex = /^(?:.*<)?([^<>]+)(?:>)?$/;
  return emailAddressRegex.exec(emailAddress)[1].toLowerCase();
}

function extractListId(rawMessage) {
  listIDRegex = /\r\nlist-id:[ \t]*([^\n\r]+)\r\n/i;
  unfoldRegex = /\r\n[ \t]+/g;
  rawMessageUnfolded = rawMessage.replace(unfoldRegex, " ");
  matches = listIDRegex.exec(rawMessageUnfolded);

  if (matches !== null) {
    return {
      msgFromList: true,
      listId: extractEmailAddress(matches[1])
    };
  } else {
    return {
      msgFromList: false,
      listId: null
    };
  }
}

function allowPublicViewing(ID) {
  file = DriveApp.getFileById(ID);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
}
