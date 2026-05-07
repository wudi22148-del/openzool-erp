-- 先删除同月同运单号重复行（保留最新 ctid）
DELETE FROM freight_costs fc1
USING freight_costs fc2
WHERE fc1.ctid < fc2.ctid
  AND fc1.month = fc2.month
  AND fc1.waybill_number = fc2.waybill_number;

-- 添加唯一约束（若已存在则跳过）
ALTER TABLE freight_costs
  ADD CONSTRAINT freight_costs_month_waybill_unique UNIQUE (month, waybill_number);
