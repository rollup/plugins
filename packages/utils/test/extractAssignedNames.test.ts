import { extractAssignedNames } from '..';

describe('extractAssignedNames', () => {
  it('extracts an Identifier', () => {
    const node = {
      type: 'Identifier',
      start: 6,
      end: 7,
      name: 'x'
    };

    expect(extractAssignedNames(node)).toEqual(['x']);
  });

  it('extracts from array patterns', () => {
    const node = {
      type: 'ArrayPattern',
      start: 6,
      end: 29,
      elements: [
        null,
        {
          type: 'Identifier',
          start: 9,
          end: 10,
          name: 'a'
        },
        {
          type: 'AssignmentPattern',
          start: 12,
          end: 17,
          left: {
            type: 'Identifier',
            start: 12,
            end: 13,
            name: 'b'
          },
          right: {
            type: 'Identifier',
            start: 16,
            end: 17,
            name: 'c'
          }
        },
        {
          type: 'ArrayPattern',
          start: 19,
          end: 22,
          elements: [
            {
              type: 'Identifier',
              start: 20,
              end: 21,
              name: 'd'
            }
          ]
        },
        {
          type: 'RestElement',
          start: 24,
          end: 28,
          argument: {
            type: 'Identifier',
            start: 27,
            end: 28,
            name: 'e'
          }
        }
      ]
    };

    expect(extractAssignedNames(node)).toEqual(['a', 'b', 'd', 'e']);
  });

  it('extracts from object patterns', () => {
    const node = {
      type: 'ObjectPattern',
      start: 6,
      end: 42,
      properties: [
        {
          type: 'Property',
          start: 7,
          end: 8,
          method: false,
          shorthand: true,
          computed: false,
          key: {
            type: 'Identifier',
            start: 7,
            end: 8,
            name: 'a'
          },
          kind: 'init',
          value: {
            type: 'Identifier',
            start: 7,
            end: 8,
            name: 'a'
          }
        },
        {
          type: 'Property',
          start: 10,
          end: 14,
          method: false,
          shorthand: false,
          computed: false,
          key: {
            type: 'Identifier',
            start: 10,
            end: 11,
            name: 'b'
          },
          value: {
            type: 'Identifier',
            start: 13,
            end: 14,
            name: 'c'
          },
          kind: 'init'
        },
        {
          type: 'Property',
          start: 16,
          end: 29,
          method: false,
          shorthand: false,
          computed: false,
          key: {
            type: 'Identifier',
            start: 16,
            end: 17,
            name: 'd'
          },
          value: {
            type: 'ObjectPattern',
            start: 19,
            end: 29,
            properties: [
              {
                type: 'Property',
                start: 20,
                end: 28,
                method: false,
                shorthand: false,
                computed: false,
                key: {
                  type: 'Identifier',
                  start: 20,
                  end: 21,
                  name: 'e'
                },
                value: {
                  type: 'AssignmentPattern',
                  start: 23,
                  end: 28,
                  left: {
                    type: 'Identifier',
                    start: 23,
                    end: 24,
                    name: 'f'
                  },
                  right: {
                    type: 'Identifier',
                    start: 27,
                    end: 28,
                    name: 'g'
                  }
                },
                kind: 'init'
              }
            ]
          },
          kind: 'init'
        },
        {
          type: 'Property',
          start: 31,
          end: 35,
          method: false,
          shorthand: false,
          computed: false,
          key: {
            type: 'Literal',
            start: 31,
            end: 32,
            value: 1,
            raw: '1'
          },
          value: {
            type: 'Identifier',
            start: 34,
            end: 35,
            name: 'h'
          },
          kind: 'init'
        },
        {
          type: 'RestElement',
          start: 37,
          end: 41,
          argument: {
            type: 'Identifier',
            start: 40,
            end: 41,
            name: 'i'
          }
        }
      ]
    };

    expect(extractAssignedNames(node)).toEqual(['a', 'c', 'f', 'h', 'i']);
  });

  it('ignores updated member expressions', () => {
    const node = {
      type: 'ArrayPattern',
      start: 0,
      end: 11,
      elements: [
        {
          type: 'MemberExpression',
          start: 1,
          end: 4,
          object: {
            type: 'Identifier',
            start: 1,
            end: 2,
            name: 'a'
          },
          property: {
            type: 'Identifier',
            start: 3,
            end: 4,
            name: 'b'
          },
          computed: false
        },
        {
          type: 'MemberExpression',
          start: 6,
          end: 10,
          object: {
            type: 'Identifier',
            start: 6,
            end: 7,
            name: 'c'
          },
          property: {
            type: 'Identifier',
            start: 8,
            end: 9,
            name: 'd'
          },
          computed: true
        }
      ]
    };

    expect(extractAssignedNames(node)).toEqual([]);
  });
});
