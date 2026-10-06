const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/error');
const llm = require('./services/ai/llmProvider');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', aiProvider: llm.providerName() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/assessment', require('./routes/assessment'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/careers', require('./routes/careers'));
app.use('/api/outcomes', require('./routes/outcomes'));
app.use('/api/family', require('./routes/family'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/counsellor', require('./routes/counsellor'));
app.use('/api/admin', require('./routes/admin'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
