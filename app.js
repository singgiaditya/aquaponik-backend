const express = require("express");
const mqtt = require("mqtt");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json()); // Tambahkan ini di atas sebelum semua endpoint
const port = process.env.PORT || 3001;

// Setup Supabase client
const supabase_url = process.env.supabase_url;
const supabase_anon_key = process.env.supabase_anon_key;
//mqtt
const mqtt_url = process.env.mqtt_url;
const mqtt_port = process.env.mqtt_port;
const mqtt_username = process.env.mqtt_username;
const mqtt_password = process.env.mqtt_password;

const supabase = createClient(supabase_url, supabase_anon_key);

// Setup MQTT client
const mqttClient = mqtt.connect(mqtt_url, {
  port: mqtt_port,
  username: mqtt_username,
  password: mqtt_password,
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
        ph: data.ph,
      },
    ]);

    io.emit("iot_data", data);

    if (error) {
      console.error("Gagal simpan ke Supabase:", error.message);
    } else {
      console.log("Data berhasil dikirim ke Supabase");
    }
  } catch (err) {
    console.error("Gagal parse atau simpan data:", err.message);
  }
});

// Import routes
const dataRoutes = require("./routes/dataRoutes")(supabase, mqttClient);
const actionRoutes = require("./routes/actionRoutes")(supabase);

// Endpoint testing
app.get("/", (req, res) => {
  res.send("MQTT listener running and Express server is up!");
});

app.use("/", dataRoutes);
app.use(
  "/",
  (req, res, next) => {
    req.mqttClient = mqttClient;
    next();
  },
  actionRoutes
);

server.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});
