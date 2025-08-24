import { ensureSchema, createDefaultOrgAndOwner } from "../startup";

ensureSchema()
  .then(createDefaultOrgAndOwner)
  .then(() => { console.log("DB ready"); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });