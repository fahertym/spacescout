# SpaceScout

A cross-platform disk treemap explorer built with Rust, Tauri, and React. Visualize disk usage with an interactive, live-updating treemap similar to SpaceSniffer.

## Architecture

```
spacescout/
├── spacescout-core/        # Core library (scanning + treemap layout)
│   ├── src/
│   │   ├── tree.rs         # Tree data structure
│   │   ├── scanner.rs      # Filesystem scanner
│   │   └── treemap.rs      # Treemap layout algorithm
│   └── Cargo.toml
├── spacescout-app/         # Tauri application
│   ├── src-tauri/          # Rust backend
│   │   ├── src/
│   │   │   ├── main.rs     # Entry point
│   │   │   ├── lib.rs      # Library setup
│   │   │   ├── commands.rs # Tauri commands
│   │   │   └── platform.rs # Platform-specific code
│   │   └── Cargo.toml
│   └── ui/                 # React frontend
│       ├── src/
│       │   ├── App.tsx
│       │   ├── TreemapCanvas.tsx
│       │   ├── Toolbar.tsx
│       │   ├── Breadcrumb.tsx
│       │   └── types.ts
│       └── package.json
└── Cargo.toml              # Workspace manifest
```

## Features

- **Recursive directory scanning** with configurable file size filters
- **Live scan progress** with real-time file/dir counts, error tracking, and current path display
- **Interactive treemap visualization** using HTML5 Canvas
- **Enhanced tooltips** showing full path, size, percentage of total, and interaction hints
- **Click to zoom** into directories with breadcrumb navigation
- **Keyboard shortcuts** (Backspace/Escape to zoom out to parent)
- **Right-click to open** files/folders in system file manager
- **Auto-loads home directory** as default scan path
- **Cross-platform** support (Windows, Linux, macOS)
- **Dark theme** by default
- **Async scanning** to keep UI responsive

## Prerequisites

### Linux

```bash
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev
```

### macOS

Xcode Command Line Tools should be sufficient.

### Windows

No additional dependencies required.

### All Platforms

- Rust (latest stable)
- Node.js 18+
- npm or pnpm

## Development Setup

1. **Install frontend dependencies:**

```bash
cd spacescout-app/ui
npm install
```

2. **Run in development mode:**

```bash
# From spacescout-app/ui directory
npm run dev
```

Then in another terminal:

```bash
# From spacescout-app/src-tauri directory
cargo tauri dev
```

Or use the integrated command from the workspace root:

```bash
cd spacescout-app/ui
npm run dev
```

## Building for Production

```bash
cd spacescout-app/ui
npm run build

cd ../src-tauri
cargo tauri build
```

The built application will be in `spacescout-app/src-tauri/target/release/bundle/`.

## Usage

1. Launch SpaceScout (defaults to your home directory)
2. Optionally modify the path to scan (e.g., `/home/user` or `C:\Users\YourName`)
3. Optionally set a minimum file size filter (in KB)
4. Click "Scan" to start scanning
5. Watch live progress updates showing files, directories, errors, and current path
6. Interact with the treemap:
   - **Hover** to see full path, size, and percentage of total
   - **Left-click** on a directory to zoom in
   - **Right-click** to open in system file manager
   - **Backspace** or **Escape** to zoom out to parent directory
   - **Click breadcrumbs** at the top to jump to any level in the hierarchy

## Implementation Details

### Core Library (spacescout-core)

Independent of UI, can be used for:
- CLI tools
- Testing
- Alternative frontends

**Scanner:**
- Recursive filesystem traversal with progress callbacks
- Respects file size filters
- Graceful error handling (permission denied, etc.)
- Does not follow symlinks by default
- Progress reporting throttled to every 100 dirs or 1000 files

**Tree Structure:**
- Flat `Vec<Node>` indexed by `NodeId`
- Parent/child references via IDs
- O(1) node access

**Treemap Layout:**
- Simple slice-and-dice algorithm
- Alternates horizontal/vertical splits
- Can be upgraded to squarified layout later

### Tauri Backend

**Commands:**
- `start_scan`: Initiates async scan in background with progress channel
- `set_zoom`: Recomputes layout for zoomed node and emits updates
- `open_in_file_manager`: Platform-specific file reveal (Windows Explorer, macOS Finder, Linux file managers)
- `get_breadcrumbs`: Returns path from root to current zoom node
- `get_home_dir`: Returns user's home directory path
- `get_parent_node`: Returns parent node ID for zoom-out navigation

**Events:**
- `treemap_update`: Sends layout rectangles to frontend with full path info
- `breadcrumbs_update`: Sends breadcrumb trail for navigation UI
- `scan_progress`: Real-time updates during scanning (files, dirs, errors, current path)

### React Frontend

**TreemapCanvas:**
- Canvas-based rendering for performance
- Color generation from path hash (HSL-based)
- Hover detection with enhanced tooltip (path, size, percentage, hints)
- Left-click to zoom into directories
- Right-click to open in file manager

**Toolbar:**
- Path input (auto-populated with home directory)
- Minimum file size filter (in KB)
- Scan button with loading state
- Live progress display (file count, dir count, error count, current path)

**Breadcrumb:**
- Clickable navigation trail from root to current zoom level
- Auto-updates when zoom changes
- Allows jumping to any ancestor directory

**App:**
- Keyboard shortcut handler (Backspace/Escape for zoom-out)
- Window resize handling
- Event listener management

## Roadmap

Future enhancements:

- [ ] Squarified treemap layout (currently using slice-and-dice)
- [ ] Better color schemes and customization options
- [ ] Native folder selection dialog
- [ ] Scan cancellation support
- [ ] Export/save treemap data
- [ ] Multi-drive scanning
- [ ] Search/filter by name or extension
- [ ] File type breakdown statistics
- [ ] Configurable progress update throttling

## License

MIT
