const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Internal API endpoint for getStudentData
app.get('/api/getStudentData', (req, res) => {
    const studentData = {
        message: "Hi, Mom!!!!!!!",
        timestamp: new Date().toISOString(),
        status: "success"
    };
    
    res.json(studentData);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Internal API endpoint: http://localhost:${PORT}/api/getStudentData`);
});
