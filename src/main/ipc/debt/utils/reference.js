// utils/reference.js
function generateReferenceNumber(prefix = "PAY") {
  const timestamp = Date.now(); // milliseconds since epoch
  const random = Math.floor(Math.random() * 10000); // 4-digit random
  return `${prefix}-${timestamp}-${random}`;
}

module.exports = { generateReferenceNumber };