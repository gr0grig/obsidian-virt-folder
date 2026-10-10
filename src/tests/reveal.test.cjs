const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const esbuild = require('esbuild');
const esbuildSvelte = require('esbuild-svelte');
const sveltePreprocess = require('svelte-preprocess');

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'CustomEvent', 'getComputedStyle']) {
  global[key] = dom.window[key];
}
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'virt-folder-test-'));
after(() => { dom.window.close(); fs.rmSync(temp, { recursive: true, force: true }); });

let runtime;
async function loadRuntime() {
  if (runtime) return runtime;
  const outfile = path.join(temp, 'tree.cjs');
  await esbuild.build({
    stdin: {
      contents: `export { default as Component } from './components/Component.svelte';
        export { data, plugin, active_id } from './components/stores';
        export { tick } from 'svelte';`,
      resolveDir: path.resolve(__dirname, '..'),
    },
    outfile, bundle: true, format: 'cjs', platform: 'browser',
    plugins: [
      {
        name: 'obsidian-test-stubs',
        setup(build) {
          build.onResolve({ filter: /^(obsidian|settings)$|icon_picker_modal$/ }, args => ({ path: args.path, namespace: 'stub' }));
          build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: `
            export function getIcon() { return document.createElement('span'); }
            export class Notice {} export class Menu {} export class VF_IconPickerModal {}
            export class Component {} export class MarkdownRenderer {}
            export const SortTypes = { custom: 'custom' };` }));
        },
      },
      esbuildSvelte({ preprocess: sveltePreprocess(), compilerOptions: { css: 'injected' } }),
    ],
    logLevel: 'silent',
  });
  runtime = require(outfile);
  return runtime;
}

async function fixture() {
  const r = await loadRuntime();
  const host = document.createElement('div');
  host.className = 'view-content';
  document.body.append(host);
  const model = { top_list: ['Parent', 'Move'], orphans_list: [], settings: {}, note_list: {}, l_sort: ids => [...ids].sort() };
  for (const [id, children] of Object.entries({ Parent: ['Deep'], Deep: [], Move: ['Child'], Child: [] })) {
    model.note_list[id] = { title: id, children, parents: [], metadata: {}, count_children() { return this.children.length; } };
  }
  model.note_list.Deep.parents = ['Parent'];
  model.note_list.Child.parents = ['Move'];
  r.plugin.set({ settings: { autoCollapse: true }, app: { workspace: { openLinkText() {} } } });
  r.data.set(model);
  const component = new r.Component({ target: host });
  await r.tick();
  const visible = title => [...host.querySelectorAll('.tree-item-inner')].some(el => !el.closest('[hidden]') && el.textContent.trim() === title);
  const reveal = async (pathNotes) => {
    await component.focusTo(pathNotes);
    await new Promise(resolve => setTimeout(resolve, 180));
    await r.tick();
  };
  return { r, host, model, component, visible, reveal, destroy() { component.$destroy(); host.remove(); } };
}

test('active root note can move into a deep branch repeatedly with auto-collapse', { timeout: 5000 }, async () => {
  const f = await fixture();
  try {
    await f.reveal(['top_dir', 'Move']);
    assert.ok(f.visible('Child'));
    for (let i = 0; i < 2; i++) {
      f.model.top_list = ['Parent'];
      f.model.note_list.Deep.children = ['Move'];
      f.r.data.set(f.model);
      await f.reveal(['top_dir', 'Parent', 'Deep', 'Move']);
      assert.ok(f.visible('Move'), 'moved note stays visible');
      assert.ok(f.visible('Child'), 'moved branch remains expandable');
      f.model.top_list = ['Parent', 'Move'];
      f.model.note_list.Deep.children = [];
      f.r.data.set(f.model);
      await f.reveal(['top_dir', 'Move']);
      assert.ok(f.visible('Child'), 'returning to root still reveals the branch');
      assert.ok(!f.visible('Deep'), 'other branches collapse');
    }
  } finally { f.destroy(); }
});

test('search shows only matches and clearing restores expanded branches', { timeout: 5000 }, async () => {
  const f = await fixture();
  try {
    await f.reveal(['top_dir', 'Move']);
    f.component.$set({ matches: new Set(['Deep']) });
    await f.r.tick();
    assert.ok(f.visible('Deep'), 'matching child is promoted past its unmatched parent');
    assert.ok(!f.visible('Parent'));
    assert.ok(!f.visible('Move'));
    f.component.$set({ matches: new Set() });
    await f.r.tick();
    assert.ok(!f.visible('Deep'));
    f.component.$set({ matches: null });
    await f.r.tick();
    assert.ok(f.visible('Move'));
    assert.ok(f.visible('Child'), 'previous expansion is preserved');
  } finally { f.destroy(); }
});

test('reveal preserves its path for multiple views', { timeout: 5000 }, async () => {
  const f = await fixture();
  const secondHost = document.createElement('div');
  secondHost.className = 'view-content';
  document.body.append(secondHost);
  const secondView = new f.r.Component({ target: secondHost });
  try {
    const route = ['top_dir', 'Parent', 'Deep'];
    await Promise.all([f.component.focusTo(route), secondView.focusTo(route)]);
    assert.deepEqual(route, ['top_dir', 'Parent', 'Deep']);
    assert.ok(f.visible('Deep'));
    assert.ok([...secondHost.querySelectorAll('.tree-item-inner')].some(el => el.textContent.trim() === 'Deep'));
  } finally { secondView.$destroy(); secondHost.remove(); f.destroy(); }
});

test('new orphan root is available immediately after a data update', { timeout: 5000 }, async () => {
  const f = await fixture();
  try {
    await f.reveal(['top_dir', 'Parent']);
    f.model.note_list.Parent.children = [];
    f.model.orphans_list = ['Deep'];
    f.r.data.set(f.model);
    await f.reveal(['orphan_dir', 'Deep']);
    assert.ok(f.visible('Deep'));
  } finally { f.destroy(); }
});
