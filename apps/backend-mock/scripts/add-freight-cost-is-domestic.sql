-- 为 freight_costs 表添加 is_domestic 字段
-- 用于标记运单是否为国内发货，替代原来通过运单号前缀判断的逻辑
-- 如果为 true，计算产品成本时使用国内仓成本（纯产品成本）
-- 如果为 false，使用海外仓成本（产品成本 + 税金 + 头程运费）

ALTER TABLE freight_costs ADD COLUMN IF NOT EXISTS is_domestic BOOLEAN NOT NULL DEFAULT FALSE;
