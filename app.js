const express = require("express");
const mqtt = require("mqtt");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");


const app = express();
app.use(cors());
const port = 3001;

// Setup Supabase client
const supabase_url = process.env.supabase_url;
const supabase_anon_key = process.env.supabase_anon_key;

const supabase = createClient(supabase_url, supabase_anon_key);

// Setup MQTT client
const mqttClient = mqtt.connect(
  "mqtt://belajario:jsEg5E9jej5ScWAY@belajario.cloud.shiftr.io"
);

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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

mqttClient.on("message", async (topic, message) => {
  console.log("Pesan masuk:", message.toString());
  try {
    const data = JSON.parse(message.toString());

    const { error } = await supabase.from("iot_data").insert([
      {
        temperature: data.temperature,
        humidity: data.humidity,
        water_distance: data.water_distance,
        water_temperature: data.water_temperature,
        light_intensity: data.light_intensity,
        tds: data.tds,
        ph: data.ph
      },
    ]);

    io.emit("iot_data", data);

    if (data.water_distance < 5) {
      mqttClient.publish("esp/action", "decrease_water");
      console.error("Mengirimkan perintah untuk meningkatkan air");
    } else if (data.water_distance > 15) {
      mqttClient.publish("esp/action", "increase_water");
      console.error("Mengirimkan perintah untuk mengurangi air");
    }

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

app.get("/data", async (req, res) => {
  const { data, error } = await supabase
    .from("iot_data")
    .select("*")
    .order("id", { ascending: false,  })
    .limit(10);

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  mqttClient.publish("esp/log", JSON.stringify(data));
  res.json(data.reverse());
});


server.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});
