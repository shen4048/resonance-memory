async function handleMCPRequest(request, memory) {
  const { method, params = {}, id } = request;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'resonance-memory',
          version: '1.0.0'
        }
      }
    };
  }

  // MCP notification 不返回 JSON-RPC response
  if (method === 'notifications/initialized') {
    return null;
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'breath',
            description:
              '换窗启动：返回完整简报，包含你是谁、上窗状态、最近发生、情绪趋势、项目进度',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'hold',
            description: '记一条记忆',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string'
                },
                type: {
                  type: 'string',
                  enum: [
                    'daily',
                    'diary',
                    'memo',
                    'project',
                    'health',
                    'writing',
                    'core'
                  ]
                },
                relation: {
                  type: 'string'
                },
                importance: {
                  type: 'number',
                  default: 5
                }
              },
              required: ['content', 'type']
            }
          },
          {
            name: 'search',
            description: '按关键词检索记忆',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string'
                },
                type: {
                  type: 'string',
                  enum: [
                    'daily',
                    'diary',
                    'memo',
                    'project',
                    'health',
                    'writing',
                    'core'
                  ]
                },
                limit: {
                  type: 'number',
                  default: 5
                }
              },
              required: ['query']
            }
          },
          {
            name: 'recall',
            description: '按情感坐标检索记忆',
            inputSchema: {
              type: 'object',
              properties: {
                valence_min: {
                  type: 'number'
                },
                valence_max: {
                  type: 'number'
                },
                arousal_min: {
                  type: 'number'
                },
                arousal_max: {
                  type: 'number'
                },
                limit: {
                  type: 'number',
                  default: 5
                }
              },
              required: ['valence_min', 'valence_max']
            }
          },
          {
            name: 'trace',
            description: '查某条记忆的完整原文',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number'
                }
              },
              required: ['id']
            }
          },
          {
            name: 'close',
            description: '结束当前窗口：自动生成 memo 总结',
            inputSchema: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string'
                }
              },
              required: ['summary']
            }
          }
        ]
      }
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params;

    let data;

    switch (name) {
      case 'breath':
        data = await memory.getBrief();
        break;

      case 'hold':
        data = await memory.hold(
          args.content,
          args.type,
          args.relation,
          args.importance
        );
        break;

      case 'search':
        data = await memory.search(
          args.query,
          args.type,
          args.limit
        );
        break;

      case 'recall':
        data = await memory.recallByEmotion(
          args.valence_min,
          args.valence_max,
          args.arousal_min,
          args.arousal_max,
          args.limit
        );
        break;

      case 'trace':
        data = await memory.trace(args.id);
        break;

      case 'close':
        data = await memory.close(args.summary);
        break;

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Unknown tool: ${name}`
          }
        };
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data)
          }
        ]
      }
    };
  }

  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: `Method not found: ${method}`
    }
  };
}

module.exports = {
  handleMCPRequest
};
