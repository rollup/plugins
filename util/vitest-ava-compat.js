function applyErrorExpectations(error, expectations) {
  if (typeof expectations === 'undefined' || expectations === null) return;

  const message =
    error && typeof error === 'object' && 'message' in error ? error.message : String(error);

  if (expectations instanceof RegExp) {
    global.expect(message).toMatch(expectations);
    return;
  }

  if (typeof expectations === 'function') {
    global.expect(error).toBeInstanceOf(expectations);
    return;
  }

  if (typeof expectations === 'string') {
    global.expect(message).toBe(expectations);
    return;
  }

  if (typeof expectations === 'object') {
    if ('instanceOf' in expectations && expectations.instanceOf) {
      global.expect(error).toBeInstanceOf(expectations.instanceOf);
    }

    if ('name' in expectations && typeof expectations.name !== 'undefined') {
      global.expect(error && error.name).toBe(expectations.name);
    }

    if ('code' in expectations && typeof expectations.code !== 'undefined') {
      global.expect(error && error.code).toBe(expectations.code);
    }

    if ('message' in expectations && typeof expectations.message !== 'undefined') {
      if (expectations.message instanceof RegExp) {
        global.expect(message).toMatch(expectations.message);
      } else {
        global.expect(message).toContain(String(expectations.message));
      }
    }
  }
}

function createAssertions() {
  let plannedAssertions = null;
  let assertionCount = 0;

  const track = () => {
    assertionCount += 1;
  };

  const t = {
    context: {},
    plan(count) {
      plannedAssertions = count;
    },
    pass() {
      track();
    },
    fail(message = 't.fail() called') {
      track();
      throw new Error(message);
    },
    is(actual, expected, message) {
      track();
      global.expect(actual, message).toBe(expected);
    },
    not(actual, expected, message) {
      track();
      global.expect(actual, message).not.toBe(expected);
    },
    deepEqual(actual, expected, message) {
      track();
      global.expect(actual, message).toEqual(expected);
    },
    truthy(value, message) {
      track();
      global.expect(value, message).toBeTruthy();
    },
    falsy(value, message) {
      track();
      global.expect(value, message).toBeFalsy();
    },
    true(value, message) {
      track();
      global.expect(value, message).toBe(true);
    },
    false(value, message) {
      track();
      global.expect(value, message).toBe(false);
    },
    regex(value, pattern, message) {
      track();
      global.expect(value, message).toMatch(pattern);
    },
    notRegex(value, pattern, message) {
      track();
      global.expect(value, message).not.toMatch(pattern);
    },
    snapshot(value) {
      track();
      global.expect(value).toMatchSnapshot();
    },
    throws(fn, expectations) {
      track();
      let error;
      try {
        fn();
      } catch (caught) {
        error = caught;
      }

      if (!error) {
        throw new Error('Expected function to throw.');
      }

      applyErrorExpectations(error, expectations);
      return error;
    },
    async throwsAsync(fnOrPromise, expectations) {
      track();
      let error;
      try {
        if (typeof fnOrPromise === 'function') {
          await fnOrPromise();
        } else {
          await fnOrPromise;
        }
      } catch (caught) {
        error = caught;
      }

      if (!error) {
        throw new Error('Expected promise to reject.');
      }

      applyErrorExpectations(error, expectations);
      return error;
    }
  };

  const verifyPlan = () => {
    if (plannedAssertions !== null) {
      global.expect(assertionCount).toBe(plannedAssertions);
    }
  };

  return { t, verifyPlan };
}

const wrapImplementation = (implementation) => async () => {
  const { t, verifyPlan } = createAssertions();
  await implementation(t);
  verifyPlan();
};

const wrapHook = (hook) => {
  if (typeof hook !== 'function') return hook;

  return async () => {
    if (hook.length === 0) {
      await hook();
      return;
    }

    const { t, verifyPlan } = createAssertions();
    await hook(t);
    verifyPlan();
  };
};

const getBaseTest = () => {
  if (typeof global.test !== 'function') {
    throw new Error(
      'Vitest global `test` was not found. Ensure `globals: true` is enabled in .config/vitest.config.mts.'
    );
  }

  return global.test;
};

function avaLikeTest(name, implementation, timeout) {
  const baseTest = getBaseTest();
  const resolvedTimeout = typeof timeout === 'undefined' ? 10000 : timeout;

  if (typeof implementation !== 'function') {
    return baseTest(name, implementation, resolvedTimeout);
  }

  return baseTest(name, wrapImplementation(implementation), resolvedTimeout);
}

avaLikeTest.serial = (name, implementation, timeout) => {
  const baseTest = getBaseTest();
  const sequential = baseTest.sequential || baseTest;
  const resolvedTimeout = typeof timeout === 'undefined' ? 10000 : timeout;

  if (typeof implementation !== 'function') {
    return sequential(name, implementation, resolvedTimeout);
  }

  return sequential(name, wrapImplementation(implementation), resolvedTimeout);
};

avaLikeTest.skip = (...args) => getBaseTest().skip(...args);
avaLikeTest.only = (...args) => getBaseTest().only(...args);
avaLikeTest.todo = (...args) => getBaseTest().todo(...args);

avaLikeTest.before = (hook, timeout) => global.beforeAll(wrapHook(hook), timeout);
avaLikeTest.beforeEach = (hook, timeout) => global.beforeEach(wrapHook(hook), timeout);
avaLikeTest.after = (hook, timeout) => global.afterAll(wrapHook(hook), timeout);
avaLikeTest.afterEach = (hook, timeout) => global.afterEach(wrapHook(hook), timeout);

module.exports = avaLikeTest;
