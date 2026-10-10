const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require('esbuild');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'virt-folder-tags-'));
let BaseScanner;
before(async () => {
  const outfile = path.join(temp, 'scanner.cjs');
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, '../base_scanner.ts')],
    bundle: true, platform: 'node', format: 'cjs', outfile,
    plugins: [{ name: 'obsidian-stubs', setup(build) {
      build.onResolve({ filter: /^(obsidian|settings)$/ }, args => ({ path: args.path, namespace: 'stub' }));
      build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: `
        export const SortTypes = { file_name: 'file_name' };
        export function getAllTags(cache) {
          return [...(cache.tags || []).map(t => t.tag), ...(cache.frontmatter?.tags || []).map(t => '#' + t)];
        }` }));
    } }],
  });
  ({ BaseScanner } = require(outfile));
});
after(() => fs.rmSync(temp, { recursive: true, force: true }));

function fixture() {
  const files = [];
  const caches = new Map();
  const app = {
    vault: { getMarkdownFiles: () => files },
    metadataCache: {
      getFileCache: file => caches.get(file.path),
      getFirstLinkpathDest: () => null,
    },
  };
  const scanner = new BaseScanner(app, { settings: { sortTreeBy: 'file_name', sortTreeRev: false } });
  scanner.settings.set_prop('up');
  scanner.settings.set_ignored_tags(['#archive']);
  function add(name, tags, frontmatter = false) {
    const file = { path: name + '.md', basename: name, stat: { mtime: 1, ctime: 1 } };
    files.push(file);
    caches.set(file.path, frontmatter ? { frontmatter: { tags } } : { tags: tags.map(tag => ({ tag })) });
    return file;
  }
  return { scanner, add, caches };
}

test('root ignore tag hides exact and nested tags on full and incremental scans', () => {
  const { scanner, add } = fixture();
  const cases = [
    ['exact', ['#archive'], true],
    ['nested', ['#archive/project'], true],
    ['deep', ['#archive/project/task'], true],
    ['multiple', ['#work', '#archive/project'], true],
    ['similar', ['#archives'], false],
    ['hyphen', ['#archive-old/project'], false],
    ['different-root', ['#work/archive'], false],
    ['untagged', [], false],
  ];
  for (const [name, tags, ignored] of cases) {
    const file = add(name, tags);
    assert.equal(scanner.is_filtered(file), ignored, name);
  }
  const yaml = add('yaml', ['archive/project'], true);
  assert.ok(scanner.is_filtered(yaml));
  const expected = cases.filter(c => !c[2]).map(c => c[0] + '.md');
  assert.deepEqual(scanner.get_filtered_list().map(f => f.path), expected);
  assert.equal(scanner.get_filtered_count(), 5);
  scanner.rescan();
  assert.deepEqual(Object.keys(scanner.note_list), expected);
});

test('ignoring a subtag does not hide its parent or sibling subtags', () => {
  const { scanner, add } = fixture();
  scanner.settings.set_ignored_tags(['#archive/project', '#hidden']);
  for (const [tag, ignored] of [
    ['#archive', false], ['#archive/other', false], ['#archive/projects', false],
    ['#archive/project', true], ['#archive/project/task', true], ['#hidden/child', true],
  ]) assert.equal(scanner.is_filtered(add(tag, [tag])), ignored, tag);
});

test('editing tags removes and restores notes without restarting', () => {
  const { scanner, add, caches } = fixture();
  const file = add('editable', ['#work']);
  scanner.rescan();
  assert.ok(scanner.note_list[file.path]);
  caches.set(file.path, { tags: [{ tag: '#archive/project' }] });
  scanner.update_note(file);
  assert.equal(scanner.note_list[file.path], undefined);
  caches.set(file.path, { frontmatter: { tags: ['archives'] } });
  scanner.update_note(file);
  assert.ok(scanner.note_list[file.path]);
  const hidden = add('new-nested', ['#archive/project']);
  scanner.add_note(hidden);
  assert.equal(scanner.note_list[hidden.path], undefined);
});

test('empty ignore list and missing metadata leave notes visible', () => {
  const { scanner, add, caches } = fixture();
  const file = add('note', ['#archive/project']);
  scanner.settings.set_ignored_tags([]);
  assert.equal(scanner.is_filtered(file), false);
  scanner.settings.set_ignored_tags(['#archive']);
  caches.delete(file.path);
  assert.equal(scanner.is_filtered(file), false);
});
