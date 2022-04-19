/* eslint-disable import/extensions */
import example from './example-a.ts';
import exampleB from './example-b.js';
import exampleC from './example-c.js';
import exampleD from './example-d.js';

t.snapshot(example.toString());
t.snapshot(exampleB.toString());
t.snapshot(exampleC.toString());
t.snapshot(exampleD.toString());
