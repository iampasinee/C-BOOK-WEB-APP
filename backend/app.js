require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const { sequelize } = require('./models');

const bookRoutes = require('./routes/bookRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, service: 'backend', date: new Date().toISOString() });
});

const port = Number(process.env.PORT || 3000);

sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`C-BOOK backend API running at http://localhost:${port}`);
  });
});
