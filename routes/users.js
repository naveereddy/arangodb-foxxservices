'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const createAuth = require('@arangodb/foxx/auth');
const sessionMiddleware = require('@arangodb/foxx/sessions');
const cookieTransport = require('@arangodb/foxx/sessions/transports/cookie');
const collectionStorage = require('@arangodb/foxx/sessions/storages/collection');
const User = require('../models/user');

const users = module.context.collection('users');
const auths = module.context.collection('auths');
const keySchema = joi.string().required()
    .description('The key of the users');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');
const db = require('@arangodb').db;

const sessions = sessionMiddleware({
    storage: collectionStorage({
        collection: module.context.collection('sessions'),
        ttl: 60 * 2,
        pruneExpired: true
    }),
    transport: cookieTransport({
        name: 'FOXXSESSID',
        ttl: 60 * 5, // one week in seconds
        algorithm: 'sha256',
        secret: 'mobigesture'
    })
});
module.context.use(sessions);

const auth = createAuth();
const router = createRouter();
module.exports = router;


router.tag('user');

router.post('signup', function(req, res) {
        const user = req.body;
        let meta;
        try {
            const pass = user.password;
            delete user.password;
            user.password = auth.create(pass);
            meta = users.save(user);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        Object.assign(user, meta);
        res.status(201);
        res.send(user);
    }, 'create')
    .body(joi.object().description('The user to create.'))
    .response(201, User, 'The created user.')
    .error(HTTP_CONFLICT, 'The user already exists.')
    .summary('Create a new user')
    .description(dd `
  Creates a new user from the request body and
  returns the saved document.
`);

router.post('login', function(req, res) {
        const body = req.body;
        let data;
        try {
            data = users.firstExample({
                email: body.email,
            });
            const valid = auth.verify(
                data ? data.password : {},
                body.password
            );
            if (valid) {
                delete body.password;
                delete data.password;
                const datetime = new Date();
                body.created = datetime;
                body.token = body.token;
                const meta = auths.save(body);
                data.auth_key = meta._key;
                // sessions creation 
                req.session.uid = data._key;
                req.sessionStorage.save(req.session);
                res.send({ sucess: true });
                res.status(200);
                res.send(data);
            } else {
                res.status(200);
                res.send({ "message": "Username and password doesn't exists." });
            }
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
    }, 'create').body(joi.object().description('The user to auth.'))
    .response(201, User, 'The created auth.')
    .error(HTTP_CONFLICT, 'The user already exists.')
    .summary('Create a new auth')
    .description(dd `
    Creates a session object and search the user in user tabel.
`);

router.put(':key', function(req, res) {
        const key = req.pathParams.key;
        const user = req.body;
        let meta;
        try {
            meta = users.replace(key, user);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        Object.assign(user, meta);
        res.send(user);
    }, 'replace')
    .pathParam('key', keySchema)
    .body(User, 'The data to replace the user with.')
    .response(User, 'The new user.')
    .summary('Replace a user')
    .description(dd `
  Replaces an existing user with the request body and
  returns the new document.
`);


router.patch(':key', function(req, res) {
        const key = req.pathParams.key;
        const patchData = req.body;
        let user;
        try {
            users.update(key, patchData);
            user = users.document(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        res.send(user);
    }, 'update')
    .pathParam('key', keySchema)
    .body(joi.object().description('The data to update the user with.'))
    .response(User, 'The updated user.')
    .summary('Update a user')
    .description(dd `
  Patches a user with the request body and
  returns the updated document.
`);


router.delete(':key', function(req, res) {
        const key = req.pathParams.key;
        try {
            users.remove(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            throw e;
        }
    }, 'delete')
    .pathParam('key', keySchema)
    .response(null)
    .summary('Remove a user')
    .description(dd `
  Deletes a user from the database.
`)