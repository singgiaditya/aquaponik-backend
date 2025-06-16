const express = require("express");
const router = express.Router();

module.exports = (supabase) => {
  // Get all actions with pagination
  router.get("/actions", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort === "asc" ? "asc" : "desc";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("iot_action")
      .select("*", { count: "exact" })
      .range(from, to)
      .order("id", { ascending: sort === "asc" });

    if (error) return res.status(500).json({ error: error.message });
    res.json({
      data,
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      sort,
    });
  });

  // Insert new action
  router.post("/actions", async (req, res) => {
    const { type, action, value } = req.body;
    if (!type || !action || value === undefined) {
      return res.status(400).json({ error: "type, action, dan value wajib diisi" });
    }
    const { data, error } = await supabase
      .from("iot_action")
      .insert([{ type, action, value }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    // Kirim ke MQTT
    if (req.mqttClient) {
      req.mqttClient.publish(
        "esp2/receive/action",
        // JSON.stringify({ type, action, value })
        type
      );
    }

    console.log("mqtt kirim action:", type);
    res.status(201).json({ message: "Action berhasil ditambahkan", data });
  });

  return router;
};