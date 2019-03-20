// Import Express and define menuItemsRouter
const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});
// Import sqlite3 and database
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Define helper middleware
function checkMenuItem(req, res, next) {
  const requestMenuItem = req.body.menuItem;
  const newMenuItem = requestMenuItem.name && requestMenuItem.description &&
  requestMenuItem.inventory && requestMenuItem.price && requestMenuItem;

  if(!newMenuItem) {
    res.status(400).send();
  } else {
    req.newMenuItem = newMenuItem;
    next();
  }
}

menuItemsRouter.param('menuItemId', (req, res, next, id) => {
  const menuItemId = Number(id);
  db.get(
    `SELECT * FROM MenuItem WHERE id = $id`,
    {
      $id: menuItemId,
    },
    (error, menuItem) => {
      if(error) {
        throw error;
      } else if(menuItem === undefined){
        res.status(404).send();
      } else {
        req.menuItem = menuItem;
        next();
      }
    }
  );
});
// Define Routes
menuItemsRouter.get('/', (req, res, next) => {
  db.all(
    `SELECT * FROM MenuItem WHERE menu_id = $id`,
    {$id: req.menu.id},
    (error, menuItems) => {
      if(error) {
        throw error;
      } else {
        const response = {};
        response.body = {menuItems: menuItems};
        res.send(response.body);
      }
    }
  );
});

menuItemsRouter.post('/', checkMenuItem, (req, res, next) => {
  // si estamos aquí es porque la info era correcta
  // creamos la entrada en la db
  const sql = `INSERT INTO MenuItem (name, description, inventory, price, menu_id)
  VALUES ($name, $description, $inventory, $price, $menuId)`;
  const values = {
    $name: req.newMenuItem.name,
    $description: req.newMenuItem.description,
    $inventory: req.newMenuItem.inventory,
    $price: req.newMenuItem.price,
    $menuId: req.menu.id
  };
  db.run(
    sql,
    values,
    function (error) {
      if(error) {
        throw error;
      } else {
        db.get(
          `SELECT * FROM MenuItem WHERE id = $id`,
          {$id: this.lastID},
          (error, menuItem) => {
            const response = {};
            response.body = {menuItem: menuItem};
            res.status(201).send(response.body);
          }
        );
      }
    }
  );
});

menuItemsRouter.put('/:menuItemId', checkMenuItem, (req, res, next) => {
  const sql = `UPDATE MenuItem SET name = $name, description = $description,
  inventory = $inventory, price = $price
  WHERE id = $id`;
  const values = {
    $name: req.newMenuItem.name,
    $description: req.newMenuItem.description,
    $inventory: req.newMenuItem.inventory,
    $price: req.newMenuItem.price,
    $id: req.menuItem.id
  };
  db.run(
    sql, values,
    error => {
      if(error) {
        throw error;
      } else {
        db.get(
          `SELECT * FROM MenuItem WHERE id = $id`,
          {$id: req.menuItem.id},
          (error, menuItem) => {
            const response = {};
            response.body = {menuItem: menuItem};
            res.send(response.body);
          }
        );
      }
    }
  );
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  db.run(
    `DELETE FROM MenuItem WHERE id = $id`,
    {$id: req.menuItem.id},
    error => {
      if(error) {
        throw error;
      } else {
      res.status(204).send();
      }
    }
  );
});

// Export menuItemsRouter
module.exports = menuItemsRouter;
