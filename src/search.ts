import { App, Component, MarkdownRenderer, TFile } from 'obsidian';
import type { BaseScanner } from './base_scanner';
import type { OneNote } from './onenote';

interface CoreQuery {
    matcher: unknown;
    requiredInputs?: { content?: boolean };
    match(file: TFile, content: string): unknown;
}
type QueryConstructor = new (app: App, query: string, caseSensitive: boolean) => CoreQuery;
let queryConstructor: QueryConstructor | undefined;

// Obsidian does not publish its search parser. Obtain the same matcher used
// by embedded query blocks, without changing the user's Search pane.
export function createCoreQuery(app: App, query: string): CoreQuery {
    if (!queryConstructor) {
        const renderer = MarkdownRenderer as typeof MarkdownRenderer & { postProcess?: (app: App, context: unknown) => void };
        if (!renderer.postProcess) throw new Error('Core search is unavailable in this Obsidian version.');
        const el = document.createElement('div');
        const pre = el.appendChild(document.createElement('pre'));
        const code = pre.appendChild(document.createElement('code'));
        code.className = 'language-query';
        code.textContent = 'path:"__virt_folder_search_probe__"';
        const owner = new Component();
        owner.load();
        try {
            renderer.postProcess(app, {
                docId: 'virt-folder-search', sourcePath: '', frontmatter: {},
                promises: [], containerEl: el, el, displayMode: true,
                getSectionInfo: () => null,
                addChild: (child: Component & { searchQuery?: CoreQuery }) => {
                    owner.addChild(child);
                    const sample = child.searchQuery;
                    if (sample && typeof sample.match === 'function') {
                        queryConstructor = sample.constructor as QueryConstructor;
                    }
                    return child;
                },
            });
        } finally {
            owner.unload();
            el.remove();
        }
        if (!queryConstructor) throw new Error('Core search is unavailable in this Obsidian version.');
    }
    const result = new queryConstructor(app, query, false);
    if (!result.matcher) throw new Error('Enter a valid search query.');
    return result;
}

export async function findMatches(
    app: App, files: TFile[], query: CoreQuery, cancelled: () => boolean,
): Promise<Set<string> | null> {
    const matches = new Set<string>();
    for (let i = 0; i < files.length; i++) {
        if (cancelled()) return null;
        const file = files[i];
        const cache = app.metadataCache as typeof app.metadataCache & { isUserIgnored?: (path: string) => boolean };
        if (cache.isUserIgnored?.(file.path)) continue;
        const content = query.requiredInputs?.content ? await app.vault.cachedRead(file) : '';
        if (cancelled()) return null;
        if (query.match(file, content)) matches.add(file.path);
        if (i % 50 === 49) await new Promise(resolve => setTimeout(resolve, 0));
    }
    return cancelled() ? null : matches;
}

export type SearchTree = Pick<BaseScanner, 'note_list' | 'top_list' | 'orphans_list' | 'settings'>;

// Only matching notes are shown. A match whose parents were filtered out
// becomes a root; the underlying vault graph is never modified.
export function projectSearchTree(base: BaseScanner, matches: Set<string>): SearchTree {
    const note_list: Record<string, OneNote> = {};
    for (const id of matches) {
        const note = base.note_list[id];
        if (!note) continue;
        note_list[id] = Object.assign(Object.create(Object.getPrototypeOf(note)), note, {
            parents: note.parents.filter(parent => matches.has(parent)),
            children: note.children.filter(child => matches.has(child)),
        });
    }
    const roots = Object.keys(note_list).filter(id => note_list[id].parents.length === 0);
    const visited = new Set<string>();
    const visit = (id: string) => {
        const stack = [id];
        while (stack.length) {
            const next = stack.pop()!;
            if (visited.has(next) || !note_list[next]) continue;
            visited.add(next);
            stack.push(...note_list[next].children);
        }
    };
    roots.forEach(visit);
    // Keep matches in parent cycles reachable; Note stops repeated ancestors.
    for (const id of Object.keys(note_list)) {
        if (!visited.has(id)) { roots.push(id); visit(id); }
    }
    return { note_list, top_list: base.l_sort(roots), orphans_list: [], settings: base.settings };
}
