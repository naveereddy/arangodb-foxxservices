'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Auth = require('../models/auth');

const auths = module.context.collection('auths');
const keySchema = joi.string().required()
    .description('The key of the auths');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');
const db = require('@arangodb').db;

const router = createRouter();
module.exports = router;


router.tag('auth');

router.get('verify/:auth_key', function(req, res) {
        const key = req.pathParams.auth_key
        let authData;
        try {
            authData = auths.document(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            throw e;
        }
        if (authData) {
            res.send(authData)
        } else {
            res.status(200);
            res.send({ message: 'unauthorized user' });
        }
    }, 'detail')
    .pathParam('auth_key', keySchema)
    .response(Auth, 'user is logged in ')
    .summary('verify user')
    .description('user verification for all requests')


router.post('logout', function(req, res) {
        const body = req.body;
        try {
            auths.remove(req.body.auth_key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            throw e;
        }
        res.send({ sucess: true })
    })
    .body(joi.object().required(), keySchema)
    .summary('verify user')
    .description('user verification for all requests')