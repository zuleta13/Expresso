// Import Express and define menusRouter
const express = require('express');
const menusRouter = express.Router();
// Import sqlite3 and set db
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
// Import menuItemsRouter
const menuItemsRouter = require('./menu-items.js');

// Helper middleware
function checkMenu(req, res, next) {
  const requestMenu = req.body.menu;
  const newMenu = requestMenu.title && requestMenu;

  if(!newMenu) {
    res.status(400).send();
  } else {
    req.newMenu = newMenu;
    next();
  }
}

menusRouter.param('menuId', (req, res, next, id) => {
  const menuId = Number(id);
  db.get(
    `SELECT * FROM Menu WHERE id = $id`,
    {$id: menuId},
    (error, menu) => {
      if(error) {
        throw error;
      } else if(menu === undefined) {
        res.status(404).send();
      } else {
        req.menu = menu;
        next();
      }
    }
  );
});
// Routes
menusRouter.get('/', (req, res, next) => {
  // tengo que devolver todos los menus que hay en la db
  db.all(
    `SELECT * FROM Menu`,
    (error, menus) => {
      if(error) {
        throw error;
      }  else {
        const response = {};
        response.body = {menus: menus};
        res.send(response.body);
      }
    }
  );
});

menusRouter.get('/:menuId', (req, res, next) => {

  const response = {};
  response.body = {menu: req.menu};
  res.send(response.body);
});

menusRouter.post('/', checkMenu, (req, res, next) => {
  // si he llegado hasta aquí significa que newMenu es válido
  // lo introduzco en la db
  // recupero la info desde la db y la preparo para enviarla con la respuesta
  const sql = `INSERT INTO Menu (title) VALUES ($title)`;
  const values = {$title: req.newMenu.title};
  db.run(
    sql,
    values,
    function(error) {
      if(error) {
        throw error;
      } else {
        db.get(
          `SELECT * FROM Menu WHERE id = $id`,
          {$id: this.lastID},
          (error, menu) => {
            const response = {};
            response.body = {menu: menu};
            res.status(201).send(response.body);
          }
        );
      }
    }
  );
});

menusRouter.put('/:menuId', checkMenu, (req, res, next) => {
  // tengo que actualizar el menu
  // si llego hasta aquí, tengo req.newMenu y tengo req.menu
  db.run(
    `UPDATE Menu SET title = $title WHERE id = $id`,
    {$title: req.newMenu.title, $id: req.menu.id},
    error => {
      if(error) {
        throw error;
      } else {
        db.get(
          `SELECT * FROM Menu WHERE id = $id`,
          {$id: req.menu.id},
          (error, menu) => {
            const response = {};
            response.body = {menu: menu};
            res.send(response.body);
          }
        );
      }
    }
  );
});

menusRouter.delete('/:menuId', (req, res, next) => {

  const query = `SELECT * FROM MenuItem WHERE menu_id = $id;`;
  const values = {$id: req.menu.id};

  db.get(
    query,
    values,
    (error, menu) => {
      if(error) {
        throw error;
      } else if (menu === undefined) {
        db.run(
          `DELETE FROM Menu WHERE id = $id`,
          {$id: req.menu.id},
          error => {
            if(error) {
              throw error;
            } else {
              res.status(204).send();
            }
          }
        );
      } else {
        res.status(400).send();
      }
    }
  );
});

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

// Export menusRouter
module.exports = menusRouter;
