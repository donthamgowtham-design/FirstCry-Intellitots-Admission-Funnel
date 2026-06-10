const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
require('dotenv').config();

const leadsRouter       = require('./routes/leads');
const dashboardRouter   = require('./routes/dashboard');
const counsellorsRouter = require('./routes/counsellors');
const suggestionsRouter = require('./routes/suggestions');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET','POST','PATCH','DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use(morgan('dev'));

app.use('/api/leads',       leadsRouter);
app.use('/api/dashboard',   dashboardRouter);
app.use('/api/counsellors', counsellorsRouter);
app.use('/api/suggestions', suggestionsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status:'ok', time:new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success:false, error:'Route not found.' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success:false, error:'Unexpected error.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});