'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Busines = require('../models/busines');

const business = module.context.collection('business');
const keySchema = joi.string().required()
.description('The key of the busines');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('busines');


router.get(function (req, res) {
  res.send(business.all());
}, 'list')
.response([Busines], 'A list of business.')
.summary('List all business')
.description(dd`
  Retrieves a list of all business.
`);


router.post(function (req, res) {
  const busines = req.body;
  let meta;
  try {
    meta = business.save(busines);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(busines, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: busines._key})
  ));
  res.send(busines);
}, 'create')
.body(Busines, 'The busines to create.')
.response(201, Busines, 'The created busines.')
.error(HTTP_CONFLICT, 'The busines already exists.')
.summary('Create a new busines')
.description(dd`
  Creates a new busines from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let busines
  try {
    busines = business.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(busines);
}, 'detail')
.pathParam('key', keySchema)
.response(Busines, 'The busines.')
.summary('Fetch a busines')
.description(dd`
  Retrieves a busines by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const busines = req.body;
  let meta;
  try {
    meta = business.replace(key, busines);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(busines, meta);
  res.send(busines);
}, 'replace')
.pathParam('key', keySchema)
.body(Busines, 'The data to replace the busines with.')
.response(Busines, 'The new busines.')
.summary('Replace a busines')
.description(dd`
  Replaces an existing busines with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let busines;
  try {
    business.update(key, patchData);
    busines = business.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(busines);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the busines with.'))
.response(Busines, 'The updated busines.')
.summary('Update a busines')
.description(dd`
  Patches a busines with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    business.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a busines')
.description(dd`
  Deletes a busines from the database.
`);
