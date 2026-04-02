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

## Behavior

### Confirm before deleting

Shows a confirmation dialog before deleting notes from the tree.

- **Default**: On

When enabled, both "Delete note" and "Delete with children" actions require confirmation. When disabled, notes are deleted immediately (moved to trash).

### Auto reveal active file

Automatically expands the tree and scrolls to show the currently open file whenever you switch notes.

- **Default**: Off

When enabled, opening any markdown file will trigger the tree to navigate to and highlight that file. This is equivalent to manually running the **Reveal file** command each time you open a note.
