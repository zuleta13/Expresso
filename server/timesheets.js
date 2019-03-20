// Import express
const express = require('express');
// Create timesheetsRouter
const timesheetsRouter = express.Router({mergeParams: true});
// Import sqlite3
const sqlite3 = require('sqlite3');
// Create db constant and assign it TEST_DATABASE or databse.sqlite
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Define helper middleware
function checkTimesheet(req, res, next) {

  const requestTimesheet = req.body.timesheet;
  const newTimesheet = requestTimesheet.hours && requestTimesheet.rate && requestTimesheet.date && requestTimesheet;
  if(!newTimesheet) {
    res.status(400).send();
  } else {
    req.newTimesheet = requestTimesheet;
    next();
  }
}

timesheetsRouter.param('timesheetId', (req, res, next, id) => {
  const timesheetId = Number(id);
  db.get(
    `SELECT * FROM Timesheet WHERE id = $id`,
    {
      $id: timesheetId
    },
    (error, timesheet) => {
      if(error) {
        throw error;
      } else if(timesheet === undefined) {
        res.status(404).send();
      } else {
        req.timesheet = timesheet;
        next();
      }
    }
  );
});

// Define routers' methods functionality
timesheetsRouter.get('/', (req, res, next) => {

  const employeeId = req.employee.id;
  const query = `SELECT * FROM Timesheet WHERE employee_id = ${employeeId}`;
  db.all(
    query,
    (error, timesheets) => {
      if(error) {
        throw error;
      } else {
        const response = {};
        response.body = {timesheets: timesheets};
        res.send(response.body);
      }
    }
  );
});

timesheetsRouter.post('/', checkTimesheet, (req, res, next) => {

  const sql = `INSERT INTO Timesheet (hours, rate, date, employee_id)
  VALUES ($hours, $rate, $date, $employeeId)`;
  const values = {
    $hours: req.newTimesheet.hours,
    $rate: req.newTimesheet.rate,
    $date: req.newTimesheet.date,
    $employeeId: req.employee.id
  };
  db.run(
    sql,
    values,
    function (error) {
      if(error) {
        throw error;
      } else {
        db.get(
          `SELECT * FROM Timesheet WHERE id = ${this.lastID}`,
          (error, timesheet) => {
            if(error) {
              throw error;
            } else {
              const response = {};
              response.body = {timesheet: timesheet};
              res.status(201).send(response.body);
            }
          }
        );
      }
    }
  );
});

timesheetsRouter.put('/:timesheetId', checkTimesheet, (req, res, next) => {
  const response = {};
  const sql = `
    UPDATE Timesheet
    SET hours = $hours, rate = $rate, date = $date
    WHERE id = $id AND employee_id = $employeeId`;
  const values = {
    $hours: req.newTimesheet.hours,
    $rate: req.newTimesheet.rate,
    $date: req.newTimesheet.date,
    $id: req.timesheet.id,
    $employeeId: req.employee.id
  };
  db.run(
    sql,
    values,
    function (error) {
      if(error) {
        throw error;
      } else {
        db.get(
          `SELECT * FROM Timesheet WHERE employee_id = $employeeId AND id = $id`,
          {
            $employeeId: req.employee.id,
            $id: req.timesheet.id
          },
          (error, timesheet) => {
            response.body = {timesheet: timesheet};
            res.send(response.body);
          }
        );
      }
    }
  );
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = `DELETE FROM Timesheet WHERE id = $id`;
  const values = {
    $id: req.params.timesheetId
  };
  db.run(
    sql,
    values,
    error => {
      if(error) {
        throw error;
      } else {
        res.status(204).send();
      }
    }
  );
});

// Export employeeRouter
module.exports = timesheetsRouter;
