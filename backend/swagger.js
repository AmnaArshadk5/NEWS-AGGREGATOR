export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'The Daily Wire - News Aggregator API',
    version: '1.0.0',
    description: `
Interactive REST API documentation for **The Daily Wire** backend server.

### Features:
- 🔐 **Authentication & Session**: Register, Login, JWT verification, Password reset.
- 📰 **News Engine**: Multi-tier API aggregation (NewsAPI, GNews, NewsData.io) with 30-min cache, country & year filtering.
- 📁 **Categories**: Public categories & admin management.
- 🔖 **Bookmarks**: User bookmark synchronization.
- 📖 **Reader Extraction**: Server-side article extractor for clean Reader View.
- 🖼️ **Image Proxy**: High-performance CORS proxy for third-party article images.
- 🛡️ **Admin Panel**: User role management & category controls.

### Authentication:
Click the **Authorize** button at the top right and enter your JWT token as: \`Bearer <your_token>\`
`,
  },
  servers: [
    {
      url: '/',
      description: 'Current Server Environment (Auto-Detect)',
    },
    {
      url: 'https://news-aggregator-ac9t.onrender.com',
      description: 'Live Production Server (Render Cloud)',
    },
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from `/api/auth/login` or `/api/auth/register`',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'john_doe' },
          role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          created_at: { type: 'string', format: 'date-time', example: '2026-08-04T10:00:00.000Z' },
        },
      },
      Article: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Tech Giants Announce Next-Gen AI Framework' },
          description: { type: 'string', example: 'A comprehensive overview of recent advancements in artificial intelligence...' },
          url: { type: 'string', example: 'https://example.com/news/tech-ai-2026' },
          urlToImage: { type: 'string', example: 'http://localhost:5000/api/proxy/image?url=https%3A%2F%2Fexample.com%2Fimg.jpg' },
          publishedAt: { type: 'string', example: '2026-08-04T08:30:00Z' },
          source: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'TechCrunch' },
            },
          },
          author: { type: 'string', example: 'Sarah Jenkins' },
        },
      },
      Bookmark: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          user_id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Tech Giants Announce Next-Gen AI Framework' },
          description: { type: 'string', example: 'Summary text...' },
          url: { type: 'string', example: 'https://example.com/news/tech-ai-2026' },
          url_to_image: { type: 'string', example: 'http://localhost:5000/api/proxy/image?url=...' },
          published_at: { type: 'string', example: '2026-08-04T08:30:00Z' },
          source_name: { type: 'string', example: 'TechCrunch' },
          author: { type: 'string', example: 'Sarah Jenkins' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Technology' },
          slug: { type: 'string', example: 'technology' },
          enabled: { type: 'integer', example: 1 },
          sort_order: { type: 'integer', example: 2 },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Error description message' },
        },
      },
    },
  },
  paths: {
    // ── AUTHENTICATION ──
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user account',
        description: 'Creates a new user profile. The first registered user automatically gets `admin` privileges.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'john_doe', minLength: 3 },
                  password: { type: 'string', example: 'secret123', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'User registered successfully' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { description: 'Missing or invalid parameters', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          409: { description: 'Username is already taken', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login user & retrieve JWT token',
        description: 'Authenticates credentials and returns a 7-day valid JWT access token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'john_doe' },
                  password: { type: 'string', example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Login successful' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'User details retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized / Token expired' },
        },
      },
    },
    '/api/auth/change-password': {
      put: {
        tags: ['Authentication'],
        summary: 'Change current user password',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'secret123' },
                  newPassword: { type: 'string', example: 'new_secret_456' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated successfully' },
          400: { description: 'Invalid current password or short new password' },
        },
      },
    },

    // ── NEWS ENGINE ──
    '/api/news': {
      get: {
        tags: ['News'],
        summary: 'Fetch news headlines with filters',
        description: 'Queries NewsData.io (fallback to NewsAPI/GNews/Mock) with 30-min per-query server caching.',
        parameters: [
          { name: 'category', in: 'query', description: 'News category slug', schema: { type: 'string', default: 'general', example: 'technology' } },
          { name: 'q', in: 'query', description: 'Search keyword', schema: { type: 'string', example: 'artificial intelligence' } },
          { name: 'sortBy', in: 'query', description: 'Sort order', schema: { type: 'string', enum: ['newest', 'oldest'], default: 'newest' } },
          { name: 'year', in: 'query', description: 'Filter by publication year', schema: { type: 'string', example: '2026' } },
          { name: 'timeframe', in: 'query', description: 'Time range filter', schema: { type: 'string', enum: ['all', '24h', 'week', 'month'], default: 'all' } },
          { name: 'country', in: 'query', description: '2-letter ISO country code', schema: { type: 'string', example: 'us' } },
        ],
        responses: {
          200: {
            description: 'Array of normalized articles',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Article' },
                },
              },
            },
          },
        },
      },
    },

    // ── CATEGORIES ──
    '/api/categories': {
      get: {
        tags: ['Categories'],
        summary: 'Get active news categories',
        responses: {
          200: {
            description: 'List of enabled categories sorted by sort_order',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Category' },
                },
              },
            },
          },
        },
      },
    },

    // ── BOOKMARKS ──
    '/api/bookmarks': {
      get: {
        tags: ['Bookmarks'],
        summary: 'Get all saved bookmarks for logged-in user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of saved bookmarks',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Bookmark' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Bookmarks'],
        summary: 'Toggle / Save a bookmark',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url', 'title'],
                properties: {
                  title: { type: 'string', example: 'AI Breakthough' },
                  description: { type: 'string', example: 'Article description...' },
                  url: { type: 'string', example: 'https://example.com/article/1' },
                  urlToImage: { type: 'string', example: 'https://example.com/img.jpg' },
                  publishedAt: { type: 'string', example: '2026-08-04T10:00:00Z' },
                  source: { type: 'object', properties: { name: { type: 'string', example: 'Reuters' } } },
                  author: { type: 'string', example: 'Jane Doe' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Bookmark created' },
          200: { description: 'Bookmark removed (untoggled)' },
        },
      },
    },
    '/api/bookmarks/{id}': {
      delete: {
        tags: ['Bookmarks'],
        summary: 'Remove a bookmark by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Bookmark removed' },
        },
      },
    },

    // ── READER & PROXY ──
    '/api/reader': {
      get: {
        tags: ['Reader & Proxy'],
        summary: 'Extract full article HTML for Reader View',
        parameters: [
          { name: 'url', in: 'query', required: true, description: 'Encoded target article URL', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Extracted article document with proxied HTML content',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    author: { type: 'string' },
                    published: { type: 'string' },
                    description: { type: 'string' },
                    image: { type: 'string' },
                    content: { type: 'string', description: 'Extracted HTML string' },
                    source: { type: 'string' },
                    url: { type: 'string' },
                    isFallback: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/proxy/image': {
      get: {
        tags: ['Reader & Proxy'],
        summary: 'CORS image proxy',
        description: 'Bypasses third-party CORS restrictions on news images with 30-min buffer caching and 302 fallback redirects.',
        parameters: [
          { name: 'url', in: 'query', required: true, description: 'Encoded image URL', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Binary image buffer' },
          302: { description: 'Redirect to clean fallback image on error/timeout' },
        },
      },
    },

    // ── ADMIN PANEL ──
    '/api/admin/users': {
      get: {
        tags: ['Admin Panel'],
        summary: 'List all registered users',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Array of registered users',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } },
          },
          403: { description: 'Admin access required' },
        },
      },
    },
    '/api/admin/users/{id}': {
      delete: {
        tags: ['Admin Panel'],
        summary: 'Delete a user account',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'User deleted' }, 403: { description: 'Admin access required' } },
      },
    },
    '/api/admin/users/{id}/role': {
      put: {
        tags: ['Admin Panel'],
        summary: 'Update user role (user/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['user', 'admin'] } } },
            },
          },
        },
        responses: { 200: { description: 'Role updated' } },
      },
    },
    '/api/admin/categories': {
      get: {
        tags: ['Admin Panel'],
        summary: 'Get all categories (enabled & disabled)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Array of categories' } },
      },
      post: {
        tags: ['Admin Panel'],
        summary: 'Create a new category',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['name', 'slug'], properties: { name: { type: 'string' }, slug: { type: 'string' }, sort_order: { type: 'integer' } } },
            },
          },
        },
        responses: { 201: { description: 'Category created' } },
      },
    },
    '/api/admin/categories/{id}': {
      put: {
        tags: ['Admin Panel'],
        summary: 'Update category details / enabled status',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { name: { type: 'string' }, slug: { type: 'string' }, enabled: { type: 'integer' }, sort_order: { type: 'integer' } } },
            },
          },
        },
        responses: { 200: { description: 'Category updated' } },
      },
      delete: {
        tags: ['Admin Panel'],
        summary: 'Delete a category',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Category deleted' } },
      },
    },
  },
};
