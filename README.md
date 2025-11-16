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
│       │   └── Toolbar.tsx
│       └── package.json
└── Cargo.toml              # Workspace manifest
```

## Features

- **Recursive directory scanning** with configurable file size filters
- **Interactive treemap visualization** using HTML5 Canvas
- **Hover tooltips** showing path, size, and type
- **Click to zoom** into directories
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

1. Launch SpaceScout
2. Enter a path to scan (e.g., `/home/user` or `C:\Users\YourName`)
3. Optionally set a minimum file size filter (in KB)
4. Click "Scan"
5. Interact with the treemap:
   - **Hover** to see file/folder details
   - **Click** on a directory to zoom in
   - **Right-click** to open in file manager (planned)

## Implementation Details

### Core Library (spacescout-core)

Independent of UI, can be used for:
- CLI tools
- Testing
- Alternative frontends

**Scanner:**
- Synchronous recursive filesystem traversal
- Respects file size filters
- Graceful error handling (permission denied, etc.)
- Does not follow symlinks by default

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
- `start_scan`: Initiates async scan in background
- `set_zoom`: Recomputes layout for zoomed node
- `open_in_file_manager`: Platform-specific file reveal

**Events:**
- `treemap_update`: Sends layout rectangles to frontend

### React Frontend

**TreemapCanvas:**
- Canvas-based rendering for performance
- Color generation from path hash
- Hover detection with tooltip
- Click handling for zoom

**Toolbar:**
- Path input
- File size filter slider
- Scan trigger

## Roadmap

- [ ] Squarified treemap layout
- [ ] Back/breadcrumb navigation
- [ ] Live scanning progress updates
- [ ] Better color schemes
- [ ] Folder selection dialog
- [ ] Scan cancellation
- [ ] Export/save treemap data
- [ ] Multi-drive scanning
- [ ] Search/filter by name

## License

MIT
