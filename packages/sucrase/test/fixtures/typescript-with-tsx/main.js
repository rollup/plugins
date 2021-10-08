import dirImport from './example-a';
import fileImport from './example-b';
import fileImportWithExtension from './example-c';
import dirImportWithExtension from './example-d.js';

t.snapshot(dirImport.toString());
t.snapshot(fileImport.toString());
t.snapshot(fileImportWithExtension.toString());
t.snapshot(dirImportWithExtension.toString());
