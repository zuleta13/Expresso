// Import express
const express = require('express');
// Create employeeRouter
const employeesRouter = express.Router();
// Define timesheetsRouter
const timesheetsRouter = require('./timesheets.js');
// Import sqlite3
const sqlite3 = require('sqlite3');
// Create db constant and assign it TEST_DATABASE or databse.sqlite
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
// Define helper middleware
function checkEmployeeInfo(req, res, next) {
  const employeeRequest = req.body.employee;
  // tenemos que revisar que estén todos los campos y que la información en
  // cada uno sea válida:
  // recibo: name, position y wage.
  // si algo no está bien, envío un código 400 en la respuesta
  // si todo está bien, asigno la información en una nueva propiedad, employee, en
  // req y paso al siguiente middleware
  const newEmployee = employeeRequest.name && employeeRequest.position && employeeRequest.wage && employeeRequest;
  if(!newEmployee) {
      res.status(400).send(`Some information field from new employee request does not exist.`);
  } else {
    req.newEmployee = newEmployee;
    next();
  }
}
// Define routers' methods functionality
employeesRouter.param('employeeId', (req, res, next, id) => {
  // Check if there's an employee with that id in the database
  // if there's a database error, throw it
  // else, if there's no employee with that id, send a 404 status code in the response.
  // else if employee exists, assign a new property, employee, to request and save that
  // employee's info there and go to the next middleware.
  const employeeId = Number(id);
  const query = `SELECT * FROM Employee WHERE id = ${id}`;
  db.get(
    query,
    (error, employee) => {
      if(error) {
        throw error;
      } else if(employee === undefined) {
        res.status(404).send(`There's no employee with id ${employeeId}.`);
      } else {
        req.employee = employee;
        next();
      }
    }
  );
});

employeesRouter.get('/', (req, res, next) => {
  const response = {};
  const query = `SELECT * FROM Employee WHERE is_current_employee = 1`;

  db.all(
    query,
    (error, employees) => {
      if(error) {
        throw error;
      } else {
        response.body = {employees: employees};
        res.send(response.body);
      }
    }
  );
});

employeesRouter.get('/:employeeId', (req, res, next) => {
  // if we get here, it means we got an employee and it's info is saved in req.employee
  // now we have to send back that info in the correct fashion
  const response = {};
  response.body = {employee: req.employee};
  res.send(response.body);
});

employeesRouter.post('/', checkEmployeeInfo, (req, res, next) => {
  // employee response has to have these properties:
  // id, name, position, wage and is_current_employee.
  // db assigns id for new employees
  const response = {};
  const query = `
    INSERT INTO Employee (name, position, wage, is_current_employee)
    VALUES ($name, $position, $wage, $isCurrentEmployee)`;
  const values = {
    $name: req.newEmployee.name,
    $position: req.newEmployee.position,
    $wage: req.newEmployee.wage,
    $isCurrentEmployee: 1
  };
  // Employee info insertion
  db.run(query, values,
    function (error) {
      if(error) {
        throw error;
      } else {
        // Retrieve info from lastID in db to send response
        const query = `SELECT * FROM Employee WHERE id = ${this.lastID}`;
        db.get(query,
          (error, employee) => {
            if(error) {
              throw error;
            } else if(employee === undefined) {
              res.status(404).send();
            } else {
              response.body = {employee: employee};
              res.status(201).send(response.body);
            }
          }
        );
      }
    }
  );
});

employeesRouter.put('/:employeeId', checkEmployeeInfo, (req, res, next) => {
  const response = {};
  const employeeId = req.employee.id;
  const updateEmployee = req.newEmployee;

  const sql = `
    UPDATE Employee
    SET name = '${updateEmployee.name}', position = '${updateEmployee.position}', wage = '${updateEmployee.wage}'
    WHERE id = ${employeeId}`;
  // Updated info instertion and retrieve info from db to send response
  db.run(sql,
    function (error) {
      if(error) {
        throw error;
      } else {
        const query = `SELECT * FROM Employee WHERE id = ${employeeId}`;
        db.get(query,
          (error, employee) => {
            if(error) {
              throw error;
            } else {
              response.body = {employee: employee};
              res.send(response.body);
            }
          }
        );
      }
    }
  );
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
  const employeeId = req.employee.id;
  // tengo que actualizar en la db el estado de is_current_employee
  const sql = `UPDATE Employee SET is_current_employee = 0 WHERE id = ${employeeId}`;
  db.run(
    sql,
    error => {
      if(error) {
        throw error;
      } else {
        const query = `SELECT * FROM Employee WHERE id = ${employeeId}`;
        db.get(
          query,
          (error, employee) => {
            const response = {};
            response.body = {employee: employee};
            res.send(response.body);
          }
        );
      }
    }
  );
  // recuperar los datos del empleado en la db y enviarlos en la respuesta
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);
// Export employeeRouter
module.exports = employeesRouter;
