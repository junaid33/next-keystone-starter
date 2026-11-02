// Demo-account guard: features/keystone/lib/demo-guard.ts. Offline, no DB.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function load(relative) {
  const filename = path.resolve(root, relative);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require, process, Symbol }, { filename });
  return module.exports;
}

const { DEMO_GUARD_MESSAGE, DEMO_GUARD_POLICY, withDemoGuard, rewriteDemoErrors } = load('features/keystone/lib/demo-guard.ts');
const env = { DEMO_USER_EMAILS: ' Other@example.com , DEMO@OPENSHIP.ORG ' };

// Repo-specific cases.
const USER = 'User';          // the login identity list
const ROLE_LISTS = ["Role"];     // role / permission lists
const ROLE_FIELD = 'role';   // the user's role relationship
const STORE = null;               // [listKey, fields[]] or null
const CATALOGUE = 'Todo';     // a day-to-day list a demo user must still edit
const EXTRA_IDENTITIES = []; // other login-identity lists (staff, members)

const DEMO = { itemId: 'demo', listKey: USER, data: { email: 'demo@openship.org' } };
const ADMIN = { itemId: 'admin', listKey: USER, data: { email: 'owner@openship.org' } };

let catalogueHookRan = 0;
const fixtures = { [CATALOGUE]: { fields: {}, hooks: { beforeOperation: { update: () => { catalogueHookRan++; } } } } };
for (const key of Object.keys(DEMO_GUARD_POLICY)) fixtures[key] ??= { fields: {} };
const lists = withDemoGuard(fixtures, DEMO_GUARD_POLICY, env);

function run(listKey, operation, session, { item, inputData } = {}) {
  const context = { session, sudo: () => context };
  const hook = lists[listKey]?.hooks?.beforeOperation;
  const fn = typeof hook === 'function' ? hook : hook?.[operation];
  if (!fn) return Promise.resolve();
  return fn({ listKey, operation, context, item, inputData, resolvedData: inputData });
}
const refused = (promise) => assert.rejects(promise, (error) => error.message === DEMO_GUARD_MESSAGE);

test('the exact copy', () => assert.equal(DEMO_GUARD_MESSAGE, "Demo accounts can't change this."));

test('1. a demo user cannot change any password or email, its own included', async () => {
  for (const id of ['demo', 'admin']) {
    await refused(run(USER, 'update', DEMO, { item: { id }, inputData: { password: 'x' } }));
    await refused(run(USER, 'update', DEMO, { item: { id }, inputData: { email: 'a@b.c' } }));
  }
});

test('2. a demo user cannot change roles or a user\'s role', async () => {
  for (const list of ROLE_LISTS) {
    await refused(run(list, 'create', DEMO, { inputData: { name: 'X' } }));
    await refused(run(list, 'update', DEMO, { item: { id: 'r' }, inputData: { name: 'Y' } }));
    await refused(run(list, 'delete', DEMO, { item: { id: 'r' } }));
  }
  await refused(run(USER, 'update', DEMO, { item: { id: 'demo' }, inputData: { [ROLE_FIELD]: { connect: { id: 'r' } } } }));
});

test('3. a demo user cannot create, delete or update users or staff identities', async () => {
  for (const list of [USER, ...EXTRA_IDENTITIES]) {
    await refused(run(list, 'create', DEMO, { inputData: { name: 'New' } }));
    await refused(run(list, 'delete', DEMO, { item: { id: 'admin' } }));
    await refused(run(list, 'update', DEMO, { item: { id: 'admin' }, inputData: { name: 'Hacked' } }));
  }
  await refused(run(USER, 'delete', DEMO, { item: { id: 'demo' } }));
});

test('4. a demo user cannot change the store name, logo or URL settings', { skip: !STORE }, async () => {
  const [list, fields] = STORE;
  for (const field of fields) await refused(run(list, 'update', DEMO, { item: { id: 's' }, inputData: { [field]: 'x' } }));
});

test('a demo user can still edit the catalogue and its own onboarding state', async () => {
  await run(CATALOGUE, 'update', DEMO, { item: { id: 'p' }, inputData: { name: 'Edited' } });
  assert.equal(catalogueHookRan, 1, 'the existing hook still runs');
  await run(USER, 'update', DEMO, { item: { id: 'demo' }, inputData: { onboardingStatus: 'dismissed' } });
});

test('a non-demo admin is unaffected', async () => {
  await run(USER, 'update', ADMIN, { item: { id: 'demo' }, inputData: { password: 'x', email: 'a@b.c', [ROLE_FIELD]: {} } });
  await run(USER, 'create', ADMIN, { inputData: { name: 'New' } });
  await run(USER, 'delete', ADMIN, { item: { id: 'x' } });
  for (const list of ROLE_LISTS) await run(list, 'update', ADMIN, { item: { id: 'r' }, inputData: { name: 'Y' } });
  if (STORE) await run(STORE[0], 'update', ADMIN, { item: { id: 's' }, inputData: { [STORE[1][0]]: 'New' } });
  await run(USER, 'update', null, { item: { id: 'x' }, inputData: { password: 'x' } });
});

test('a session without data.email is resolved from the user record', async () => {
  const session = { itemId: 'demo', listKey: USER };
  const context = { session, sudo: () => ({ db: { [USER]: { findOne: async () => ({ email: 'DEMO@OPENSHIP.ORG' }) } } }) };
  const hook = lists[USER].hooks.beforeOperation;
  await refused(hook({ listKey: USER, operation: 'update', context, item: { id: 'demo' }, inputData: { password: 'x' } }));
});

test('no DEMO_USER_EMAILS means no guard', async () => {
  const open = withDemoGuard({ [ROLE_LISTS[0]]: { fields: {} } }, DEMO_GUARD_POLICY, {});
  await open[ROLE_LISTS[0]].hooks.beforeOperation({ listKey: ROLE_LISTS[0], operation: 'delete', context: { session: DEMO }, item: { id: 'r' } });
});

test('Keystone\'s hook wrapper is rewritten to the exact copy', () => {
  const wrapped = { message: `An error occurred while running "beforeOperation".\n  - X.hooks.beforeOperation: ${DEMO_GUARD_MESSAGE}`, path: ['x'] };
  const other = { message: 'Something else' };
  const result = rewriteDemoErrors({ data: null, errors: [wrapped, other] });
  assert.equal(result.errors[0].message, DEMO_GUARD_MESSAGE);
  assert.equal(result.errors[1], other);
});

test('the guard is wired into the Keystone config and the GraphQL route', () => {
  assert.match(fs.readFileSync(path.join(root, 'features/keystone/index.ts'), 'utf8'), /withDemoGuard\(/);
  assert.match(fs.readFileSync(path.join(root, 'pages/api/graphql.ts'), 'utf8'), /useDemoGuardErrors\(\)/);
});
