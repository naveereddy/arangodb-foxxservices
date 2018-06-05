'use strict';
const _ = require('lodash');
const joi = require('joi');

module.exports = {
    schema: {
        // Describe the attributes with joi here
        _key: joi.string(),
        sources_list: joi.array().items(joi.string()),
        job_id: joi.string(),
        createdate: joi.date().iso(),
        updatedate: joi.date().iso(),
        name: joi.string(),
        business_id: joi.string()
    },
    forClient(obj) {
        // Implement outgoing transformations here
        obj = _.omit(obj, ['_id', '_rev', '_oldRev']);
        return obj;
    },
    fromClient(obj) {
        // Implement incoming transformations here
        return obj;
    }
};