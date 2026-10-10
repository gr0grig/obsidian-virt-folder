const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require('esbuild');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'virt-folder-search-'));
let findMatches, projectSearchTree, createCoreQuery;
before(async () => {
  const outfile = path.join(temp, 'search.cjs');
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, '../search.ts')],
    bundle: true, platform: 'node', format: 'cjs', outfile,
    plugins: [{ name: 'obsidian-stubs', setup(build) {
      build.onResolve({ filter: /^obsidian$/ }, () => ({ path: 'obsidian', namespace: 'stub' }));
      build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export class Component {} export class MarkdownRenderer {}' }));
    } }],
  });
  ({ findMatches, projectSearchTree, createCoreQuery } = require(outfile));
});
after(() => fs.rmSync(temp, { recursive: true, force: true }));

test('search reads required content, skips excluded files, and returns matches', async () => {
  const reads = [];
  const app = {
    metadataCache: { isUserIgnored: id => id === 'ignored.md' },
    vault: { cachedRead: async file => { reads.push(file.path); return file.path === 'yes.md' ? 'needle' : 'other'; } },
  };
  const files = ['yes.md', 'no.md', 'ignored.md'].map(path => ({ path }));
  const matches = await findMatches(app, files, { requiredInputs: { content: true }, match: (_, text) => text === 'needle' }, () => false);
  assert.deepEqual([...matches], ['yes.md']);
  assert.deepEqual(reads, ['yes.md', 'no.md']);
  reads.length = 0;
  await findMatches(app, files, { requiredInputs: {}, match: () => true }, () => false);
  assert.deepEqual(reads, [], 'metadata-only searches avoid content reads');
});

test('a superseded search cannot publish results after an outstanding read', async () => {
  let cancelled = false;
  let matched = false;
  const app = { metadataCache: {}, vault: { cachedRead: async () => { cancelled = true; return 'needle'; } } };
  const result = await findMatches(app, [{ path: 'a.md' }], {
    requiredInputs: { content: true }, match: () => { matched = true; return true; },
  }, () => cancelled);
  assert.equal(result, null);
  assert.equal(matched, false);
});

test('projection preserves matching relationships, promotes children, and handles cycles', () => {
  const note = (parents, children) => ({ parents, children, title: '', count_children() { return this.children.length; } });
  const base = {
    note_list: {
      parent: note([], ['child']), child: note(['parent'], ['leaf']), leaf: note(['child'], []),
      a: note(['b'], ['b']), b: note(['a'], ['a']), orphan: note([], []),
    },
    settings: {}, l_sort: ids => [...ids].sort(),
  };
  const tree = projectSearchTree(base, new Set(['child', 'leaf', 'a', 'b', 'orphan', 'deleted']));
  assert.deepEqual(tree.top_list, ['a', 'child', 'orphan']);
  assert.deepEqual(tree.note_list.child.parents, []);
  assert.deepEqual(tree.note_list.child.children, ['leaf']);
  assert.equal(tree.note_list.child.count_children(), 1);
  assert.deepEqual(base.note_list.child.parents, ['parent'], 'original graph is unchanged');
  assert.equal(tree.note_list.parent, undefined);
  assert.equal(tree.note_list.deleted, undefined);
});

test('unsupported core parser produces an explicit error', () => {
  assert.throws(() => createCoreQuery({}, 'tag:test'), /Core search is unavailable/);
});
