'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Job = require('../models/job');

const jobs = module.context.collection('jobs');
const keySchema = joi.string().required()
    .description('The key of the job');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('job');


router.get(function(req, res) {
        res.send(jobs.all());
    }, 'list')
    .response([Job], 'A list of jobs.')
    .summary('List all jobs')
    .description(dd `
  Retrieves a list of all jobs.
`);


router.post(function(req, res) {
        const job = req.body;
        let meta;
        try {
            meta = jobs.save(job);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        Object.assign(job, meta);
        res.status(201);
        res.set('location', req.makeAbsolute(
            req.reverse('detail', { key: job._key })
        ));
        res.send(job);
    }, 'create')
    .body(Job, 'The job to create.')
    .response(201, Job, 'The created job.')
    .error(HTTP_CONFLICT, 'The job already exists.')
    .summary('Create a new job')
    .description(dd `
  Creates a new job from the request body and
  returns the saved document.
`);


router.get(':key', function(req, res) {
        const key = req.pathParams.key;
        let job
        try {
            job = jobs.document(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            throw e;
        }
        res.send(job);
    }, 'detail')
    .pathParam('key', keySchema)
    .response(Job, 'The job.')
    .summary('Fetch a job')
    .description(dd `
  Retrieves a job by its key.
`);


router.put(':key', function(req, res) {
        const key = req.pathParams.key;
        const job = req.body;
        let meta;
        try {
            meta = jobs.replace(key, job);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        Object.assign(job, meta);
        res.send(job);
    }, 'replace')
    .pathParam('key', keySchema)
    .body(Job, 'The data to replace the job with.')
    .response(Job, 'The new job.')
    .summary('Replace a job')
    .description(dd `
  Replaces an existing job with the request body and
  returns the new document.
`);


router.patch(':key', function(req, res) {
        const key = req.pathParams.key;
        const patchData = req.body;
        let job;
        try {
            jobs.update(key, patchData);
            job = jobs.document(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
                throw httpError(HTTP_CONFLICT, e.message);
            }
            throw e;
        }
        res.send(job);
    }, 'update')
    .pathParam('key', keySchema)
    .body(joi.object().description('The data to update the job with.'))
    .response(Job, 'The updated job.')
    .summary('Update a job')
    .description(dd `
  Patches a job with the request body and
  returns the updated document.
`);


router.delete(':key', function(req, res) {
        const key = req.pathParams.key;
        try {
            jobs.remove(key);
        } catch (e) {
            if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
                throw httpError(HTTP_NOT_FOUND, e.message);
            }
            throw e;
        }
    }, 'delete')
    .pathParam('key', keySchema)
    .response(null)
    .summary('Remove a job')
    .description(dd `
  Deletes a job from the database.
`);