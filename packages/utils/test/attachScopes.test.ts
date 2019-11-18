import test from 'ava';

import { attachScopes } from '..';

test('attaches a scope to the top level', (t) => {
  const ast = {
    type: 'Program',
    start: 0,
    end: 8,
    body: [
      {
        type: 'VariableDeclaration',
        start: 0,
        end: 8,
        declarations: [
          {
            type: 'VariableDeclarator',
            start: 4,
            end: 7,
            id: {
              type: 'Identifier',
              start: 4,
              end: 7,
              name: 'foo'
            },
            init: null
          }
        ],
        kind: 'var'
      }
    ],
    sourceType: 'module'
  };

  const scope = attachScopes(ast, 'scope');
  t.truthy(scope.contains('foo'));
  t.falsy(scope.contains('bar'));
});

test('adds multiple declarators from a single var declaration', (t) => {
  const ast = {
    type: 'Program',
    start: 0,
    end: 13,
    body: [
      {
        type: 'VariableDeclaration',
        start: 0,
        end: 13,
        declarations: [
          {
            type: 'VariableDeclarator',
            start: 4,
            end: 7,
            id: {
              type: 'Identifier',
              start: 4,
              end: 7,
              name: 'foo'
            },
            init: null
          },

          {
            type: 'VariableDeclarator',
            start: 9,
            end: 12,
            id: {
              type: 'Identifier',
              start: 9,
              end: 12,
              name: 'bar'
            },
            init: null
          }
        ],
        kind: 'var'
      }
    ],
    sourceType: 'module'
  };

  const scope = attachScopes(ast, 'scope');
  t.truthy(scope.contains('foo'));
  t.truthy(scope.contains('bar'));
});

test('adds named declarators from a deconstructed declaration', (t) => {
  const ast = {
    type: 'Program',
    start: 0,
    end: 13,
    body: [
      {
        type: 'VariableDeclaration',
        start: 0,
        end: 42,
        declarations: [
          {
            type: 'VariableDeclarator',
            start: 4,
            end: 41,
            id: {
              type: 'ObjectPattern',
              start: 4,
              end: 15,
              properties: [
                {
                  type: 'Property',
                  start: 6,
                  end: 10,
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: 'Literal',
                    start: 6,
                    end: 7,
                    value: 1,
                    raw: '1'
                  },
                  value: {
                    type: 'Identifier',
                    start: 9,
                    end: 10,
                    name: 'a'
                  },
                  kind: 'init'
                },
                {
                  type: 'Property',
                  start: 12,
                  end: 13,
                  method: false,
                  shorthand: true,
                  computed: false,
                  key: {
                    type: 'Identifier',
                    start: 12,
                    end: 13,
                    name: 'b'
                  },
                  kind: 'init',
                  value: {
                    type: 'Identifier',
                    start: 12,
                    end: 13,
                    name: 'b'
                  }
                }
              ]
            },
            init: {
              type: 'ObjectExpression',
              start: 18,
              end: 41,
              properties: [
                {
                  type: 'Property',
                  start: 22,
                  end: 28,
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: 'Literal',
                    start: 22,
                    end: 23,
                    value: 1,
                    raw: '1'
                  },
                  value: {
                    type: 'Literal',
                    start: 25,
                    end: 28,
                    value: 'a',
                    raw: "'a'"
                  },
                  kind: 'init'
                },
                {
                  type: 'Property',
                  start: 32,
                  end: 38,
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: 'Identifier',
                    start: 32,
                    end: 33,
                    name: 'b'
                  },
                  value: {
                    type: 'Literal',
                    start: 35,
                    end: 38,
                    value: 'b',
                    raw: "'b'"
                  },
                  kind: 'init'
                }
              ]
            }
          }
        ],
        kind: 'var'
      }
    ],
    sourceType: 'module'
  };

  const scope = attachScopes(ast, 'scope');
  t.truthy(scope.contains('a'));
  t.truthy(scope.contains('b'));
});

