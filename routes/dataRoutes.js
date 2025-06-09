const express = require("express");
const router = express.Router();

module.exports = (supabase, mqttClient) => {
  // Endpoint testing
  router.get("/", (req, res) => {
    res.send("MQTT listener running and Express server is up!");
  });

  // Get 10 latest data
  router.get("/data", async (req, res) => {
    const { data, error } = await supabase
      .from("iot_data")
      .select("*")
      .order("id", { ascending: false })
      .limit(10);

    if (error) return res.status(500).json({ error: error.message });
    mqttClient.publish("esp/log", JSON.stringify(data));
    res.json(data.reverse());
  });

  // Get all data with pagination
  router.get("/data/all", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort === "asc" ? "asc" : "desc";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("iot_data")
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

  return router;
};