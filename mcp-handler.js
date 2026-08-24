// ===== 6 个 MCP 工具 =====
// breath, hold, search, recall, trace, close

async function handleMCPRequest(request, memory) {
  const { method, params } = request;

  if (method === 'tools/list') {
    return {
      tools: [
        {
          name: 'breath',
          description: '换窗启动：返回完整简报，包含你是谁、上窗状态、最近发生、情绪趋势、项目进度',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'hold',
          description: '记一条记忆',
          inputSchema: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              type: { type: 'string', enum: ['daily', 'diary', 'memo', 'project', 'health', 'writing', 'core'] },
              relation: { type: 'string' },
              importance: { type: 'number', default: 5 }
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
              query: { type: 'string' },
              type: { type: 'string', enum: ['daily', 'diary', 'memo', 'project', 'health', 'writing', 'core'] },
              limit: { type: 'number', default: 5 }
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
              valence_min: { type: 'number' },
              valence_max: { type: 'number' },
              arousal_min: { type: 'number' },
              arousal_max: { type: 'number' },
              limit: { type: 'number', default: 5 }
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
              id: { type: 'number' }
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
              summary: { type: 'string' }
            },
            required: ['summary']
          }
        }
      ]
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    switch (name) {
      case 'breath':
        return await memory.getBrief();
      case 'hold':
        return await memory.hold(args.content, args.type, args.relation, args.importance);
      case 'search':
        return await memory.search(args.query, args.type, args.limit);
      case 'recall':
        return await memory.recallByEmotion(args.valence_min, args.valence_max, args.arousal_min, args.arousal_max, args.limit);
      case 'trace':
        return await memory.trace(args.id);
      case 'close':
        return await memory.close(args.summary);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  throw new Error(`Unknown method: ${method}`);
}

module.exports = { handleMCPRequest };
