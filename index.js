const express = require("express");
const cors = require("cors");

// Import routes
const userRoutes = require("./Routes/Authencation");
const itemRoutes = require("./Routes/itemRoutes");
const vendorRoutes = require("./Routes/vendorRoutes");
const stockRoutes = require("./Routes/stockRoutes");
const billingRoutes = require("./Routes/billingRoutes");
const rolesRoutes = require("./Routes/rolesRoutes");
const alertRoutes = require("./Routes/alertRoutes");
const dashboardRoutes = require("./Routes/dashboardRoutes");
const authRoutes = require("./Routes/authRoutes");
const orderRoutes = require("./Routes/orderRoutes");
const inventoryrequestRoutes = require("./Routes/inventoryrequestRoutes");

const app = express();

// ====== Middleware ======
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json()); // replaces body-parser
app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// ====== Routes ======
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inventory-requests", inventoryrequestRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Inventory API is running ✅");
});

// ====== Start server safely ======
const PORT = process.env.PORT || 9000;

if (!module.parent) {
  app.listen(PORT, () => {
    console.log("Order routes mounted at /api/orders");
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app; // export for testing
