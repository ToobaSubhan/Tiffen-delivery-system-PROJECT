const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { getConnection } = require("../config/database");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// USER → Submit Feedback
router.post("/", verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const normalizedRating = Number(rating);
    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const normalizedComment = typeof comment === "string" ? comment.trim() : "";

    const pool = await getConnection();
    await pool.request()
      .input("user_id", sql.Int, user_id)
      .input("rating", sql.Int, normalizedRating)
      .input("comment", sql.NVarChar(sql.MAX), normalizedComment)
      .query(`
        INSERT INTO Feedback (user_id, rating, comment)
        VALUES (@user_id, @rating, @comment)
      `);

    res.json({ message: "Feedback submitted successfully" });
  } catch (err) {
    console.error("FEEDBACK POST ERROR:", err);
    res.status(500).json({ message: "Failed to submit feedback", error: process.env.NODE_ENV === "development" ? err.message : undefined });
  }
});


// ADMIN → View all feedback
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT f.feedback_id, f.rating, f.comment, f.created_at,
             CONCAT(u.first_name, ' ', u.last_name) AS username
      FROM Feedback f
      JOIN Customers u ON f.user_id = u.customer_id
      ORDER BY f.created_at DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("FEEDBACK GET ERROR:", err);
    res.status(500).json({ message: "Failed to fetch feedback", error: process.env.NODE_ENV === "development" ? err.message : undefined });
  }
});

// ADMIN → Delete Feedback
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .query(`DELETE FROM Feedback WHERE feedback_id = @id`);

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("FEEDBACK DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to delete feedback", error: process.env.NODE_ENV === "development" ? err.message : undefined });
  }
});

module.exports = router;
