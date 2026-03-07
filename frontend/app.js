require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

const app = express();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'cbook_internal_key';
const PORT = Number(process.env.PORT || 5000);

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000
});
const upload = multer({ dest: path.join(__dirname, 'tmp') });

function apiHeaders(req) {
  const headers = {
    'x-internal-api-key': INTERNAL_API_KEY
  };

  if (req.session?.userId) headers['x-user-id'] = String(req.session.userId);
  if (req.session?.role) headers['x-user-role'] = req.session.role;

  return headers;
}

function isLoggedIn(req, res, next) {
  if (req.session?.userId) return next();
  return res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.session?.userId && req.session?.role === 'admin') return next();
  return res.redirect('/login');
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'cbook_frontend_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
  })
);

app.use((req, res, next) => {
  res.locals.backendBaseUrl = BACKEND_URL;
  next();
});

app.use('/images', (req, res) => {
  res.redirect(`${BACKEND_URL}/images${req.url}`);
});

app.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const search = req.query.search || '';
    const category = req.query.category || 'all';

    const [booksResp, categoriesResp] = await Promise.all([
      api.get('/api/books', {
        params: { page, search, category, onlyAvailable: 1, limit: 12 },
        headers: apiHeaders(req)
      }),
      api.get('/api/categories', {
        params: { limit: 100 },
        headers: apiHeaders(req)
      })
    ]);

    const booksData = booksResp.data;
    const categoriesData = categoriesResp.data;

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
      return res.json({
        books: booksData.books,
        currentPage: booksData.currentPage,
        totalPages: booksData.totalPages,
        userLoggedIn: !!req.session?.userId
      });
    }

    return res.render('home', {
       activePage: 'home',
      books: booksData.books,
      categories: categoriesData.categories,
      currentCategory: category,
      currentPage: booksData.currentPage,
      totalPages: booksData.totalPages,
      searchQuery: search,
      userLoggedIn: !!req.session?.userId,
      cartCount: req.session.cartCount || 0,
      userName: req.session.userName || null,
      backendBaseUrl: BACKEND_URL
    });
  } catch (error) {
    console.error('home error:', error.message);
    return res.status(500).send('Error loading home page');
  }
});

app.get('/contact', async (req, res) => {
  try {
    const categoriesResp = await api.get('/api/categories', {
      params: { limit: 100 },
      headers: apiHeaders(req)
    });

    return res.render('contact', {
      categories: categoriesResp.data.categories || [],
      currentCategory: 'all',
      searchQuery: '',
      activePage: 'contact',
      userLoggedIn: !!req.session?.userId,
      cartCount: req.session.cartCount || 0,
      userName: req.session.userName || null,
      backendBaseUrl: BACKEND_URL
    });
  } catch (error) {
    console.error('contact error:', error.message);
    return res.status(500).send('Error loading contact page');
  }
});

app.get('/login', (req, res) => res.render('login', { error: null }));
app.get('/register', (req, res) => res.render('register', { error: null }));

app.post('/login', async (req, res) => {
  try {
    const response = await api.post('/api/users/login', req.body, { headers: apiHeaders(req) });
    const user = response.data.user;

    req.session.userId = user.user_id;
    req.session.userName = user.user_name;
    req.session.userEmail = user.user_email;
    req.session.role = user.user_role;

    if (user.user_role === 'admin') return res.redirect('/management');
    return res.redirect('/');
  } catch (error) {
    const message = error.response?.data?.message || 'Login failed';
    return res.status(400).render('login', { error: message });
  }
});

