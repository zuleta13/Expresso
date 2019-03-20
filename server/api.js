// Import Express
const express = require('express');
// Define apiRouter
const apiRouter = express.Router();
// Import employees.js, menus.js
const employeesRouter = require('./employees.js');
const menusRouter = require('./menus.js');
// apiRouter uses imported routers for its different routers
apiRouter.use('/employees', employeesRouter);
apiRouter.use('/menus', menusRouter);
// Export apiRouter
module.exports = apiRouter;
