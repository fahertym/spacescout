use spacescout_core::{scan_path, ScanConfig, layout_treemap, NodeId, Tree};
use serde::Serialize;
use std::path::PathBuf;
use tauri::State;
use tokio::sync::Mutex;

/// Application state shared across commands
#[derive(Default)]
pub struct AppState {
    pub tree: Option<Tree>,
    pub zoom: NodeId,
}

/// Response payload sent to frontend with treemap layout
#[derive(Serialize, Clone)]
pub struct TreemapUpdate {
    pub rects: Vec<spacescout_core::Rect>,
}

/// Breadcrumb item representing a node in the navigation path
#[derive(Serialize, Clone)]
pub struct BreadcrumbItem {
    pub id: u32,
    pub name: String,
}

/// Response payload with breadcrumb navigation path
#[derive(Serialize, Clone)]
pub struct BreadcrumbsResponse {
    pub items: Vec<BreadcrumbItem>,
}

/// Start scanning a directory or drive
#[tauri::command]
pub async fn start_scan(
    root: String,
    min_size_kb: u64,
    app_state: State<'_, Mutex<AppState>>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let root_path = PathBuf::from(root);
    let config = ScanConfig {
        min_file_size_bytes: min_size_kb * 1024,
        ..Default::default()
    };

    // Spawn blocking task for filesystem scan
    tauri::async_runtime::spawn(async move {
        // Perform scan in blocking context (disk I/O is blocking)
        let (tree, _stats) = tokio::task::spawn_blocking(move || {
            scan_path(root_path, &config)
        })
        .await
        .unwrap();

        let root_id = tree.root;

        // Update application state
        let mut state = app_state.lock().await;
        state.zoom = root_id;
        state.tree = Some(tree);

        // Compute initial layout and emit to frontend
        if let Some(tree_ref) = state.tree.as_ref() {
            let rects = layout_treemap(tree_ref, root_id, 0.0, 0.0, 1.0, 1.0, 0.0001);
            let update = TreemapUpdate { rects };
            let _ = app_handle.emit("treemap_update", update);

            // Emit initial breadcrumbs
            let breadcrumbs = compute_breadcrumbs(tree_ref, root_id);
            let breadcrumb_response = BreadcrumbsResponse { items: breadcrumbs };
            let _ = app_handle.emit("breadcrumbs_update", breadcrumb_response);
        }
    });

    Ok(())
}

/// Helper function to compute breadcrumbs for a given node
fn compute_breadcrumbs(tree: &Tree, zoom_id: NodeId) -> Vec<BreadcrumbItem> {
    let mut breadcrumbs = Vec::new();
    let mut current_id = zoom_id;

    // Walk up from current zoom to root
    loop {
        let node = tree.node(current_id);
        breadcrumbs.push(BreadcrumbItem {
            id: current_id.0,
            name: node.name.clone(),
        });

        if let Some(parent_id) = node.parent {
            current_id = parent_id;
        } else {
            break;
        }
    }

    // Reverse to get root -> current order
    breadcrumbs.reverse();
    breadcrumbs
}

/// Set the zoom level to a specific node
#[tauri::command]
pub async fn set_zoom(
    node_id: u32,
    app_state: State<'_, Mutex<AppState>>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let mut state = app_state.lock().await;

    if let Some(tree) = state.tree.as_ref() {
        let id = NodeId(node_id);

        // Validate node exists
        if (id.0 as usize) < tree.nodes.len() {
            state.zoom = id;

            // Recompute layout for zoomed node
            let rects = layout_treemap(tree, id, 0.0, 0.0, 1.0, 1.0, 0.0001);
            let update = TreemapUpdate { rects };
            let _ = app_handle.emit("treemap_update", update);

            // Emit updated breadcrumbs
            let breadcrumbs = compute_breadcrumbs(tree, id);
            let breadcrumb_response = BreadcrumbsResponse { items: breadcrumbs };
            let _ = app_handle.emit("breadcrumbs_update", breadcrumb_response);

            Ok(())
        } else {
            Err("Invalid node ID".to_string())
        }
    } else {
        Err("No tree loaded".to_string())
    }
}

/// Open a file or directory in the system file manager
#[tauri::command]
pub async fn open_in_file_manager(path: String) -> Result<(), String> {
    let path_buf = PathBuf::from(path);
    crate::platform::reveal_in_file_manager(&path_buf)
        .map_err(|e| format!("Failed to open file manager: {}", e))
}

/// Get breadcrumb navigation path from root to current zoom level
#[tauri::command]
pub async fn get_breadcrumbs(
    app_state: State<'_, Mutex<AppState>>,
) -> Result<BreadcrumbsResponse, String> {
    let state = app_state.lock().await;

    if let Some(tree) = state.tree.as_ref() {
        let breadcrumbs = compute_breadcrumbs(tree, state.zoom);
        Ok(BreadcrumbsResponse { items: breadcrumbs })
    } else {
        Err("No tree loaded".to_string())
    }
}
