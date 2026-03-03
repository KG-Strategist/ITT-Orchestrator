import express from 'express';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-change-in-production';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // 1. Login Endpoint (itt_identity)
  app.post('/api/v1/auth/login', (req, res) => {
    const { username, password } = req.body;

    try {
      // Read file-based DB
      let users = [];
      const usersPath = path.join(__dirname, 'users.json');
      if (fs.existsSync(usersPath)) {
        const usersData = fs.readFileSync(usersPath, 'utf-8');
        users = JSON.parse(usersData);
      } else {
        // Fallback for development/demo if users.json is missing
        users = [
          {
            username: "admin",
            password: "password",
            role: "CoE_Super_Admin",
            id: "usr_001",
            name: "System Administrator"
          }
        ];
      }

      const user = users.find((u: any) => u.username === username && u.password === password);

      if (user) {
        // Generate JWT
        const token = jwt.sign(
          { 
            username: user.username, 
            role: user.role,
            id: user.id,
            name: user.name
          }, 
          JWT_SECRET, 
          { expiresIn: '1h' }
        );
        
        res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Error reading users DB:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 2. Middleware for Token-Based Session Security (itt_api)
  const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });
      (req as any).user = user;
      next();
    });
  };

  // 3. Protected Routes Example
  app.get('/api/v1/zones', authenticateToken, (req, res) => {
    // Mock data for zones
    res.json([
      { id: 'z1', name: 'Zone 1 (Fortress)', status: 'active' },
      { id: 'z2', name: 'Zone 2 (CoreGuard)', status: 'active' },
      { id: 'z3', name: 'Zone 3 (Edge)', status: 'active' },
      { id: 'z4', name: 'Zone 4 (Agentic GW)', status: 'active' }
    ]);
  });

  app.get('/api/v1/registry', authenticateToken, (req, res) => {
    res.json({ status: 'ok', message: 'Registry data' });
  });

  app.get('/api/v1/auth/me', authenticateToken, (req, res) => {
    res.json({ user: (req as any).user });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // --- WebSocket Server for Agent Socket ---
  const { WebSocketServer } = await import('ws');
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.action === 'start_simulation') {
          // Simulate some logs
          let step = 0;
          const interval = setInterval(() => {
            step++;
            if (step <= 5) {
              ws.send(JSON.stringify({ type: 'log', message: `Simulation step ${step}...`, color: 'text-cyan-400' }));
            } else {
              ws.send(JSON.stringify({ type: 'status', status: 'complete' }));
              clearInterval(interval);
            }
          }, 1000);
        }
      } catch (e) {
        console.error('Failed to process WebSocket message', e);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

    if (pathname === '/v1/agent-socket') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });
}

startServer();
