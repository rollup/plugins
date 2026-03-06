/* eslint-disable import/extensions */
import example from './example-a.ts';
import exampleB from './example-b.js';
import exampleC from './example-c.js';
import exampleD from './example-d.js';

expect(example.toString()).toMatchSnapshot();
expect(exampleB.toString()).toMatchSnapshot();
expect(exampleC.toString()).toMatchSnapshot();
expect(exampleD.toString()).toMatchSnapshot();
