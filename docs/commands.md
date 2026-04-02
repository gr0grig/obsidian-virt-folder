# Commands

All commands are accessible via the command palette (`Ctrl/Cmd + P`) and can be assigned to custom hotkeys in **Settings > Hotkeys**.

## Tree View

| Command | Description |
|---------|-------------|
| **Show tree** | Opens or reveals the VirtFolder tree view in the left sidebar |

## Navigation

| Command | Description |
|---------|-------------|
| **Navigate to parent folder** | Opens the parent note of the currently active file |
| **Navigate to next sibling** | Opens the next sibling note (cycles through siblings in sort order) |
| **Navigate to previous sibling** | Opens the previous sibling note (cycles in reverse) |
| **Navigate to first child** | Opens the first child note of the current note |
| **Reveal file** | Expands the tree to show the active file and scrolls it into view. If the note appears in multiple places, repeated calls cycle through alternative paths |

## Folder Management

| Command | Description |
|---------|-------------|
| **Add folder** | Opens a file selector to choose a parent note. Adds the selected note as a parent of the current file |
| **Move folder** | Two-step process: first select which parent link to replace, then select the new parent note |
| **Delete folder** | Select a parent link to remove from the current note. If the note has only one parent, it becomes an orphan |
| **Add selected files to virtual folder** | Adds files selected in the file explorer as children of a chosen parent folder |

## Note Management

| Command | Description |
|---------|-------------|
| **Manage icon** | Opens the emoji picker to set or remove a visual icon for the current note |
| **Pin note** | Toggles the pin status of the active note. Pinned notes are displayed at the top of their siblings |

## File Selector Modal

When commands open the file selector (Add folder, Move folder, etc.):

- **Fuzzy search** — type to filter notes by name or title
- **Path breadcrumbs** — each result shows its location in the virtual hierarchy
- **Smart sorting** — recently used folders appear first
- **Exclusion** — notes that would create circular references are automatically excluded

## Property Selector Modal

When a command needs you to choose a parent link (Move folder, Delete folder):

- If the note has **no parent links**, a notice is shown
- If the note has **one parent link**, it is selected automatically
- If the note has **multiple parent links**, a selector modal appears
