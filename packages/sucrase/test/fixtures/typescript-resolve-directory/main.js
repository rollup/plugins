import dirImport from './example-a';
import fileImport from './example-b';

expect(dirImport.toString()).toMatchSnapshot();
expect(fileImport.toString()).toMatchSnapshot();
