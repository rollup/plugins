const identifier = require('./identifier');
const property = require('./property');
const arrayPattern = require('./array-pattern.js');
const assignmentPattern = require('./assignment-pattern.js');

t.deepEqual(identifier, {}, 'identifier');
t.deepEqual(property, {}, 'property');
t.deepEqual(arrayPattern, {}, 'arrayPattern');
t.deepEqual(assignmentPattern, {}, 'assignmentPattern');