test('adds rest elements from a deconstructed object declaration', (t) => {
  const ast = {
    type: 'Program',
    start: 0,
    end: 66,
    body: [
      {
        type: 'VariableDeclaration',
        start: 0,
        end: 66,
        declarations: [
          {
            type: 'VariableDeclarator',
            start: 6,
            end: 66,
            id: {
              type: 'ObjectPattern',
              start: 6,
              end: 26,
              properties: [
                {
                  type: 'Property',
                  start: 8,
                  end: 9,
                  method: false,
                  shorthand: true,
                  computed: false,
                  key: {
                    type: 'Identifier',
                    start: 8,
                    end: 9,
                    name: 'x'
                  },
                  kind: 'init',
                  value: {
                    type: 'Identifier',
                    start: 8,
                    end: 9,
                    name: 'x'
                  }
                },
                {
                  type: 'Property',
                  start: 11,
                  end: 15,
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: 'Identifier',
                    start: 11,
                    end: 12,
                    name: 'y'
                  },
                  value: {
                    type: 'Identifier',
                    start: 14,
                    end: 15,
                    name: 'z'
                  },
                  kind: 'init'
                },
                {
                  type: 'RestElement',
                  start: 17,
                  end: 24,
                  argument: {
                    type: 'Identifier',
                    start: 20,
                    end: 24,
                    name: 'rest'
                  }
                }
              ]
            },
            init: {
              type: 'ObjectExpression',
              start: 29,
              end: 66,
              properties: [
                {
                  type: 'Property',
                  start: 31,
                  end: 36,
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: 'Identifier',
                    start: 31,
                    end: 32,
                    name: 'x'
                  },
                  value: {
                    type: 'Literal',
                    start: 34,
                    end: 36,
                    value: 10,
                    raw: '10'
                  },
                  kind: 'init'
                },
                {
                  type: 'Property',
                  start: 38,
                  end: 43,
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: 'Identifier',
                    start: 38,
                    end: 39,
                    name: 'y'
                  },
                  value: {
                    type: 'Literal',
                    start: 41,
                    end: 43,
                    value: 20,
                    raw: '20'
                  },
                  kind: 'init'
                },
                {
                  type: 'Property',
                  start: 45,
                  end: 50,
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: 'Identifier',
                    start: 45,
                    end: 46,
                    name: 'z'
                  },
                  value: {
                    type: 'Literal',
                    start: 48,
                    end: 50,
                    value: 30,
                    raw: '30'
                  },
                  kind: 'init'
                },
                {
                  type: 'Property',
                  start: 52,
                  end: 57,
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: 'Identifier',
                    start: 52,
                    end: 53,
                    name: 'w'
                  },
                  value: {
                    type: 'Literal',
                    start: 55,
                    end: 57,
                    value: 40,
                    raw: '40'
                  },
                  kind: 'init'
                },
                {
                  type: 'Property',
                  start: 59,
                  end: 64,
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: 'Identifier',
                    start: 59,
                    end: 60,
                    name: 'k'
                  },
                  value: {
                    type: 'Literal',
                    start: 62,
                    end: 64,
                    value: 50,
                    raw: '50'
                  },
                  kind: 'init'
                }
              ]
            }
          }
        ],
        kind: 'const'
      }
    ],
    sourceType: 'module'
  };

  const scope = attachScopes(ast, 'scope');
  t.truthy(scope.contains('x'));
  t.falsy(scope.contains('y'));
  t.truthy(scope.contains('z'));
  t.truthy(scope.contains('rest'));
});

test('adds nested declarators from a deconstructed declaration', (t) => {
  const ast = {
    type: 'Program',
    start: 0,
    end: 40,
    body: [
      {
        type: 'VariableDeclaration',
        start: 0,
        end: 40,
        declarations: [
          {
            type: 'VariableDeclarator',
            start: 4,
            end: 39,
            id: {
              type: 'ObjectPattern',
              start: 4,
              end: 19,
              properties: [
                {
                  type: 'Property',
                  start: 6,
                  end: 17,
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: 'Identifier',
                    start: 6,
                    end: 7,
                    name: 'a'
                  },
                  value: {
                    type: 'ObjectPattern',
                    start: 9,
                    end: 17,
                    properties: [
                      {
                        type: 'Property',
                        start: 11,
                        end: 15,
                        method: false,
                        shorthand: false,
                        computed: false,
                        key: {
                          type: 'Identifier',
                          start: 11,
                          end: 12,
                          name: 'b'
                        },
                        value: {
                          type: 'Identifier',
                          start: 14,
                          end: 15,
                          name: 'c'
                        },
                        kind: 'init'
                      }
                    ]
                  },
                  kind: 'init'
                }
              ]
            },
            init: {
              type: 'ObjectExpression',
              start: 22,
              end: 39,
              properties: [
                {
                  type: 'Property',
                  start: 24,
                  end: 37,
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: 'Identifier',
                    start: 24,
                    end: 25,
                    name: 'a'
                  },
                  value: {
                    type: 'ObjectExpression',
                    start: 27,
                    end: 37,
                    properties: [
                      {
                        type: 'Property',
                        start: 29,
                        end: 35,
                        method: false,
                        shorthand: false,
                        computed: false,
                        key: {
                          type: 'Identifier',
                          start: 29,
                          end: 30,
                          name: 'b'
                        },
                        value: {
                          type: 'Literal',
                          start: 32,
                          end: 35,
                          value: 'b',
                          raw: "'b'"
                        },
                        kind: 'init'
                      }
                    ]
                  },
                  kind: 'init'
                }
              ]
            }
          }
        ],
        kind: 'let'
      }
    ],
    sourceType: 'module'
  };

  const scope = attachScopes(ast, 'scope');
  t.falsy(scope.contains('a'));
  t.falsy(scope.contains('b'));
  t.truthy(scope.contains('c'));
});

test('supports FunctionDeclarations without id', (t) => {
  const ast = {
    type: 'Program',
    start: 0,
    end: 33,
    body: [
      {
        type: 'ExportDefaultDeclaration',
        start: 0,
        end: 32,
        declaration: {
          type: 'FunctionDeclaration',
          start: 15,
          end: 32,
          id: null,
          generator: false,
          expression: false,
          async: false,
          params: [],
          body: {
            type: 'BlockStatement',
            start: 26,
            end: 32,
            body: []
          }
        }
      }
    ],
    sourceType: 'module'
  };

  t.notThrows(() => {
    attachScopes(ast, 'scope');
  });
});

test('supports catch without a parameter', (t) => {
  const ast = {
    type: 'Program',
    start: 0,
    end: 23,
    body: [
      {
        type: 'TryStatement',
        start: 0,
        end: 23,
        block: {
          type: 'BlockStatement',
          start: 4,
          end: 10,
          body: []
        },
        handler: {
          type: 'CatchClause',
          start: 11,
          end: 23,
          param: null,
          body: {
            type: 'BlockStatement',
            start: 17,
            end: 23,
            body: []
          }
        },
        finalizer: null
      }
    ],
    sourceType: 'script'
  };
  t.notThrows(() => {
    attachScopes(ast, 'scope');
  });
});
