import {dirname, relative} from 'path';


var basedir = '/';
var importer = './src/es6/path.js';
var out = dirname('/' + relative(basedir, importer));
if (out === '/src/es6'){
  done();
} else {
  done(new Error(`wrong directory, expected '/src/es6' but got '${out}'`));
}
