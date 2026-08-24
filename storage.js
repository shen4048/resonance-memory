const { Pool } = require('pg');

class MemoryManager {
  constructor() {
    this.client = new Pool({
      connectionString: process.env.neow_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }

  async getBrief() {
    const [core, memo, daily, diary, project] = await Promise.all([
      this.client.query(`SELECT content FROM memories WHERE type = 'core' ORDER BY created_at DESC LIMIT 10`),
      this.client.query(`SELECT content, created_at FROM memories WHERE type = 'memo' ORDER BY created_at DESC LIMIT 4`),
      this.client.query(`SELECT content, created_at FROM memories WHERE type = 'daily' AND created_at > NOW() - INTERVAL '3 days' ORDER BY created_at DESC`),
      this.client.query(`SELECT content, valence, arousal, created_at FROM memories WHERE type = 'diary' AND created_at > NOW() - INTERVAL '7 days' ORDER BY created_at DESC`),
      this.client.query(`SELECT content, created_at FROM memories WHERE type = 'project' ORDER BY created_at DESC LIMIT 1`)
    ]);

    let emotionSummary = '无足够日记数据';
    if (diary.rows.length > 0) {
      const avgValence = diary.rows.reduce((s, r) => s + (r.valence || 0), 0) / diary.rows.length;
      const avgArousal = diary.rows.reduce((s, r) => s + (r.arousal || 0), 0) / diary.rows.length;
      emotionSummary = `效价 ${avgValence.toFixed(2)}，唤醒度 ${avgArousal.toFixed(2)}，整体${avgValence > 0.3 ? '偏正向' : avgValence < -0.3 ? '偏负向' : '中性'}`;
    }

    return {
      core: core.rows.map(r => r.content),
      memo: memo.rows.map(r => ({ content: r.content, time: r.created_at })),
      daily: daily.rows.map(r => ({ content: r.content, time: r.created_at })),
      emotion: emotionSummary,
      project: project.rows.length > 0 ? project.rows[0].content : '暂无项目记录'
    };
  }

  async hold(content, type, relation, importance = 5) {
    let valence = 0;
    let arousal = 0;
    const positive = ['开心', '好', '喜欢', '棒', '顺利', '舒服', '高兴', '感谢'];
    const negative = ['累', '烦', '难过', '糟糕', '失望', '生气', '焦虑'];
    const highArousal = ['兴奋', '激动', '紧张', '愤怒', '惊喜'];
    const lowArousal = ['平静', '无聊', '困', '疲惫', '淡然'];

    if (positive.some(w => content.includes(w))) valence = 0.6;
    if (negative.some(w => content.includes(w))) valence = -0.6;
    if (highArousal.some(w => content.includes(w))) arousal = 0.7;
    if (lowArousal.some(w => content.includes(w))) arousal = -0.5;

    const res = await this.client.query(
      `INSERT INTO memories (content, type, relation, importance, valence, arousal, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id`,
      [content, type, relation || 'self', importance, valence, arousal]
    );

    return { success: true, id: res.rows[0].id, valence, arousal };
  }

  async search(query, type, limit = 5) {
    let sql = `SELECT * FROM memories WHERE content ILIKE $1`;
    const params = [`%${query}%`];
    if (type) {
      sql += ` AND type = $2`;
      params.push(type);
    }
    sql += ` ORDER BY importance DESC, created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const res = await this.client.query(sql, params);
    return res.rows;
  }

  async recallByEmotion(vMin, vMax, aMin = -1, aMax = 1, limit = 5) {
    const res = await this.client.query(
      `SELECT * FROM memories
       WHERE valence BETWEEN $1 AND $2
         AND arousal BETWEEN $3 AND $4
       ORDER BY importance DESC, created_at DESC
       LIMIT $5`,
      [vMin, vMax, aMin, aMax, limit]
    );
    return res.rows;
  }

  async trace(id) {
    const res = await this.client.query(`SELECT * FROM memories WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  async close(summary) {
    const res = await this.client.query(
      `INSERT INTO memories (content, type, relation, importance, created_at)
       VALUES ($1, 'memo', 'self', 10, NOW()) RETURNING id`,
      [summary]
    );
    return { success: true, id: res.rows[0].id };
  }
}

module.exports = { MemoryManager };
