'use strict';
const db = require('@arangodb').db;
const collections = [
    "business",
    "jobs",
    "categories",
    "users",
    "auths",
    "sessions"
];

for (const localName of collections) {
    const qualifiedName = module.context.collectionName(localName);
    db._drop(qualifiedName);
}