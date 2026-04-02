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

## Multi-Parent Notes

A note can have multiple parents and will appear in multiple places in the tree. When you use **Reveal file**, the plugin cycles through all possible paths to the note on repeated calls.

## Sorting

Children within each parent are sorted according to the setting in **Settings > Sorting**:

| Sort Mode | Description |
|-----------|-------------|
| `file_name` | Alphabetical by filename (default) |
| `note_title` | Alphabetical by display title |
| `creation_time` | By file creation date |
| `modification_time` | By last modification date |

The sort order can be reversed with the **Reverse sort order** toggle.

Pinned notes always appear first, regardless of sort mode.

## Scroll Behavior

When the tree scrolls to reveal a note (via auto-reveal or the Reveal command):

- If the note fits within the viewport, it is centered vertically
- If the note (with its expanded children) is taller than the viewport, it is aligned to the top

This ensures the target note is always visible after navigation.
