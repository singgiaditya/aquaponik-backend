const mqtt = require("mqtt");
const { createClient } = require("@supabase/supabase-js");

const mqttClient = mqtt.connect("mqtt://localhost:1883", {
  username: "singgi",
  password: "singgi",
});

const supabase_url = "https://vglkxfjihhnkwxqohpbw.supabase.co";

const supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnbGt4ZmppaGhua3d4cW9ocGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNDU5MDksImV4cCI6MjA2MDYyMTkwOX0.ksigYHQDfOvcvTSIoOtFu6TBzZomUwchiJWHiSEcXUM";

const supabase = createClient(
  supabase_url,
  supabase_anon_key
);

mqttClient.on("connect", () => {
  console.log("Connected to MQTT");
  mqttClient.subscribe("esp/data");
});

mqttClient.on("message", async (topic, message) => {
  console.log("Pesan masuk:", message.toString());

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
});
