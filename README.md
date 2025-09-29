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

## Deep-Link Query Parameters (QA Testing)

The progress table supports URL query parameters for testing specific states:

### URL Structure
```
/progress?student=<studentId>&course=<courseId>&open=<status1,status2>&q=<searchTerm>
```

### Parameters
- **`student`** (required): Student ID to display data for
- **`course`** (optional): Course ID to highlight and auto-expand
- **`open`** (optional): Comma-separated list of status groups to expand
  - Valid values: `Missing`, `Submitted (Late)`, `Submitted`, `Graded`
  - Example: `?open=Missing,Submitted`
- **`q`** (optional): Search term to filter assignments

### Examples
```
# Basic student view
/progress?student=12345

# Auto-expand specific course and status groups
/progress?student=12345&course=67890&open=Missing,Submitted

# Search for specific assignments
/progress?student=12345&q=homework

# Full state with all parameters
/progress?student=12345&course=67890&open=Missing,Submitted&q=algebra
```

### Testing Scenarios
- **Empty states**: Use student with no assignments
- **Vector filtering**: Use student with Vector assignments (should be hidden)
- **All statuses**: Use student with assignments in all four status groups
- **Large datasets**: Use student with 1000+ assignments for performance testing
- Loading states and user feedback
- CORS enabled for cross-origin requests
