# Aquaponik IoT Backend 🌿📡

Backend sederhana untuk menerima data dari perangkat IoT (ESP32) melalui protokol MQTT dan menyimpannya ke Supabase.

## 🔧 Tech Stack

- Node.js + Express
- MQTT.js
- Supabase (PostgreSQL)
- Mosquitto (via ngrok TCP forwarding)

---

## 📦 Fitur

- Terhubung dengan broker MQTT untuk menerima data sensor (misalnya suhu dan kelembaban)
- Parsing data dari pesan MQTT
- Menyimpan data ke database Supabase
- Logging status koneksi dan pesan masuk

---

## 🚀 Cara Menjalankan

### 1. Clone Repository

```bash
git clone https://github.com/singgiaditya/aquaponik-backend.git
cd aquaponik-backend 
```

### 2. Install Dependencies

```bash
npm install
```

### 2. Run App

```bash
node app.js
```
