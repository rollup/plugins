/* eslint-disable import/extensions */
import dirImport from './example-a';
import fileImport from './example-b';
import fileImportWithExtension from './example-c.js';
import dirImportWithExtension from './example-d.js';
import fileWithDoubleExtension from './example-e.js';

t.snapshot(dirImport.toString());
t.snapshot(fileImport.toString());
t.snapshot(fileImportWithExtension.toString());
t.snapshot(dirImportWithExtension.toString());
t.snapshot(fileWithDoubleExtension.toString());
