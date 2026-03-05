/* eslint-disable import/extensions */
import dirImport from './example-a';
import fileImport from './example-b';
import fileImportWithExtension from './example-c.js';
import dirImportWithExtension from './example-d.js';
import fileWithDoubleExtension from './example-e.js';

expect(dirImport.toString()).toMatchSnapshot();
expect(fileImport.toString()).toMatchSnapshot();
expect(fileImportWithExtension.toString()).toMatchSnapshot();
expect(dirImportWithExtension.toString()).toMatchSnapshot();
expect(fileWithDoubleExtension.toString()).toMatchSnapshot();
