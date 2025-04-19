const express = require("express");
const mqtt = require("mqtt");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = 3000;

// Setup Supabase client
const supabase_url = "https://vglkxfjihhnkwxqohpbw.supabase.co";
const supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnbGt4ZmppaGhua3d4cW9ocGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNDU5MDksImV4cCI6MjA2MDYyMTkwOX0.ksigYHQDfOvcvTSIoOtFu6TBzZomUwchiJWHiSEcXUM"

const supabase = createClient(supabase_url, supabase_anon_key);

// Setup MQTT client
const mqttClient = mqtt.connect("mqtt://localhost:1883", {
  username: "singgi",
  password: "singgi",
});

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  mqttClient.subscribe("esp/data", (err) => {
    if (err) {
      console.error("Gagal subscribe:", err.message);
    } else {
      console.log("Berhasil subscribe ke topik esp/data");
    }
  });
});

mqttClient.on("message", async (topic, message) => {
  console.log("Pesan masuk:", message.toString());

  try {
    const data = JSON.parse(message.toString());

    const { error } = await supabase.from("iot_data").insert([
      {
        temperature: data.temperature,
        humidity: data.humidity,
      },
    ]);

    if (error) {
      console.error("Gagal simpan ke Supabase:", error.message);
    } else {
      console.log("Data berhasil dikirim ke Supabase");
    }
  } catch (err) {
    console.error("Gagal parse atau simpan data:", err.message);
  }
});

// Endpoint testing
app.get("/", (req, res) => {
  res.send("MQTT listener running and Express server is up!");
});

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});
