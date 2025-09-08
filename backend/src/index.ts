import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Health check endpoint for testing server status
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'CityPulse API is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 CityPulse API server running on port ${PORT}`);
});
