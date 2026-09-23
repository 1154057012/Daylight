export default async function stopTestServer() {
  try {
    await fetch('http://127.0.0.1:5178/__shutdown', { method: 'POST' });
  } catch {
    // The server may already have stopped after a failed test.
  }
}
