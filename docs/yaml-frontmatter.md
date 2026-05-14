# YAML Frontmatter

VirtFolder uses YAML frontmatter properties to store all note metadata: parent links, icons, pin status, and custom titles. No external database is required — everything lives inside your markdown files.

## Folders Property

The core property (default name: `Folders`) holds an array of links to parent notes.

### WikiLinks Format (default)

```yaml
---
Folders:
  - "[[ParentNote]]"
  - "[[AnotherParent]]"
---
```

WikiLinks with aliases are also supported:

```yaml
---
Folders:
  - "[[ParentNote|My Parent]]"
---
```

### Markdown Links Format

If you disable WikiLinks in settings, the plugin uses standard markdown links:

```yaml
---
Folders:
  - "[ParentNote](ParentNote)"
---
```

### Single vs Array Values

The property value can be either an array or a single string:

```yaml
# Both are valid:
Folders:
  - "[[Parent]]"

Folders: "[[Parent]]"
```

By default, the plugin always writes list format. If you prefer string format for notes with a single parent (e.g., for simpler Dataview queries), enable **Use string for single folder link** in [Settings](settings.md#use-string-for-single-folder-link). The plugin handles both formats correctly when reading, regardless of this setting.

### Self-Reference Protection

If a note references itself as its own parent (e.g., `NoteA` has `Folders: "[[NoteA]]"`), the self-reference is silently ignored. The note will not disappear from the tree.

### Changing the Property Name

The default property name is `Folders`, but you can change it in [Settings](settings.md). The name supports unicode letters, numbers, minus signs, underscores, and dots.

Numbered variants are also recognized (e.g., `Folders.0`, `Folders.1`), which provides compatibility with certain YAML editors.

## Title Property

An optional property that overrides the filename as the display title in the tree.

```yaml
---
title: "My Custom Title"
---
```

- The property name is configurable in settings (leave blank to use filenames)
- If the property is an array, the first string element is used
- If the property is empty or missing, the filename is used as the title

## Icon Property

The `vf_icon` property (configurable) stores an emoji icon for the note.

```yaml
---
vf_icon: "\U0001F4DA"
---
```

Icons are set through the built-in emoji picker (command: **Manage icon**), not by editing YAML manually. The picker provides categorized emoji groups with search.

To remove an icon, open the picker and click "Remove icon".

## Pin Property

The `vf_pinned` property marks a note as pinned. Pinned notes always appear at the top of their sibling list, regardless of the sort order.

```yaml
---
vf_pinned: true
---
```

Toggle pinning with the **Pin note** command or via the tree's right-click context menu.

## Complete Example

A fully annotated note:

```yaml
---
Folders:
  - "[[Science]]"
  - "[[Favorites]]"
title: "Quantum Mechanics Overview"
vf_icon: "\U0001F52C"
vf_pinned: true
---

# Quantum Mechanics

Content of the note...
```

This note:
- Appears under both `Science` and `Favorites` in the tree
- Displays as "Quantum Mechanics Overview" instead of the filename
- Shows a microscope emoji icon
- Is pinned to the top of its siblings

## Front Matter Title Integration

VirtFolder supports the [Front Matter Title](https://github.com/snezhig/obsidian-front-matter-title) plugin. If you already use Front Matter Title to display custom note titles throughout Obsidian, VirtFolder can read the same property.

To set it up:

1. Open **Settings > VirtFolder**
2. Set **YAML for note's title** to the same property that Front Matter Title uses (typically `title`)
3. The tree view will now display the same custom titles

This avoids duplicating title properties — both plugins read from the same frontmatter field.

## Data Persistence

All VirtFolder data is stored in standard YAML frontmatter:

| Property | Purpose | Editable via UI |
|----------|---------|-----------------|
| `Folders` (configurable) | Parent note links | Add/Move/Delete folder commands, drag & drop |
| Title prop (configurable) | Custom display title | Manual YAML editing |
| `vf_icon` (configurable) | Emoji icon | Manage icon command |
| `vf_pinned` | Pin status | Pin note command |

Since all data is in frontmatter, your notes remain fully portable — no plugin lock-in.
