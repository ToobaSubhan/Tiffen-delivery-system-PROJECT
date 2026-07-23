const sql = require('mssql');
const { getConnection } = require('./config/database');
(async () => {
  try {
    const pool = await getConnection();
    const q = `SELECT d.delivery_id, d.order_id, d.status, o.delivery_date, d.delivery_time, c.first_name + ' ' + c.last_name AS customer_name, c.phone AS customer_phone, c.address, r.first_name + ' ' + r.last_name AS rider_name, r.phone AS rider_phone, r.vehicle_number AS rider_vehicle_number, r.status AS rider_status FROM Deliveries d LEFT JOIN Orders o ON d.order_id = o.order_id LEFT JOIN Subscriptions s ON o.subscription_id = s.subscription_id LEFT JOIN Customers c ON s.customer_id = c.customer_id LEFT JOIN Riders r ON d.rider_id = r.rider_id ORDER BY o.delivery_date DESC, d.delivery_time DESC`;
    console.log('QUERY:', q);
    const res = await pool.request().query(q);
    console.log('ROWS', res.recordset.length);
    console.log('SAMPLE', res.recordset[0]);
    await pool.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
