var fs = require("fs");
var assert = require("assert");

eval(fs.readFileSync('gmail3.js').toString());

describe('extractEmailAddress', function() {
  it('should strip out everything but the email address', function () {
    assert.equal('potto@foo-bar.org', gmail3.extractEmailAddress('Potto J. Monkey <potto@foo-bar.org>'));
    assert.equal('potto@foo-bar.org', gmail3.extractEmailAddress('potto@foo-bar.org'));
  });
});

describe('unfoldHeaders', function() {
  var foldedHeaders = fs.readFileSync('test/fixtures/foldedHeaders.txt').toString();
  var unfoldedHeaders = fs.readFileSync('test/fixtures/unfoldedHeaders.txt').toString();
  it('should unfold headers', function() {
    assert.equal(unfoldedHeaders, gmail3.unfoldHeaders(foldedHeaders));
  });
});

describe('extractHeaders', function() {
  var rawMessage = fs.readFileSync('test/fixtures/rawMessage.txt').toString();
  var rawMessageWithCtrlChars = fs.readFileSync('test/fixtures/rawMessageWithCtrlChars.txt').toString();
  var expectedHeaders = JSON.parse(fs.readFileSync('test/fixtures/rawMessageHeaders.json'));
  var expectedHeadersWithCtrlChars = JSON.parse(fs.readFileSync('test/fixtures/rawMessageWithCtrlCharsHeaders.json'));
  it('should extract the headers', function() {
    assert.deepEqual(expectedHeaders, gmail3.extractHeaders(rawMessage));
    assert.deepEqual(expectedHeadersWithCtrlChars, gmail3.extractHeaders(rawMessageWithCtrlChars));
  });
});

describe('emailSentByRobot', function() {
  var rawMessage = fs.readFileSync('test/fixtures/rawMessage.txt').toString();
  var rawMessageRobot = fs.readFileSync('test/fixtures/rawMessageRobot.txt').toString();
  var rawMessageRobotNoReply = fs.readFileSync('test/fixtures/rawMessageRobotNoReply.txt').toString();
  it('detects whether the message is from a robot', function() {
    assert.equal(false, gmail3.emailSentByRobot(rawMessage));
    assert.equal(true, gmail3.emailSentByRobot(rawMessageRobot));
    assert.equal(true, gmail3.emailSentByRobot(rawMessageRobotNoReply));
  });
});
