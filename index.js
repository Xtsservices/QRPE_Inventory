const express = require('express');
const bodyParser = require('body-parser');

// Import routes
const userRoutes = require('./Routes/Authencation');
const itemRoutes = require('./Routes/itemRoutes');
const vendorRoutes = require('./Routes/vendorRoutes');
const stockRoutes = require('./Routes/stockRoutes');
const billingRoutes = require('./Routes/billingRoutes'); // <-- Add this line
const rolesRoutes = require('./Routes/rolesRoutes');
const alertRoutes = require('./Routes/alertRoutes');
const dashboardRoutes = require('./Routes/dashboardRoutes');
const authRoutes = require('./Routes/authRoutes');

const app = express();
const PORT = 9000;

app.use(bodyParser.json());

// Register routes
app.use('/api', userRoutes);
app.use('/api', itemRoutes);
app.use('/api', vendorRoutes);
app.use('/api', stockRoutes);
app.use('/api', billingRoutes); // <-- Add this line
app.use('/api', rolesRoutes);
app.use('/api', alertRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});