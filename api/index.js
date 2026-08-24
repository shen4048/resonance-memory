require('dotenv').config();
const { json } = require('stream/consumers');
const { MemoryManager } = require('../storage');
const { handleMCPRequest } = require('../mcp-handler');

const memory = new MemoryManager();

async function handleBrief(req, res) {
  const brief = await memory.getBrief();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(brief));
}

async function handleMCP(req, res) {
  const body = await json(req);
  const result = await handleMCPRequest(body, memory);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result));
}

async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/mcp') {
    return handleMCP(req, res);
  }

  if (req.method === 'GET' && url.pathname === '/brief') {
    return handleBrief(req, res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

module.exports = handler;

if (require.main === module) {
  const http = require('http');
  const server = http.createServer(handler);
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Resonance running on port ${port}`);
    console.log(`MCP endpoint: /mcp`);
    console.log(`Brief endpoint: /brief`);
  });
}
