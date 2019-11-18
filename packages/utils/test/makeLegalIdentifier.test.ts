import { makeLegalIdentifier } from '..';

describe('makeLegalIdentifier', () => {
  it('camel-cases names', () => {
    expect(makeLegalIdentifier('foo-bar')).toEqual('fooBar');
  });

  it('replaces keywords', () => {
    expect(makeLegalIdentifier('typeof')).toEqual('_typeof');
  });

  it('blacklists arguments (https://github.com/rollup/rollup/issues/871)', () => {
    expect(makeLegalIdentifier('arguments')).toEqual('_arguments');
  });

  it('empty', () => {
    expect(makeLegalIdentifier('')).toEqual('_');
  });
});
