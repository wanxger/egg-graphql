'use strict';

const fs = require('fs');
const path = require('path');

const SYMBOL_CONNECTOR_CLASS = Symbol('Application#connectorClass');

module.exports = app => {
  const basePath = path.join(app.baseDir, 'app/graphql');
  const types = fs.readdirSync(basePath);

  Object.defineProperty(app, 'connectorClass', {
    get() {
      if (!this[SYMBOL_CONNECTOR_CLASS]) {
        const classes = new Map();

        types.forEach(type => {
          let connectorFile = path.join(basePath, type, "connector.ts");
          if (fs.existsSync(connectorFile)) {
            connectorFile = require(connectorFile);
            classes.set(type, connectorFile);
          } else {
            connectorFile = path.join(basePath, type, "connector.js");
            if (fs.existsSync(connectorFile)) {
              connectorFile = require(connectorFile);
              classes.set(type, connectorFile);
            }
          }
        });

        this[SYMBOL_CONNECTOR_CLASS] = classes;
      }
      return this[SYMBOL_CONNECTOR_CLASS];
    },
  });
};
