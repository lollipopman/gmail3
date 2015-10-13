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
  var expectedHeaders = JSON.parse(fs.readFileSync('test/fixtures/rawMessageHeaders.json'));
  it('should extract the headers', function() {
    assert.deepEqual(expectedHeaders, extractHeaders(rawMessage));
  });
});