/* eslint-disable */
  before();
  function f() {
    return {
      g: function () {
        return {
          hello: function () {
            console.log('hello');
          }
        };
      }
    };
  }

  Test
  .
  f()
    .  g()  .
  hello();
  after();
