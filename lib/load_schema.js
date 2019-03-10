'use strict';

const fs = require('fs');
const path = require('path');
const {
  makeExecutableSchema,
} = require('graphql-tools');
const _ = require('lodash');

const SYMBOL_SCHEMA = Symbol('Applicaton#schema');

module.exports = app => {
  const basePath = path.join(app.baseDir, 'app/graphql');
  const types = fs.readdirSync(basePath);

  const schemas = [];
  const resolverMap = {};
  const resolverFactories = [];
  const directiveMap = {};
  const schemaDirectivesProps = {};

  types.forEach(type => {
    // Load schema
    const schemaFile = path.join(basePath, type, 'schema.graphql');
    /* istanbul ignore else */
    if (fs.existsSync(schemaFile)) {
      const schema = fs.readFileSync(schemaFile, {
        encoding: 'utf8',
      });
      schemas.push(schema);
    }

    // Load resolver
    let resolverFile = path.join(basePath, type, "resolver.ts");
    if (fs.existsSync(resolverFile)) {
      resolverFile = require(resolverFile);
      if (_.isFunction(resolverFile)) {
        resolverFactories.push(resolverFile);
      } else if (_.isObject(resolverFile)) {
        _.merge(resolverMap, resolverFile);
      }
    } else {
      resolverFile = path.join(basePath, type, "resolver.js");
      if (fs.existsSync(resolverFile)) {
        resolverFile = require(resolverFile);
        if (_.isFunction(resolverFile)) {
          resolverFactories.push(resolverFile);
        } else if (_.isObject(resolverFile)) {
          _.merge(resolverMap, resolverFile);
        }
      }
    }

    // Load directive resolver
    let directiveFile = path.join(basePath, type, "directive.ts");
    if (fs.existsSync(directiveFile)) {
      directiveFile = require(directiveFile);
      _.merge(directiveMap, directiveFile);
    } else {
      directiveFile = path.join(basePath, type, "directive.js");
      if (fs.existsSync(directiveFile)) {
        directiveFile = require(directiveFile);
        _.merge(directiveMap, directiveFile);
      }
    }

    // Load schemaDirectives
    let schemaDirectivesFile = path.join(basePath, type, "schemaDirective.ts");
    if (fs.existsSync(schemaDirectivesFile)) {
      schemaDirectivesFile = require(schemaDirectivesFile);
      _.merge(schemaDirectivesProps, schemaDirectivesFile);
    } else {
      schemaDirectivesFile = path.join(basePath, type, "schemaDirective.js");
      if (fs.existsSync(schemaDirectivesFile)) {
        schemaDirectivesFile = require(schemaDirectivesFile);
        _.merge(schemaDirectivesProps, schemaDirectivesFile);
      }
    }
  });

  Object.defineProperty(app, 'schema', {
    get() {
      if (!this[SYMBOL_SCHEMA]) {
        resolverFactories.forEach(resolverFactory => _.merge(resolverMap, resolverFactory(app)));

        this[SYMBOL_SCHEMA] = makeExecutableSchema({
          typeDefs: schemas,
          resolvers: resolverMap,
          directiveResolvers: directiveMap,
          schemaDirectives: schemaDirectivesProps,
        });
      }
      return this[SYMBOL_SCHEMA];
    },
  });
};
