const falseDefault = require('dep_false_default_.js');
const falseMixed = require('dep_false_mixed_.js');
const falseNamed = require('dep_false_named_.js');

const autoDefault = require('dep_auto_default_.js');
const autoMixed = require('dep_auto_mixed_.js');
const autoNamed = require('dep_auto_named_.js');

const preferredDefault = require('dep_preferred_default_.js');
const preferredMixed = require('dep_preferred_mixed_.js');
const preferredNamed = require('dep_preferred_named_.js');

const trueDefault = require('dep_true_default_.js');
const trueMixed = require('dep_true_mixed_.js');

t.deepEqual(falseDefault, { default: 'default' }, 'false default');
t.deepEqual(falseMixed, { default: 'default', named: 'named' }, 'false mixed');
t.deepEqual(falseNamed, { named: 'named' }, 'false named');

t.deepEqual(autoDefault, 'default', 'auto default');
t.deepEqual(autoMixed, { default: 'default', named: 'named' }, 'auto mixed');
t.deepEqual(autoNamed, { named: 'named' }, 'auto named');

t.deepEqual(preferredDefault, 'default', 'preferred default');
t.deepEqual(preferredMixed, 'default', 'preferred mixed');
t.deepEqual(preferredNamed, { named: 'named' }, 'preferred named');

t.deepEqual(trueDefault, 'default', 'true default');
t.deepEqual(trueMixed, 'default', 'true mixed');