app.post('/register', async (req, res) => {
  try {
    await api.post('/api/users/register', req.body, { headers: apiHeaders(req) });
    return res.redirect('/login');
  } catch (error) {
    const message = error.response?.data?.message || 'Registration failed';
    return res.status(400).render('register', { error: message });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.post('/cart/add', isLoggedIn, async (req, res) => {
  try {
    const response = await api.post(
      '/api/cart/add',
      { bookId: req.body.bookId, cart: req.session.cart || [] },
      { headers: apiHeaders(req) }
    );

    req.session.cart = response.data.cart;
    req.session.cartCount = response.data.totalItems;

    return res.json({
      success: response.data.success,
      totalItems: response.data.totalItems,
      isMax: response.data.isMax || false
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/cart/get', isLoggedIn, async (req, res) => {
  try {
    const response = await api.post(
      '/api/cart/summary',
      { cart: req.session.cart || [] },
      { headers: apiHeaders(req) }
    );

    return res.json(response.data);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/cart/update', isLoggedIn, async (req, res) => {
  try {
    const response = await api.post(
      '/api/cart/update',
      { ...req.body, cart: req.session.cart || [] },
      { headers: apiHeaders(req) }
    );

    req.session.cart = response.data.cart;
    req.session.cartCount = response.data.totalItems;

    return res.json(response.data);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/checkout', isLoggedIn, (req, res) => {
  const cart = req.session.cart || [];
  if (!cart.length) return res.redirect('/');

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const shippingFee = 50;

  return res.render('checkout', {
    cart,
    totalItems,
    totalPrice,
    shippingFee,
    grandTotal: totalPrice + shippingFee,
    userLoggedIn: true,
    userName: req.session.userName,
    userEmail: req.session.userEmail,
    cartCount: req.session.cartCount || 0
  });
});

app.post('/checkout/process', isLoggedIn, async (req, res) => {
  try {
    await api.post(
      '/api/orders/checkout/process',
      { ...req.body, cart: req.session.cart || [] },
      { headers: apiHeaders(req) }
    );

    req.session.cart = [];
    req.session.cartCount = 0;

    return res.redirect('/?success=true');
  } catch (error) {
    return res.status(500).send('Error processing checkout');
  }
});

app.get('/management', isAdmin, async (req, res) => {
  try {
    const response = await api.get('/api/reports/dashboard', { headers: apiHeaders(req) });
    const data = response.data;

    return res.render('management', {
      activePage: 'home',
      ...data,
      userName: req.session.userName,
      userEmail: req.session.userEmail,
      backendBaseUrl: BACKEND_URL
    });
  } catch (error) {
    return res.status(500).send('Error loading dashboard');
  }
});

app.get('/management/books', isAdmin, async (req, res) => {
  try {
    const [booksResp, categoriesResp] = await Promise.all([
      api.get('/api/books', {
        params: {
          page: req.query.page || 1,
          search: req.query.search || '',
          category: req.query.category || '',
          status: req.query.status || '',
          limit: 6
        },
        headers: apiHeaders(req)
      }),
      api.get('/api/categories', { params: { limit: 100 }, headers: apiHeaders(req) })
    ]);

    const data = booksResp.data;
    const categories = categoriesResp.data.categories || [];

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
      return res.json(data);
    }

    return res.render('management/book/list_books', {
      books: data.books || [],
      categories,
      totalPages: data.totalPages || 1,
      currentPage: data.currentPage || 1,
      totalItems: data.totalItems || 0,
      limit: data.limit || 6,
      searchQuery: req.query.search || '',
      filterCategory: req.query.category || '',
      filterStatus: req.query.status || '',
      totalBooksCount: data.totalItems || 0,
      activePage: 'books',
      userName: req.session.userName,
      userEmail: req.session.userEmail,
      backendBaseUrl: BACKEND_URL
    });
  } catch (error) {
    return res.status(500).send('Error loading books');
  }
});

app.get('/management/books/create', isAdmin, async (req, res) => {
  try {
    const response = await api.get('/api/categories', { params: { limit: 100 }, headers: apiHeaders(req) });
    return res.render('management/book/create_book', {
      categories: response.data.categories || [],
      activePage: 'books',
      userName: req.session.userName,
      userEmail: req.session.userEmail
    });
  } catch (error) {
    return res.status(500).send('Error loading create form');
  }
});

app.post('/management/books/create', isAdmin, upload.single('book_img'), async (req, res) => {
  try {
    const form = new FormData();
    form.append('title', req.body.title || '');
    form.append('author', req.body.author || '');
    form.append('price', req.body.price || 0);
    form.append('stock_quantity', req.body.stock_quantity || 0);
    form.append('category_id', req.body.category_id || '');

    if (req.file) {
      form.append('book_img', fs.createReadStream(req.file.path), req.file.originalname);
    }

    await api.post('/api/books', form, {
      headers: { ...apiHeaders(req), ...form.getHeaders() }
    });

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.redirect('/management/books');
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).send(error.response?.data?.message || 'Create failed');
  }
});

app.get('/management/books/edit/:id', isAdmin, async (req, res) => {
  try {
    const [bookResp, categoriesResp] = await Promise.all([
      api.get(`/api/books/${req.params.id}`, { headers: apiHeaders(req) }),
      api.get('/api/categories', { params: { limit: 100 }, headers: apiHeaders(req) })
    ]);

    return res.render('management/book/edit_book', {
      book: bookResp.data.book,
      categories: categoriesResp.data.categories || [],
      activePage: 'books',
      currentPage: req.query.page || 1,
      searchQuery: req.query.search || '',
      filterCategory: req.query.category || '',
      filterStatus: req.query.status || '',
      userName: req.session.userName,
      userEmail: req.session.userEmail
    });
  } catch (error) {
    return res.status(500).send('Error loading edit form');
  }
});

app.post('/management/books/edit/:id', isAdmin, upload.single('book_img'), async (req, res) => {
  try {
    const form = new FormData();
    form.append('title', req.body.title || '');
    form.append('author', req.body.author || '');
    form.append('price', req.body.price || 0);
    form.append('stock_quantity', req.body.stock_quantity || 0);
    form.append('category_id', req.body.category_id || '');

    if (req.file) {
      form.append('book_img', fs.createReadStream(req.file.path), req.file.originalname);
    }

    await api.put(`/api/books/${req.params.id}`, form, {
      headers: { ...apiHeaders(req), ...form.getHeaders() }
    });

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const { page, search, category, status } = req.body;
    return res.redirect(
      `/management/books?page=${page || 1}&search=${encodeURIComponent(search || '')}&category=${encodeURIComponent(
        category || ''
      )}&status=${encodeURIComponent(status || '')}`
    );
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).send(error.response?.data?.message || 'Update failed');
  }
});

app.delete('/management/books/delete/:id', isAdmin, async (req, res) => {
  try {
    const response = await api.delete(`/api/books/${req.params.id}`, { headers: apiHeaders(req) });
    return res.json(response.data);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

app.get('/management/categories/', isAdmin, async (req, res) => {
  try {
    const response = await api.get('/api/categories', {
      params: { page: req.query.page || 1, search: req.query.search || '', limit: 6 },
      headers: apiHeaders(req)
    });

    const data = response.data;

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
      return res.json(data);
    }

    return res.render('management/category/list_cate', {
      categories: data.categories || [],
      activePage: 'categories',
      currentPage: data.currentPage || 1,
      totalPages: data.totalPages || 1,
      totalItems: data.totalItems || 0,
      limit: data.limit || 6,
      searchQuery: req.query.search || '',
      stats: data.stats || { totalCategories: 0, totalBooks: 0 },
      userName: req.session.userName,
      userEmail: req.session.userEmail
    });
  } catch (error) {
    return res.status(500).send('Error loading categories');
  }
});

app.get('/management/category/create', isAdmin, (req, res) => {
  res.render('management/category/create_cate', {
    activePage: 'categories',
    userName: req.session.userName,
    userEmail: req.session.userEmail
  });
});

app.post('/management/category/create', isAdmin, async (req, res) => {
  try {
    await api.post('/api/categories', req.body, { headers: apiHeaders(req) });
    return res.redirect('/management/categories/');
  } catch (error) {
    return res.status(400).render('management/category/create_cate', {
      errorMessage: error.response?.data?.message || 'Create category failed',
      oldValue: req.body.category_name,
      activePage: 'categories',
      userName: req.session.userName,
      userEmail: req.session.userEmail
    });
  }
});

app.get('/management/category/edit/:id', isAdmin, async (req, res) => {
  try {
    const response = await api.get(`/api/categories/${req.params.id}`, { headers: apiHeaders(req) });
    return res.render('management/category/edit_cate', {
      cat: response.data.category,
      activePage: 'categories',
      userName: req.session.userName,
      userEmail: req.session.userEmail
    });
  } catch (error) {
    return res.status(404).redirect('/management/categories/');
  }
});

app.post('/management/category/edit/:id', isAdmin, async (req, res) => {
  try {
    await api.put(`/api/categories/${req.params.id}`, req.body, { headers: apiHeaders(req) });
    return res.redirect('/management/categories/');
  } catch (error) {
    return res.status(400).render('management/category/edit_cate', {
      cat: { category_id: req.params.id, category_name: req.body.category_name },
      errorMessage: error.response?.data?.message || 'Update category failed',
      activePage: 'categories',
      userName: req.session.userName,
      userEmail: req.session.userEmail
    });
  }
});

app.delete('/management/category/delete/:id', isAdmin, async (req, res) => {
  try {
    const response = await api.delete(`/api/categories/${req.params.id}`, { headers: apiHeaders(req) });
    return res.json(response.data);
  } catch (error) {
    return res.status(400).json(error.response?.data || { success: false, message: 'Delete category failed' });
  }
});

app.get('/management/users/', isAdmin, async (req, res) => {
  try {
    const response = await api.get('/api/users', {
      params: {
        page: req.query.page || 1,
        search: req.query.search || '',
        role: req.query.role || 'member',
        limit: 6
      },
      headers: apiHeaders(req)
    });

    const data = response.data;

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
      return res.json(data);
    }

    return res.render('management/user/list_users', {
      users: data.users || [],
      totalPages: data.totalPages || 1,
      currentPage: data.currentPage || 1,
      totalItems: data.totalItems || 0,
      limit: data.limit || 6,
      searchQuery: req.query.search || '',
      filterRole: req.query.role || 'member',
      totalUsersCount: data.totalUsersCount || 0,
      totalAdminCount: data.totalAdminCount || 0,
      totalMemberCount: data.totalMemberCount || 0,
      activePage: 'members',
      userName: req.session.userName,
      userEmail: req.session.userEmail
    });
  } catch (error) {
    return res.status(500).send('Error loading users');
  }
});

app.put('/management/users/:id/role', isAdmin, async (req, res) => {
  try {
    const response = await api.put(`/api/users/${req.params.id}/role`, req.body, { headers: apiHeaders(req) });
    return res.json(response.data);
  } catch (error) {
    return res.status(400).json(error.response?.data || { success: false, message: 'Role update failed' });
  }
});

app.delete('/management/users/:id', isAdmin, async (req, res) => {
  try {
    const response = await api.delete(`/api/users/${req.params.id}`, { headers: apiHeaders(req) });
    return res.json(response.data);
  } catch (error) {
    return res.status(400).json(error.response?.data || { success: false, message: 'Delete failed' });
  }
});

app.get('/management/orders', isAdmin, async (req, res) => {
  try {
    const response = await api.get('/api/orders', {
      params: {
        page: req.query.page || 1,
        search: req.query.search || '',
        status: req.query.status || '',
        limit: 8
      },
      headers: apiHeaders(req)
    });

    const data = response.data;

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
      return res.json(data);
    }

    return res.render('management/orders/list_orders', {
      orders: data.orders || [],
      currentPage: data.currentPage || 1,
      totalPages: data.totalPages || 1,
      totalItems: data.totalItems || 0,
      limit: data.limit || 10,
      searchQuery: req.query.search || '',
      filterStatus: req.query.status || '',
      activePage: 'orders',
      userName: req.session.userName,
      userEmail: req.session.userEmail
    });
  } catch (error) {
    return res.status(500).send('Error loading orders');
  }
});

app.put('/management/orders/:id/status', isAdmin, async (req, res) => {
  try {
    const response = await api.put(`/api/orders/${req.params.id}/status`, req.body, { headers: apiHeaders(req) });
    return res.json(response.data);
  } catch (error) {
    return res.status(400).json(error.response?.data || { success: false, message: 'Status update failed' });
  }
});

app.get('/management/orders/:id', isAdmin, async (req, res) => {
  try {
    const response = await api.get(`/api/orders/${req.params.id}`, { headers: apiHeaders(req) });
    const data = response.data;

    return res.render('management/orders/order_detail', {
      order: data.order,
      itemsTotal: data.itemsTotal,
      grandTotal: data.grandTotal,
      activePage: 'orders',
      userName: req.session.userName,
      userEmail: req.session.userEmail
    });
  } catch (error) {
    return res.status(404).send('Order not found');
  }
});

app.get('/management/reports/sales_category', isAdmin, async (req, res) => {
  try {
    const response = await api.get('/api/reports/sales_category', { headers: apiHeaders(req) });
    const data = response.data;

    return res.render('management/reports/sales_category', {
      activePage: 'reports1',
      reportData: data.reportData || [],
      grandTotalQty: data.grandTotalQty || 0,
      grandTotalRevenue: data.grandTotalRevenue || 0,
      userName: req.session.userName,
      userEmail: req.session.userEmail
    });
  } catch (error) {
    return res.status(500).send('Error loading report');
  }
});

app.get('/management/reports/sales-by-category/:id', isAdmin, async (req, res) => {
  try {
    const response = await api.get(`/api/reports/sales-by-category/${req.params.id}`, { headers: apiHeaders(req) });
    const data = response.data;

    return res.render('management/reports/sales_category_detail', {
      activePage: 'reports1',
      categoryName: data.categoryName,
      reportData: data.reportData || [],
      grandTotalQty: data.grandTotalQty || 0,
      grandTotalRevenue: data.grandTotalRevenue || 0,
      userName: req.session.userName,
      userEmail: req.session.userEmail
    });
  } catch (error) {
    return res.status(500).send('Error loading detail report');
  }
});

app.get('/management/reports/inventory-status', isAdmin, async (req, res) => {
  try {
    const response = await api.get('/api/reports/inventory-status', { headers: apiHeaders(req) });
    const data = response.data;

    return res.render('management/reports/inventory_status', {
      activePage: 'reports2',
      reportData: data.reportData || [],
      categories: data.categories || [],
      totalBooks: data.totalBooks || 0,
      userName: req.session.userName,
      userEmail: req.session.userEmail
    });
  } catch (error) {
    return res.status(500).send('Error loading inventory report');
  }
});

app.get('/management/reports/sale-2', isAdmin, (req, res) => {
  return res.redirect('/management/reports/sales_category');
});

app.listen(PORT, () => {
  console.log(`C-BOOK FRONTEND running at http://localhost:${PORT}`);
});

