// spacescout-core/src/scanner.rs
use crate::tree::{Tree, NodeId};
use std::{
    fs,
    path::{Path, PathBuf},
};

#[derive(Debug, Clone)]
pub struct ScanConfig {
    pub min_file_size_bytes: u64,
    pub follow_symlinks: bool, // v1: ignore, but keep for future
}

impl Default for ScanConfig {
    fn default() -> Self {
        Self {
            min_file_size_bytes: 0,
            follow_symlinks: false,
        }
    }
}

#[derive(Debug, Clone)]
pub struct ScanStats {
    pub files: u64,
    pub dirs: u64,
    pub errors: u64,
}

/// Scan a directory tree starting at the given path.
/// Returns the complete tree and statistics about the scan.
pub fn scan_path(root_path: PathBuf, config: &ScanConfig) -> (Tree, ScanStats) {
    let mut tree = Tree::new_root(root_path.clone());
    let mut stats = ScanStats {
        files: 0,
        dirs: 1,
        errors: 0,
    };

    let root_id = tree.root;
    let total_size = scan_dir_recursive(&root_path, root_id, &mut tree, &mut stats, config);
    tree.node_mut(root_id).size = total_size;

    (tree, stats)
}

/// Recursively scan a directory and build the tree structure.
/// Returns the total size of all files in this directory and subdirectories.
fn scan_dir_recursive(
    path: &Path,
    parent_id: NodeId,
    tree: &mut Tree,
    stats: &mut ScanStats,
    config: &ScanConfig,
) -> u64 {
    let read_dir = match fs::read_dir(path) {
        Ok(rd) => rd,
        Err(_) => {
            stats.errors += 1;
            return 0;
        }
    };

    let mut total = 0u64;

    for entry_res in read_dir {
        let entry = match entry_res {
            Ok(e) => e,
            Err(_) => {
                stats.errors += 1;
                continue;
            }
        };

        let file_type = match entry.file_type() {
            Ok(ft) => ft,
            Err(_) => {
                stats.errors += 1;
                continue;
            }
        };

        let entry_path = entry.path();
        let name = entry
            .file_name()
            .to_string_lossy()
            .into_owned();

        if file_type.is_dir() {
            // Recursively scan subdirectory
            let child_id = tree.add_child(parent_id, name, entry_path.clone(), true, 0);
            stats.dirs += 1;
            let dir_size = scan_dir_recursive(&entry_path, child_id, tree, stats, config);
            tree.node_mut(child_id).size = dir_size;
            total += dir_size;
        } else if file_type.is_file() {
            // Add file node
            let size = fs::metadata(&entry_path)
                .map(|m| m.len())
                .unwrap_or_else(|_| {
                    stats.errors += 1;
                    0
                });

            // Skip files below minimum size threshold
            if size < config.min_file_size_bytes {
                continue;
            }

            tree.add_child(parent_id, name, entry_path, false, size);
            stats.files += 1;
            total += size;
        } else {
            // symlink / special: skip for v1
            continue;
        }
    }

    total
}
