// Import body-parser
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
// Import Express
const express = require('express');
const app = express();
// Import apiRouter
const apiRouter = require('./server/api.js');
// App uses body-parser json
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());
// App uses apiRouter
app.use('/api', apiRouter);

// Set port
const PORT = process.env.PORT || 4000;
// Run Server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
// Export app
module.exports = app;
