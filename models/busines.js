'use strict';
const _ = require('lodash');
const joi = require('joi');

module.exports = {
    schema: {
        // Describe the attributes with joi here
        _key: joi.string(),
        business_id: joi.string(),
        category: joi.string(),
        sources_list: joi.array().items(joi.string()),
        city: joi.string(),
        hours: joi.array().items(joi.any()),
        latitude: joi.number(),
        longitude: joi.number(),
        name: joi.string(),
        zip: joi.string(),
        state: joi.string(),
        address: joi.string(),
        search_keys: joi.array().items(joi.string())
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