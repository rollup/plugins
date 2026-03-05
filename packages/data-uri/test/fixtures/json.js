import batman from 'data:application/json, { "batman": "true" }';

expect(batman.batman).toBeTruthy();
expect(batman).toMatchSnapshot();
