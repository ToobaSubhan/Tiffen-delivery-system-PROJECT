const cron = require('node-cron');
const sql = require('mssql');
const { getConnection } = require('../config/database');

const STATUS_SEQUENCE = ['assigned', 'picked_up', 'in transit', 'delivered'];

const normalizeStatus = (status) => (status === 'in transit' ? 'in transit' : status);

const getTodayDate = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

const createDailyDeliveries = async () => {
  try {
    const pool = await getConnection();
    const today = getTodayDate();

    const activeSubs = await pool.request().query(`
      SELECT subscription_id, customer_id, plan_id
      FROM Subscriptions
      WHERE status = 'active'
    `);

    for (const sub of activeSubs.recordset) {
      const orderCheck = await pool.request()
        .input('subscriptionId', sql.Int, sub.subscription_id)
        .input('today', sql.Date, today)
        .query(`
          SELECT TOP 1 order_id
          FROM Orders
          WHERE subscription_id = @subscriptionId
            AND CAST(order_date AS DATE) = @today
        `);

      if (orderCheck.recordset.length > 0) {
        continue;
      }

      const orderResult = await pool.request()
        .input('customerId', sql.Int, sub.customer_id)
        .input('subscriptionId', sql.Int, sub.subscription_id)
        .input('orderDate', sql.DateTime, new Date())
        .input('deliveryDate', sql.Date, today)
        .input('status', sql.VarChar(30), 'pending')
        .query(`
          INSERT INTO Orders (customer_id, subscription_id, order_date, delivery_date, status)
          VALUES (@customerId, @subscriptionId, @orderDate, @deliveryDate, @status);
          SELECT CAST(SCOPE_IDENTITY() AS INT) AS order_id;
        `);

      const orderId = orderResult.recordset[0].order_id;

      await pool.request()
        .input('orderId', sql.Int, orderId)
        .input('status', sql.VarChar(30), 'assigned')
        .query(`
          INSERT INTO Deliveries (order_id, status)
          VALUES (@orderId, @status);
        `);
    }

    console.log(`[scheduler] Created daily deliveries for ${activeSubs.recordset.length} active subscriptions`);
  } catch (error) {
    console.error('[scheduler] createDailyDeliveries error:', error);
  }
};

const progressDeliveryStatuses = async () => {
  try {
    const pool = await getConnection();
    const today = getTodayDate();

    const deliveryRows = await pool.request()
      .input('today', sql.Date, today)
      .query(`
        SELECT d.delivery_id, d.status, o.order_id
        FROM Deliveries d
        JOIN Orders o ON d.order_id = o.order_id
        WHERE CAST(o.order_date AS DATE) = @today
      `);

    for (const row of deliveryRows.recordset) {
      const currentIndex = STATUS_SEQUENCE.indexOf(normalizeStatus(row.status));
      if (currentIndex === -1 || currentIndex >= STATUS_SEQUENCE.length - 1) {
        continue;
      }

      const nextStatus = STATUS_SEQUENCE[currentIndex + 1];
      await pool.request()
        .input('deliveryId', sql.Int, row.delivery_id)
        .input('status', sql.VarChar(30), nextStatus)
        .query(`
          UPDATE Deliveries
          SET status = @status
          WHERE delivery_id = @deliveryId
        `);
    }

    console.log(`[scheduler] Advanced ${deliveryRows.recordset.length} deliveries to the next status`);
  } catch (error) {
    console.error('[scheduler] progressDeliveryStatuses error:', error);
  }
};

const startDeliveryScheduler = () => {
  cron.schedule('0 7 * * *', () => {
    console.log('[scheduler] Running daily delivery creation job');
    createDailyDeliveries();
  });

  cron.schedule('0 8 * * *', () => {
    console.log('[scheduler] Running daily delivery pickup job');
    progressDeliveryStatuses();
  });

  cron.schedule('0 9 * * *', () => {
    console.log('[scheduler] Running daily delivery transit job');
    progressDeliveryStatuses();
  });

  cron.schedule('0 11 * * *', () => {
    console.log('[scheduler] Running daily delivery delivered job');
    progressDeliveryStatuses();
  });

  console.log('[scheduler] Delivery scheduler started');
};

module.exports = { startDeliveryScheduler };
