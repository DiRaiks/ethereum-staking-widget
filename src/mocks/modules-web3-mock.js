// Minimal mock of modules/web3 for Jest tests
// Avoids transitive imports of wagmi (ESM-only) and SVG files

class SendCallsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SendCallsError';
  }
}

module.exports = {
  SendCallsError,
  // Add other exports as needed when tests require them
};
