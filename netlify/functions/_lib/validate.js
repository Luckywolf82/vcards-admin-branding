// _lib/validate.js
function isNonEmptyString(s) {
  return typeof s === 'string' && s.trim().length > 0;
}
function isOptionalString(s) {
  return s === null || s === undefined || typeof s === 'string';
}
function isOneOf(v, arr) {
  return arr.includes(v);
}
module.exports = { isNonEmptyString, isOptionalString, isOneOf };
