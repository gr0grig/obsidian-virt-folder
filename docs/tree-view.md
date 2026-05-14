# Tree View

The tree view is VirtFolder's main interface — a collapsible sidebar panel that displays your note hierarchy.

## Opening the Tree

- Run the command **VirtFolder: Show tree**
- Or click the folder-tree icon in the left ribbon

The tree appears in the left sidebar and persists across sessions.

## Tree Structure

The tree has two top-level sections:

### ROOT

Contains all **root notes** — notes that have children but no parents. These form the entry points of your hierarchy. Each root note can be expanded to reveal its children, which can themselves have children, forming an unlimited depth tree.

### Orphans

Contains all **orphan notes** — notes with no parents and no children. This section only appears when orphans exist. It is collapsible and starts collapsed.

## Navigation

### Click Behavior

| Action | Result |
|--------|--------|
| **Click** on a note | Opens the note and toggles expand/collapse |
| **Shift + Click** | Opens the note in the current tab |
| **Ctrl/Cmd + Click** | Opens the note in a new tab |

### Keyboard Navigation

Use the navigation commands (assignable to hotkeys):

- **Navigate to parent** — jump to the parent note
- **Navigate to next/previous sibling** — cycle through siblings
- **Navigate to first child** — jump into children
- **Reveal file** — find and highlight the active note in the tree

See [Commands](commands.md) for the full list.

### Auto-Reveal

When enabled in [Settings](settings.md), the tree automatically expands and scrolls to show the currently open file whenever you switch notes.

## Expanding and Collapsing

- Click the **triangle icon** to expand/collapse a note's children
- Clicking the note title also toggles expand/collapse
- The tree remembers collapse state during the session
- When revealing a file, all parent nodes along the path are expanded automatically

## Child Counter

Notes with children display a counter badge showing the number of direct children. This is visible even when the note is collapsed.

## Active Note Highlight

The currently open note is highlighted with a distinct background color in the tree, making it easy to see your position in the hierarchy.

## Drag and Drop

You can reorganize notes by dragging them within the tree.

### How to Drag

1. Click and hold on any sub-note
2. Drag it over another note or the ROOT node
3. Release to drop

### Drop Targets

- **Any sub-note** — the dragged note becomes a child of the target
- **ROOT** — the dragged note's parent link is removed (it becomes a root note or orphan)

### Safety

- You cannot drop a note onto itself
- You cannot drop a note onto its own descendant (prevents circular references)
- Drop targets highlight with a visual indicator

### What Happens

When you drop note A onto note B:
1. A's old parent link is removed from its frontmatter
2. A new link to B is added to A's frontmatter
3. The tree updates immediately

### Reordering (Custom Sort)

When the sort mode is set to `custom`, dragging a note onto a **sibling** (a note with the same parent) reorders it instead of moving it to a new parent:

- Drop on the **top half** of a sibling — the note is inserted **before** it
- Drop on the **bottom half** — the note is inserted **after** it
- A thin line indicator shows the insertion point during drag

Dragging onto a non-sibling still performs a move (changes parent), even in custom sort mode.

The custom order is stored in plugin data and persists across sessions. New notes added to a folder appear at the end. Renaming a note preserves its position.

## Context Menu

Right-click on any tree item to access context actions.

### ROOT Context Menu

| Action | Description |
|--------|-------------|
| **Create note** | Creates a new note as a child of ROOT (at the top level) |
| **Create unique note** | Creates a note with auto-generated name (requires [Unique Note Creator](https://github.com/alanhamlett/obsidian-unique-note-creator-plugin) plugin) |

### Note Context Menu

| Action | Description |
|--------|-------------|
| **Create note** | Creates a new child note under this note |
| **Create unique note** | Creates a child note with auto-generated name |
| **Manage icon** | Opens the emoji picker to set a visual icon |
| **Pin note** / **Unpin note** | Toggles pin status |
| **Delete note** | Moves the note to trash (with optional confirmation) |
| **Delete with children** | Recursively deletes the note and all its descendants (only shown if note has children) |

### Orphans Section

The Orphans header has no context menu actions.

## Icons

Notes can display a custom emoji icon next to their title. Icons are set via:

- The **Manage icon** command
- The tree context menu > **Manage icon**
- The file explorer context menu > **Manage icon**

### Emoji Picker

The picker provides:

- **8 categories**: Smileys, People, Animals, Food, Travel, Activities, Objects, Symbols
- **Search**: Real-time fuzzy search by emoji name
- **Tab navigation**: Click category icons to filter
- **Remove button**: Clears the current icon

## Pinned Notes

Pinned notes always appear at the top of their sibling list, before unpinned notes. Within pinned notes, the selected sort order still applies.

Toggle pinning via:
- The **Pin note** command
- The tree context menu > **Pin note** / **Unpin note**
- The file explorer context menu > **Pin note** / **Unpin note**

Pinned notes display a pin indicator (📌) next to their title.

## Tag Highlighting

Notes can be visually highlighted in the tree based on their tags. Configure tag-to-color mappings in [Settings > Tag Highlights](settings.md#tag-highlights).

Each highlighted note gets a colored background in the tree. This is useful for workflows like spaced repetition (e.g., color-coding `#fleeting`, `#process`, `#review` notes) or distinguishing note types (`#atomic` vs `#literature`).

The highlight is hidden on the currently active note so the active-note style takes precedence.

## CSS Styling with Data Attributes

When the **Expose frontmatter as data attributes** setting is enabled, you can style tree items using CSS based on any frontmatter property. See [Settings](settings.md#expose-frontmatter-as-data-attributes) for details and examples.

## Multi-Parent Notes

A note can have multiple parents and will appear in multiple places in the tree. When you use **Reveal file**, the plugin cycles through all possible paths to the note on repeated calls.

When navigating between siblings with the **Navigate to next/previous sibling** commands, the plugin stays within the currently revealed parent branch rather than switching to a different parent.

## Sorting

Children within each parent are sorted according to the setting in **Settings > Sorting**:

| Sort Mode | Description |
|-----------|-------------|
| `file_name` | Alphabetical by filename (default) |
| `note_title` | Alphabetical by display title |
| `creation_time` | By file creation date |
| `modification_time` | By last modification date |
| `custom` | Manual order via drag-and-drop reordering |

The sort order can be reversed with the **Reverse sort order** toggle (does not apply to `custom` mode).

Pinned notes always appear first, regardless of sort mode.

In `custom` mode, the order is set per folder by dragging notes onto siblings. See [Drag and Drop > Reordering](#reordering-custom-sort) for details.

## Scroll Behavior

When the tree scrolls to reveal a note (via auto-reveal or the Reveal command):

- If the note fits within the viewport, it is centered vertically
- If the note (with its expanded children) is taller than the viewport, it is aligned to the top

This ensures the target note is always visible after navigation.
