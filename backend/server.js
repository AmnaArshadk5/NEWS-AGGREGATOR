import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Middleware & Rate Limiters
import { globalLimiter, newsLimiter } from './middleware/rateLimiter.js';

// Import Routes
import authRoutes from './routes/auth.js';
import newsRoutes from './routes/news.js';
import bookmarksRoutes from './routes/bookmarks.js';
import adminRoutes from './routes/admin.js';
import categoriesRoutes from './routes/categories.js';
import imageProxyRoutes from './routes/imageProxy.js';
import readerRoutes from './routes/reader.js';

// Import Swagger UI & OpenAPI Specification
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './swagger.js';

// Load Environment Variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Apply Global Rate Limiter to all requests
app.use(globalLimiter);

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root API Welcome & Health Check Endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'The Daily Wire API Server is active and operational.',
    documentation: '/api-docs',
    categories: '/api/categories'
  });
});

app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    message: 'The Daily Wire REST API Root',
    documentation: '/api-docs'
  });
});

// API Routes (with rate limiting on news route)
app.use('/api/auth', authRoutes);
app.use('/api/news', newsLimiter, newsRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/proxy', imageProxyRoutes);
app.use('/api/reader', readerRoutes);

// Interactive Swagger API Documentation Endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`News Aggregator Backend listening on port ${PORT}`);
  console.log(`Swagger Interactive API Docs available at: http://localhost:${PORT}/api-docs`);
  console.log(`Rate Limiting: Active (5m Auth / 5m Session / 15m Global)`);
  console.log(`==================================================`);
});
