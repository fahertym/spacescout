// spacescout-core/src/treemap.rs
use crate::tree::{Tree, NodeId};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rect {
    pub id: NodeId,
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
    pub name: String,
    pub size: u64,
    pub is_dir: bool,
}

/// Compute treemap layout for the given tree node and its descendants.
/// Uses a simple slice-and-dice algorithm (horizontal/vertical alternating).
///
/// Args:
/// - tree: The tree structure
/// - root: The node to use as the root of the layout
/// - x, y, w, h: Bounding rectangle (normalized 0.0-1.0 coordinates)
/// - min_pixel_area: Minimum area threshold to render a rectangle
///
/// Returns a flat list of rectangles ready for rendering.
pub fn layout_treemap(
    tree: &Tree,
    root: NodeId,
    x: f32,
    y: f32,
    w: f32,
    h: f32,
    min_pixel_area: f32,
) -> Vec<Rect> {
    let root_node = tree.node(root);
    let total = root_node.size as f32;
    if total <= 0.0 {
        return Vec::new();
    }

    let mut rects = Vec::new();
    layout_children(
        tree,
        root,
        x,
        y,
        w,
        h,
        total,
        &mut rects,
        min_pixel_area,
    );
    rects
}

/// Recursively layout children nodes within the given rectangle.
/// Uses slice-and-dice: alternate between horizontal and vertical splits
/// based on which dimension is larger.
fn layout_children(
    tree: &Tree,
    parent: NodeId,
    x: f32,
    y: f32,
    w: f32,
    h: f32,
    parent_size: f32,
    out: &mut Vec<Rect>,
    min_pixel_area: f32,
) {
    let children: Vec<_> = tree
        .children_of(parent)
        .filter(|n| n.size > 0)
        .collect();

    if children.is_empty() {
        return;
    }

    // Choose horizontal split if width >= height
    let horizontal = w >= h;
    let mut offset = 0.0f32;

    for child in children {
        let frac = (child.size as f32) / parent_size;
        let area = frac * w * h;

        // Skip rectangles that would be too small to see
        if area < min_pixel_area {
            continue;
        }

        let (cx, cy, cw, ch) = if horizontal {
            let cw = w * frac;
            (x + offset, y, cw, h)
        } else {
            let ch = h * frac;
            (x, y + offset, w, ch)
        };

        offset += if horizontal { cw } else { ch };

        let rect = Rect {
            id: child.id,
            x: cx,
            y: cy,
            w: cw,
            h: ch,
            name: child.name.clone(),
            size: child.size,
            is_dir: child.is_dir,
        };
        out.push(rect);

        // Recursively layout directory children
        if child.is_dir && !child.children.is_empty() {
            layout_children(tree, child.id, cx, cy, cw, ch, child.size as f32, out, min_pixel_area);
        }
    }
}
