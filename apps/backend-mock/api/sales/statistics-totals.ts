import pool from '../db/config';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { filterDataByRole } from '~/utils/permission';

// 获取销售统计的总计数据（不分页）
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const keyword = (query.keyword as string) || '';
  let manager = (query.manager as string) || '';
  const startDate = query.startDate as string;
  const endDate = query.endDate as string;
  const mode = (query.mode as string) || 'quantity';

  if (!startDate || !endDate) {
    return {
      code: 400,
      message: '请提供开始日期和结束日期',
    };
  }

  // 获取当前用户信息，根据角色过滤数据
  const userinfo = verifyAccessToken(event);
  if (userinfo) {
    manager = filterDataByRole(userinfo, manager);
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 构建产品筛选条件
    let productFilter = '';
    const productParams: any[] = [];
    let paramIndex = 1;

    if (keyword) {
      productFilter += ` AND (p.product_name ILIKE $${paramIndex} OR p.sku_name ILIKE $${paramIndex} OR p.warehouse_sku ILIKE $${paramIndex})`;
      productParams.push(`%${keyword}%`);
      paramIndex++;
    }

    if (manager) {
      productFilter += ` AND p.manager = $${paramIndex}`;
      productParams.push(manager);
      paramIndex++;
    }

    let totalSalesQuery: string;
    let dailyTotalsQuery: string;

    if (mode === 'orders') {
      // 订单数量模式：用CTE预计算每个订单的总销量
      totalSalesQuery = `
        WITH order_totals AS (
          SELECT date, order_number, SUM(sales_quantity) as order_total
          FROM daily_sales
          WHERE date >= $${paramIndex} AND date <= $${paramIndex + 1}
            AND order_number IS NOT NULL
          GROUP BY date, order_number
        )
        SELECT SUM(
          CASE
            WHEN ds.order_number IS NOT NULL THEN
              ds.sales_quantity::numeric / NULLIF(ot.order_total, 0)
            ELSE 1
          END
        ) as total_sales
        FROM products p
        INNER JOIN daily_sales ds ON p.warehouse_sku = ds.warehouse_sku
        LEFT JOIN order_totals ot ON ds.date = ot.date AND ds.order_number = ot.order_number
        WHERE ds.date >= $${paramIndex} AND ds.date <= $${paramIndex + 1}
        ${productFilter}
      `;

      dailyTotalsQuery = `
        WITH order_totals AS (
          SELECT date, order_number, SUM(sales_quantity) as order_total
          FROM daily_sales
          WHERE date >= $${paramIndex} AND date <= $${paramIndex + 1}
            AND order_number IS NOT NULL
          GROUP BY date, order_number
        )
        SELECT
          ds.date,
          SUM(
            CASE
              WHEN ds.order_number IS NOT NULL THEN
                ds.sales_quantity::numeric / NULLIF(ot.order_total, 0)
              ELSE 1
            END
          ) as daily_total
        FROM products p
        INNER JOIN daily_sales ds ON p.warehouse_sku = ds.warehouse_sku
        LEFT JOIN order_totals ot ON ds.date = ot.date AND ds.order_number = ot.order_number
        WHERE ds.date >= $${paramIndex} AND ds.date <= $${paramIndex + 1}
        ${productFilter}
        GROUP BY ds.date
        ORDER BY ds.date DESC
      `;
    } else {
      // 销售数量模式
      totalSalesQuery = `
        SELECT SUM(ds.sales_quantity) as total_sales
        FROM products p
        INNER JOIN daily_sales ds ON p.warehouse_sku = ds.warehouse_sku
        WHERE ds.date >= $${paramIndex} AND ds.date <= $${paramIndex + 1}
        ${productFilter}
      `;

      dailyTotalsQuery = `
        SELECT
          ds.date,
          SUM(ds.sales_quantity) as daily_total
        FROM products p
        INNER JOIN daily_sales ds ON p.warehouse_sku = ds.warehouse_sku
        WHERE ds.date >= $${paramIndex} AND ds.date <= $${paramIndex + 1}
        ${productFilter}
        GROUP BY ds.date
        ORDER BY ds.date DESC
      `;
    }

    const totalSalesParams = [...productParams, startDate, endDate];
    const totalSalesResult = await pool.query(totalSalesQuery, totalSalesParams);
    const totalSales = parseFloat(totalSalesResult.rows[0]?.total_sales || 0);

    const dailyTotalsResult = await pool.query(dailyTotalsQuery, totalSalesParams);

    // 组织每日数据
    const dailyStats: any = {};
    dailyTotalsResult.rows.forEach(row => {
      // 使用UTC方法获取日期，避免本地时区影响
      const dateObj = new Date(row.date);
      const year = dateObj.getUTCFullYear();
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getUTCDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const field = `date_${dateStr.replace(/-/g, '_')}`;
      dailyStats[field] = parseFloat(row.daily_total || 0);
    });

    return {
      code: 0,
      data: {
        totalSales,
        avgDailySales: days > 0 ? totalSales / days : 0,
        dailyStats,
      },
    };
  } catch (error: any) {
    console.error('获取总计数据失败:', error);
    return {
      code: 500,
      message: error.message || '查询失败',
      data: {
        totalSales: 0,
        avgDailySales: 0,
        dailyStats: {},
      },
    };
  }
});
