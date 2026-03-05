import 'data:text/javascript, expect(true).toBeTruthy();';
import { batman } from 'data:text/javascript, export const batman = true;\nconst joker = false;\nexport default joker;';

expect(batman).toMatchSnapshot();
