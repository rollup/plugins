import batman from 'data:application/json, { "batman": "true" }';

t.truthy(batman.batman);
t.snapshot(batman);
