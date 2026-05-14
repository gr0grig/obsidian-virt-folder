# Settings

Open plugin settings via **Settings > Community plugins > VirtFolder**.

## YAML Properties

### YAML for note's folders

The frontmatter property name used to store parent links.

- **Default**: `Folders`
- **Validation**: Letters (unicode), numbers, minus, underscore, dots
- **Example**: Setting this to `Parents` means the plugin reads/writes:
  ```yaml
  Parents:
    - "[[SomeNote]]"
  ```

Changing this rescans the entire vault with the new property name.

### YAML for note's title

The frontmatter property used as the display title in the tree and commands.

- **Default**: empty (uses filename)
- **Validation**: Same as above, or empty
- **Example**: Setting this to `title` means a note with:
  ```yaml
  title: "My Custom Name"
  ```
  displays as "My Custom Name" instead of the filename.

If the property value is an array, the first string element is used.

### YAML for note's icon

The frontmatter property used to store emoji icons.

- **Default**: `vf_icon`
- **Validation**: Same as above

## Display

### Use title in commands

When enabled, command modals (file selectors) display note titles instead of filenames.

- **Default**: Off

### Sorting

Controls the sort order of children within each parent node.

- **Default**: `file_name`
- **Options**:
  - `file_name` — Alphabetical by filename
  - `note_title` — Alphabetical by display title
  - `creation_time` — By file creation date
  - `modification_time` — By last modification date

Pinned notes always appear first, regardless of sort mode.

### Reverse sort order

Reverses the selected sort order.

- **Default**: Off

## Filtering

### List of ignored paths

Notes within these paths are completely excluded from the tree. Enter one path per line. Each line is matched as a prefix.

- **Default**: empty
- **Example**:
  ```
  Templates/
  Archive/old
  ```
  This hides all notes in `Templates/` and any path starting with `Archive/old`.

### List of ignored tags

Notes with any of these tags are hidden from the entire tree — including root notes, sub-notes, and orphans. Enter one tag per line. The `#` prefix is optional.

- **Default**: empty
- **Example**:
  ```
  fleeting
  #daily
  ```
  This hides all notes tagged with `#fleeting` or `#daily`.

Tags are matched against both inline tags in the note body and YAML frontmatter tags.

### Ignored files

A read-only counter showing how many files are currently excluded by path and tag filters. This updates in real time as you modify the filter lists.

## Link Format

### Use [[WikiLinks]] in YAML

Controls the link format written to frontmatter when adding parent links.

- **Default**: On (WikiLinks)
- **On**: `[[NoteName]]`
- **Off**: `[NoteName](NoteName)`

This only affects newly written links. Existing links in either format are always readable.

### Use string for single folder link

When enabled, the folder property is written as a plain string instead of a YAML list when a note has only one parent.

- **Default**: Off
- **Off** (list format):
  ```yaml
  Folders:
    - "[[Parent]]"
  ```
- **On** (string format):
  ```yaml
  Folders: "[[Parent]]"
  ```

When a second parent is added, the property automatically converts to a list. When a parent is removed leaving one, it converts back to a string. This is useful for Dataview/Base queries where you want a consistent string type.

## Behavior

### Confirm before deleting

Shows a confirmation dialog before deleting notes from the tree.

- **Default**: On

When enabled, both "Delete note" and "Delete with children" actions require confirmation. When disabled, notes are deleted immediately (moved to trash).

### Auto reveal active file

Automatically expands the tree and scrolls to show the currently open file whenever you switch notes.

- **Default**: Off

When enabled, opening any markdown file will trigger the tree to navigate to and highlight that file. This is equivalent to manually running the **Reveal file** command each time you open a note.

### Expose frontmatter as data attributes

When enabled, all frontmatter properties of each note are added as `data-*` HTML attributes on tree items. This allows styling notes with CSS snippets based on any frontmatter property.

- **Default**: Off

For example, a note with:

```yaml
dg-published: true
status: draft
tags: [important, review]
```

renders its tree item with attributes `data-dg-published="true"`, `data-status="draft"`, `data-tags="important,review"`.

You can then create a CSS snippet in Obsidian to style matching items:

```css
.tree-item-self[data-dg-published="true"] {
    border-left: 3px solid green;
}
.tree-item-self[data-status="draft"] {
    opacity: 0.6;
}
```

Property names are lowercased. Array values are joined with commas. Objects and the internal `position` key are excluded.

## Tag Highlights

Configure color-coded backgrounds for notes based on their tags. This provides quick visual cues when scanning the tree — similar to syntax highlighting when reading code.

### Adding a tag highlight

1. Type a tag name in the input field (e.g., `#important` or `important` — the `#` is added automatically)
2. Press **Enter** to add it

### Configuring highlights

Each tag entry has:

- **Color picker** — choose the highlight color
- **Opacity slider** — set intensity from 5% to 100% (step: 5%)
- **Delete button** (trash icon) — remove the highlight

When a note has multiple matching tags, the first match in the list wins (order = priority). The highlight is hidden on the currently active note so the active-note indicator remains visible.
