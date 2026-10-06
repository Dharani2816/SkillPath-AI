function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.status) return res.status(err.status).json({ error: err.message, details: err.details });
  if (err.code === 'P2002') return res.status(409).json({ error: 'Record already exists', details: err.meta });
  if (err.code === 'P2025') return res.status(404).json({ error: 'Record not found' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
