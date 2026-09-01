require('dotenv').config();

const { json } = require('stream/consumers');
const { MemoryManager } = require('../storage');
const { handleMCPRequest } = require('../mcp-handler');

const memory = new MemoryManager();

async function handleBrief(req, res) {
  try {
    const brief = await memory.getBrief();

    res.writeHead(200, {
      'Content-Type': 'application/json'
    });

    res.end(JSON.stringify(brief));
  } catch (error) {
    console.error(error);

    res.writeHead(500, {
      'Content-Type': 'application/json'
    });

    res.end(
      JSON.stringify({
        error: 'Failed to get brief'
      })
    );
  }
}

async function handleMCP(req, res) {
  // MCP endpoint 使用 POST
  if (req.method !== 'POST') {
    res.writeHead(405, {
      'Content-Type': 'application/json',
      'Allow': 'POST'
    });

    res.end(
      JSON.stringify({
        error: 'MCP endpoint requires POST'
      })
    );

    return;
  }

  try {
    const body = await json(req);

    const result = await handleMCPRequest(body, memory);

    // notification 没有 response body
    if (result === null) {
      res.writeHead(202);
      res.end();
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'application/json'
    });

    res.end(JSON.stringify(result));
  } catch (error) {
    console.error('MCP error:', error);

    res.writeHead(500, {
      'Content-Type': 'application/json'
    });

    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal server error'
        }
      })
    );
  }
}

async function handler(req, res) {
  const url = new URL(
    req.url,
    `http://${req.headers.host}`
  );

  if (url.pathname === '/mcp') {
    return handleMCP(req, res);
  }

  if (
    req.method === 'GET' &&
    url.pathname === '/brief'
  ) {
    return handleBrief(req, res);
  }

  res.writeHead(404, {
    'Content-Type': 'text/plain'
  });

  res.end('Not Found');
}

module.exports = handler;

if (require.main === module) {
  const http = require('http');

  const server = http.createServer(handler);

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(
      `Resonance running on port ${port}`
    );

    console.log(
      `MCP endpoint: /mcp`
    );

    console.log(
      `Brief endpoint: /brief`
    );
  });
}
