# VirtFolder Documentation

VirtFolder is an Obsidian plugin for creating a hierarchical structure inspired by Luhmann's Zettelkasten method. It lets you navigate your knowledge base like a book's table of contents by establishing parent-child relationships between notes using YAML frontmatter.

## Table of Contents

- [Getting Started](getting-started.md) — Installation, first steps, basic concepts
- [Tree View](tree-view.md) — Navigation, drag & drop, context menus, icons, pinning
- [Commands](commands.md) — All keyboard commands and actions
- [YAML Frontmatter](yaml-frontmatter.md) — How notes are linked, link formats, special properties
- [Settings](settings.md) — All configuration options explained

## How It Works

VirtFolder reads a YAML frontmatter property (default: `Folders`) from each markdown note. This property contains links to parent notes, forming a virtual hierarchy — without moving any files on disk.

```yaml
---
Folders:
  - "[[ParentNote]]"
---
```

The plugin displays this hierarchy as a collapsible tree in the left sidebar, where you can navigate, reorganize, create, and delete notes.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Root notes** | Notes that have children but no parents — they appear at the top level of the tree |
| **Orphan notes** | Notes with no parents and no children — collected in a separate "Orphans" section |
| **Sub-notes** | Notes that have at least one parent — they appear nested under their parent(s) |
| **Multi-parent** | A note can have multiple parents, appearing in multiple places in the tree |
| **Pinned notes** | Notes marked as pinned always appear at the top of their siblings |

### Compatibility

- **Obsidian version**: 0.15.0 or higher
- **Platforms**: Desktop and mobile
- **Optional integrations**:
  - [Unique Note Creator](https://github.com/alanhamlett/obsidian-unique-note-creator-plugin) (zk-prefixer) — auto-generated note names
  - [Front Matter Title](https://github.com/snezhig/obsidian-front-matter-title) — display custom titles from frontmatter

## Bugs and Suggestions

Bugs and suggestions for improvement are accepted through [Issues](https://github.com/gr0grig/obsidian-virt-folder/issues).

If the plugin crashes, please include the log from the developer console, which opens with `Ctrl+Shift+I`.
