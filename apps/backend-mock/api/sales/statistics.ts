import pool from '../db/config';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { filterDataByRole } from '~/utils/permission';

// 使用SQL聚合查询优化的销售统计
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 100;
  const keyword = (query.keyword as string) || '';
  let manager = (query.manager as string) || '';
  const startDate = query.startDate as string;
  const endDate = query.endDate as string;
  const mode = (query.mode as string) || 'quantity';

  // 获取当前用户信息
  const userinfo = verifyAccessToken(event);

  // 根据用户角色过滤数据
  if (userinfo) {
    manager = filterDataByRole(userinfo, manager);
  }

  if (!startDate || !endDate) {
    return {
      code: 400,
      message: '请提供开始日期和结束日期',
    };
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

    // 第一步：获取有销量的产品总数（用于分页）
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      INNER JOIN daily_sales ds ON p.warehouse_sku = ds.warehouse_sku
      WHERE ds.date >= $${paramIndex} AND ds.date <= $${paramIndex + 1}
      ${productFilter}
    `;

    const countParams = [...productParams, startDate, endDate];
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total || '0');

    if (total === 0) {
      return {
        code: 0,
        data: {
          items: [],
          total: 0,
        },
      };
    }

    // 第二步：获取分页的产品销售统计
    const offset = (page - 1) * pageSize;

    let statsQuery: string;
    if (mode === 'orders') {
      // 订单数量模式：用CTE预计算每个订单的总销量，避免相关子查询
      statsQuery = `
        WITH order_totals AS (
          SELECT date, order_number, SUM(sales_quantity) as order_total
          FROM daily_sales
          WHERE date >= $${paramIndex} AND date <= $${paramIndex + 1}
            AND order_number IS NOT NULL
          GROUP BY date, order_number
        ),
        sales_with_ratio AS (
          SELECT
            ds.warehouse_sku,
            ds.date,
            SUM(
              CASE
                WHEN ds.order_number IS NOT NULL THEN
                  ds.sales_quantity::numeric / NULLIF(ot.order_total, 0)
                ELSE 1
              END
            ) as order_qty
          FROM daily_sales ds
          LEFT JOIN order_totals ot ON ds.date = ot.date AND ds.order_number = ot.order_number
          WHERE ds.date >= $${paramIndex} AND ds.date <= $${paramIndex + 1}
          GROUP BY ds.warehouse_sku, ds.date
        ),
        product_stats AS (
          SELECT
            p.id,
            p.manager,
            p.product_name,
            p.sku_name,
            p.warehouse_sku,
            SUM(sr.order_qty) as total_sales
          FROM products p
          INNER JOIN sales_with_ratio sr ON p.warehouse_sku = sr.warehouse_sku
          WHERE 1=1 ${productFilter}
          GROUP BY p.id, p.manager, p.product_name, p.sku_name, p.warehouse_sku
          ORDER BY total_sales DESC
          LIMIT $${paramIndex + 2} OFFSET $${paramIndex + 3}
        )
        SELECT
          ps.*,
          sr.date,
          sr.order_qty as daily_sales
        FROM product_stats ps
        LEFT JOIN sales_with_ratio sr ON ps.warehouse_sku = sr.warehouse_sku
        ORDER BY ps.total_sales DESC, sr.date DESC
      `;
    } else {
      // 销售数量模式：原有逻辑
      statsQuery = `
        WITH product_stats AS (
          SELECT
            p.id,
            p.manager,
            p.product_name,
            p.sku_name,
            p.warehouse_sku,
            SUM(ds.sales_quantity) as total_sales
          FROM products p
          INNER JOIN daily_sales ds ON p.warehouse_sku = ds.warehouse_sku
          WHERE ds.date >= $${paramIndex} AND ds.date <= $${paramIndex + 1}
          ${productFilter}
          GROUP BY p.id, p.manager, p.product_name, p.sku_name, p.warehouse_sku
          ORDER BY total_sales DESC
          LIMIT $${paramIndex + 2} OFFSET $${paramIndex + 3}
        )
        SELECT
          ps.*,
          ds.date,
          SUM(ds.sales_quantity) as daily_sales
        FROM product_stats ps
        LEFT JOIN daily_sales ds ON ps.warehouse_sku = ds.warehouse_sku
          AND ds.date >= $${paramIndex} AND ds.date <= $${paramIndex + 1}
        GROUP BY ps.id, ps.manager, ps.product_name, ps.sku_name, ps.warehouse_sku, ps.total_sales, ds.date
        ORDER BY ps.total_sales DESC, ds.date DESC
      `;
    }

    const statsParams = [...productParams, startDate, endDate, pageSize, offset];
    const statsResult = await pool.query(statsQuery, statsParams);

    // 组织数据：按产品分组，每个产品包含每日销量
    const productsMap = new Map<number, any>();

    statsResult.rows.forEach(row => {
      const productId = row.id;

      if (!productsMap.has(productId)) {
        productsMap.set(productId, {
          id: productId,
          manager: row.manager,
          productName: row.product_name,
          skuName: row.sku_name,
          warehouseSku: row.warehouse_sku,
          totalSales: parseFloat(row.total_sales || 0),
          avgDailySales: parseFloat((parseFloat(row.total_sales || 0) / days).toFixed(1)),
          trendData: [],
        });
      }

      const product = productsMap.get(productId);

      if (row.date) {
        // 直接从数据库DATE字段提取日期，避免时区转换
        // PostgreSQL的DATE类型返回的是UTC时间，需要手动提取日期部分
        const dateObj = new Date(row.date);
        // 使用UTC方法获取日期，避免本地时区影响
        const year = dateObj.getUTCFullYear();
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getUTCDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const field = `date_${dateStr.replace(/-/g, '_')}`;
        product[field] = parseFloat(row.daily_sales || 0);
      }
    });

    // 填充趋势数据
    const items = Array.from(productsMap.values()).map(product => {
      const trendData: number[] = [];
      const startDateObj = new Date(startDate + 'T00:00:00Z'); // 明确指定UTC时间
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDateObj);
        currentDate.setUTCDate(startDateObj.getUTCDate() + i);
        // 使用UTC方法获取日期，避免本地时区影响
        const year = currentDate.getUTCFullYear();
        const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getUTCDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const field = `date_${dateStr.replace(/-/g, '_')}`;
        trendData.push(product[field] || 0);
      }
      product.trendData = trendData;
      return product;
    });

    return {
      code: 0,
      data: {
        items,
        total,
      },
    };
  } catch (error: any) {
    console.error('销售统计查询失败:', error);
    return {
      code: 500,
      message: error.message || '查询失败',
      data: {
        items: [],
        total: 0,
      },
    };
  }
});
