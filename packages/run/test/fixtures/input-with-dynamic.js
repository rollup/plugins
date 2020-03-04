import { log } from "./log.js";
log(0);
(async () => {
  await import("./dynamic.js");
})();
