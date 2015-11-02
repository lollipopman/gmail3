var fs = require("fs");
var assert = require("assert");

eval(fs.readFileSync('util.js').toString());

describe('extractEmailAddress', function() {
  it('should strip out everything but the email address', function () {
    assert.equal('jesse@mbuki-mvuki.org', extractEmailAddress('Jesse W. Hathaway <jesse@mbuki-mvuki.org>'));
    assert.equal('jesse@mbuki-mvuki.org', extractEmailAddress('jesse@mbuki-mvuki.org'));
  });
});

describe('unfoldHeaders', function() {
  var foldedHeaders = fs.readFileSync('test/fixtures/foldedHeaders.txt').toString();
  var unfoldedHeaders = fs.readFileSync('test/fixtures/unfoldedHeaders.txt').toString();
  it('should unfold headers', function() {
    assert.equal(unfoldedHeaders, unfoldHeaders(foldedHeaders));
  });
});

describe('extractHeaders', function() {
  var rawMessage = fs.readFileSync('test/fixtures/rawMessage.txt').toString();
  var rawMessageWithCtrlChars = fs.readFileSync('test/fixtures/rawMessageWithCtrlChars.txt').toString();
  var expectedHeaders = JSON.parse(fs.readFileSync('test/fixtures/rawMessageHeaders.json'));
  var expectedHeadersWithCtrlChars = JSON.parse(fs.readFileSync('test/fixtures/rawMessageWithCtrlCharsHeaders.json'));
  it('should extract the headers', function() {
    assert.deepEqual(expectedHeaders, extractHeaders(rawMessage));
    assert.deepEqual(expectedHeadersWithCtrlChars, extractHeaders(rawMessageWithCtrlChars));
  });
});

describe('emailSentByRobot', function() {
  var rawMessage = fs.readFileSync('test/fixtures/rawMessage.txt').toString();
  var rawMessageRobot = fs.readFileSync('test/fixtures/rawMessageRobot.txt').toString();
  it('detects whether the message is from a robot', function() {
    assert.equal(false, emailSentByRobot(rawMessage));
    assert.equal(true, emailSentByRobot(rawMessageRobot));
  });
});
