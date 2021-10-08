import dirImport from './example-a';
import fileImport from './example-b';
import fileImportWithExtension from './example-c';

t.snapshot(dirImport.toString());
t.snapshot(fileImport.toString());
t.snapshot(fileImportWithExtension.toString());
