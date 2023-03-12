// To make this very clearly TypeScript and not just MJS with a MTS extension
type TestType = string | string[];
interface Main {
  (): string;
  propertyCall(input?: TestType): TestType;
}

const main: Main = () => 'It works!';
main.propertyCall = () => '';

export { main };
