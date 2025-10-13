// _lib/http.js
function json(ok, status = 200, headers = {}) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(ok),
  };
}
function badRequest(message, fields) {
  return json({ error: 'validation_error', message, fields }, 422);
}
function unauthorized(message = 'Missing or invalid token') {
  return json({ error: 'unauthorized', message }, 401);
}
function forbidden(message = 'Insufficient role') {
  return json({ error: 'forbidden', message }, 403);
}
function serverError(err, requestId = null) {
  console.error('[server_error]', err);
  return json({ error: 'server_error', message: 'Unexpected error', requestId }, 500);
}
module.exports = { json, badRequest, unauthorized, forbidden, serverError };
