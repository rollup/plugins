// To make this very clearly TypeScript and not just CJS with a CTS extension
type TestType = string | string[];
interface Main {
  (): string;
  propertyCall(input?: TestType): TestType;
}

const main: Main = () => 'It works!';
main.propertyCall = () => '';

export { main };
