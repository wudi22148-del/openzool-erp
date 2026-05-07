-- 订单异常反馈表
CREATE TABLE IF NOT EXISTS order_profit_feedback (
  id SERIAL PRIMARY KEY,
  order_profit_id INTEGER NOT NULL REFERENCES order_profit_records(id) ON DELETE CASCADE,
  -- 反馈信息
  feedback_text TEXT,                          -- 运营的反馈说明
  feedback_by VARCHAR(100) NOT NULL,           -- 提交反馈的用户名
  feedback_at TIMESTAMP DEFAULT NOW(),         -- 反馈时间
  -- 处理信息
  resolve_note TEXT,                           -- 主管的处理说明
  resolved_by VARCHAR(100),                    -- 处理人
  resolved_at TIMESTAMP,                       -- 处理时间
  -- 状态: pending=待处理, resolved=已处理待确认, confirmed=已确认
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_feedback_order_id ON order_profit_feedback(order_profit_id);
CREATE INDEX IF NOT EXISTS idx_order_feedback_status ON order_profit_feedback(status);
CREATE INDEX IF NOT EXISTS idx_order_feedback_feedback_by ON order_profit_feedback(feedback_by);
