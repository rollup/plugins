import batman from 'data:application/json;base64, eyAiYmF0bWFuIjogInRydWUiIH0=';

expect(batman.batman).toBeTruthy();
expect(batman).toMatchSnapshot();
