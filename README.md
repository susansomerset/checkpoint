# Checkpoint - Canvas API Integration

Phase 1: Student Data Viewer

## Setup

1. Install dependencies:
```bash
npm install
```

## Running the Application

### Option 1: Run both servers separately

**Terminal 1 - Start the API server (port 3001):**
```bash
npm start
```

**Terminal 2 - Start the client server (port 3000):**
```bash
npm run client
```

### Option 2: Development mode with auto-restart

**Terminal 1 - API server with nodemon:**
```bash
npm run dev
```

**Terminal 2 - Client server with nodemon:**
```bash
npm run dev:client
```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Click the "Fetch Student Data" button
3. View the JSON response from the internal API

## Architecture

- **Client Server**: Port 3000 - Serves the HTML interface
- **API Server**: Port 3001 - Internal API with `getStudentData()` endpoint
- **API Endpoint**: `GET http://localhost:3001/api/getStudentData`

## Current Features

- JSON viewer with formatted display
- Error handling for API calls
- Loading states and user feedback
- CORS enabled for cross-origin requests
