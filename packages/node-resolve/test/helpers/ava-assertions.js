const matchError = (error, expectation) => {
  if (!expectation) return;

  if (expectation instanceof RegExp) {
    expect(error.message).toMatch(expectation);
    return;
  }

  if (typeof expectation === 'string') {
    expect(error.message).toContain(expectation);
    return;
  }

  if (typeof expectation === 'function') {
    expect(error).toBeInstanceOf(expectation);
    return;
  }

  if (typeof expectation === 'object') {
    const { message, instanceOf, ...rest } = expectation;

    if (instanceOf) {
      expect(error).toBeInstanceOf(instanceOf);
    }

    if (message !== undefined) {
      if (message instanceof RegExp) {
        expect(error.message).toMatch(message);
      } else {
        expect(error.message).toBe(message);
      }
    }

    if (Object.keys(rest).length > 0) {
      expect(error).toMatchObject(rest);
    }
  }
};

const toPromise = (valueOrFactory) => {
  if (typeof valueOrFactory === 'function') {
    return valueOrFactory();
  }
  return valueOrFactory;
};

const throwsAsync = async (valueOrFactory, expectation) => {
  try {
    await toPromise(valueOrFactory);
  } catch (error) {
    matchError(error, expectation);
    return error;
  }

  throw new Error('Expected function to throw');
};

const createAvaAssertions = () => {
  return {
    is(actual, expected, message) {
      expect(actual, message).toBe(expected);
    },

    not(actual, expected, message) {
      expect(actual, message).not.toBe(expected);
    },

    deepEqual(actual, expected, message) {
      expect(actual, message).toEqual(expected);
    },

    notDeepEqual(actual, expected, message) {
      expect(actual, message).not.toEqual(expected);
    },

    like(actual, expected, message) {
      expect(actual, message).toMatchObject(expected);
    },

    true(value, message) {
      expect(value, message).toBe(true);
    },

    false(value, message) {
      expect(value, message).toBe(false);
    },

    truthy(value, message) {
      expect(value, message).toBeTruthy();
    },

    falsy(value, message) {
      expect(value, message).toBeFalsy();
    },

    regex(value, regex, message) {
      expect(value, message).toMatch(regex);
    },

    assert(value, message) {
      expect(value, message).toBeTruthy();
    },

    pass() {
      expect(true).toBe(true);
    },

    fail(message) {
      throw new Error(message || 'Test failed');
    },

    snapshot(value) {
      expect(value).toMatchSnapshot();
    },

    plan(count) {
      expect.assertions(count);
    },

    throws(valueOrFactory, expectation) {
      if (typeof valueOrFactory === 'function') {
        try {
          const result = valueOrFactory();
          if (result && typeof result.then === 'function') {
            return throwsAsync(result, expectation);
          }
        } catch (error) {
          matchError(error, expectation);
          return error;
        }
        throw new Error('Expected function to throw');
      }

      return throwsAsync(valueOrFactory, expectation);
    },

    throwsAsync(valueOrFactory, expectation) {
      return throwsAsync(valueOrFactory, expectation);
    },

    async notThrowsAsync(valueOrFactory) {
      return toPromise(valueOrFactory);
    }
  };
};

module.exports = {
  createAvaAssertions
};
