# E_Chat - Real-Time Secure Communication

A modern, secure real-time chat application built with FastAPI, Socket.IO, and Next.js.

## Features

- 🔐 Secure authentication with JWT
- 💬 Real-time messaging with Socket.IO
- 👥 Group chat support
- 📁 File sharing
- ✓✓ Read receipts
- ⌨️ Typing indicators
- 🌐 Online/offline status
- 📱 Responsive design (mobile & desktop)
- 🔄 Automatic reconnection
- 🎨 Modern UI with Tailwind CSS

## Tech Stack

**Backend:**
- FastAPI
- Socket.IO (python-socketio)
- SQLAlchemy (async)
- PostgreSQL / SQLite
- JWT Authentication

**Frontend:**
- Next.js 16
- React 19
- Socket.IO Client
- Zustand (state management)
- Tailwind CSS
- TypeScript

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (for production) or SQLite (for development)

### Backend Setup

1. **Clone the repository**
   ```bash
   cd /Users/marvinmvarghese/E_Chat
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run the backend**
   ```bash
   uvicorn backend.main:socket_app --reload --host 0.0.0.0 --port 8000
   ```

   Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the frontend**
   ```bash
   npm run dev
   ```

   Frontend will be available at `http://localhost:3000`

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=sqlite+aiosqlite:///./echat.db
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=43200
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=http://localhost:8000
```

## Deployment

### Deploy to Render

1. **Update render.yaml**
   - Set `FRONTEND_URL` to your deployed frontend URL
   - Ensure `SECRET_KEY` is generated securely

2. **Deploy backend**
   ```bash
   git push origin main
   ```
   Render will automatically deploy from your repository

3. **Deploy frontend**
   - Update `.env.local` with production backend URL
   - Deploy to Vercel, Netlify, or your preferred platform

4. **Update CORS**
   - After frontend deployment, update `FRONTEND_URL` in Render dashboard

## API Endpoints

### Authentication
- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login

### Chat
- `GET /chat/contacts` - Get contacts list
- `POST /chat/contacts` - Add contact
- `GET /chat/groups` - Get groups
- `POST /chat/groups` - Create group
- `POST /chat/groups/{id}/members` - Add group member
- `GET /chat/history/{id}` - Get chat history
- `POST /chat/upload` - Upload file

### Socket.IO Events

**Client → Server:**
- `send_message` - Send a message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `message_read` - Mark message as read

**Server → Client:**
- `connected` - Connection confirmed
- `new_message` - New message received
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `user_status` - User online/offline status
- `message_read` - Message read receipt

## Development

### Run Tests
```bash
pytest backend/tests.py -v
```

### Build for Production
```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm run build
npm start
```

## Troubleshooting

### WebSocket Connection Issues

1. **Check environment variables**
   - Ensure `NEXT_PUBLIC_WS_URL` points to correct backend
   - Verify `FRONTEND_URL` in backend matches frontend domain

2. **CORS errors**
   - Update `FRONTEND_URL` in backend environment
   - Check browser console for specific CORS errors

3. **Connection keeps disconnecting**
   - Check network connectivity
   - Verify backend is running and accessible
   - Check browser console for error messages

### Database Issues

1. **Migration errors**
   - Delete `echat.db` and restart backend (development only)
   - For production, ensure PostgreSQL is properly configured

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
