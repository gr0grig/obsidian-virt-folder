# Getting Started

## Installation

### From Obsidian Community Plugins

1. Open **Settings** > **Community plugins**
2. Click **Browse** and search for "VirtFolder"
3. Click **Install**, then **Enable**

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/gr0grig/obsidian-virt-folder/releases)
2. Create a folder `virt-folder` inside your vault's `.obsidian/plugins/` directory
3. Place the downloaded files into that folder
4. Enable the plugin in **Settings** > **Community plugins**

## First Steps

### 1. Open the Tree View

Run the command **VirtFolder: Show tree** or click the folder-tree icon in the left ribbon. An empty tree will appear with just a "ROOT" node.

### 2. Create Your First Hierarchy

Open any note and add a `Folders` property to its YAML frontmatter pointing to another note:

```yaml
---
Folders:
  - "[[MyParentNote]]"
---
```

The note will now appear as a child of `MyParentNote` in the tree. `MyParentNote` becomes a root note (visible at the top level).

### 3. Use Commands Instead of Manual Editing

Instead of editing YAML by hand, use the built-in commands:

1. Open a note you want to organize
2. Run **VirtFolder: Add folder** (or use the hotkey)
3. Select the parent note from the fuzzy search modal
4. The link is added automatically to the frontmatter

### 4. Build Your Structure

Repeat for other notes. The tree updates in real time as you add or modify frontmatter links. You can also:

- **Drag and drop** notes in the tree to reorganize
- **Right-click** on a tree item to create child notes
- **Pin** important notes so they appear first

## Basic Concepts

### The Folders Property

By default, VirtFolder uses a YAML property called `Folders` to store parent links. You can change this name in settings.

A note with this frontmatter:

```yaml
---
Folders:
  - "[[Science]]"
  - "[[Favorites]]"
---
```

will appear as a child under both `Science` and `Favorites` in the tree.

### Note Categories

After scanning your vault, every markdown note falls into one of three categories:

- **Root notes** — have children but no parents. These are the top-level entries of your tree.
- **Sub-notes** — have at least one parent. These appear nested in the tree.
- **Orphans** — have no parents and no children. These are collected in a collapsible "Orphans" section at the bottom of the tree.

### Virtual, Not Physical

VirtFolder does not move files on disk. The hierarchy exists only in YAML frontmatter. Your vault's file structure remains unchanged. This means:

- Notes can have multiple parents
- The same note can appear in different parts of the tree
- Reorganizing the tree only changes frontmatter, not file locations

## What's Next

- [Tree View](tree-view.md) — Learn about navigation, drag & drop, and context menus
- [Commands](commands.md) — See all available keyboard commands
- [Settings](settings.md) — Customize the plugin behavior
