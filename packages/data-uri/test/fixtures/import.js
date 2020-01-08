import 'data:text/javascript, t.truthy(true);';
import { batman } from 'data:text/javascript, export const batman = true;\nconst joker = false;\nexport default joker;';

t.snapshot(batman);
