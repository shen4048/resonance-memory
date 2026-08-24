CREATE TABLE memories (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  type VARCHAR(20) NOT NULL,
  relation VARCHAR(50) DEFAULT 'self',
  importance INTEGER DEFAULT 5,
  valence FLOAT DEFAULT 0,
  arousal FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_memories_type ON memories(type);
CREATE INDEX idx_memories_created_at ON memories(created_at);
CREATE INDEX idx_memories_importance ON memories(importance);
