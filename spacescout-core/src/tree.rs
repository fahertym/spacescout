// spacescout-core/src/tree.rs
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Copy, Clone, Debug, Eq, PartialEq, Hash, Serialize, Deserialize)]
pub struct NodeId(pub u32);
// u32 is fine for personal use; upgrade to u64 if you want "millions of nodes" safety.

#[derive(Debug, Clone)]
pub struct Node {
    pub id: NodeId,
    pub name: String,
    pub path: PathBuf,
    pub size: u64,
    pub is_dir: bool,
    pub parent: Option<NodeId>,
    pub children: Vec<NodeId>,
}

#[derive(Debug)]
pub struct Tree {
    pub root: NodeId,
    pub nodes: Vec<Node>,
}

impl Tree {
    /// Create a new tree with a root node at the given path
    pub fn new_root(path: PathBuf) -> Self {
        let name = path
            .file_name()
            .and_then(|s| s.to_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| path.to_string_lossy().into_owned());

        let root = Node {
            id: NodeId(0),
            name,
            path,
            size: 0,
            is_dir: true,
            parent: None,
            children: Vec::new(),
        };

        Self {
            root: NodeId(0),
            nodes: vec![root],
        }
    }

    /// Add a child node to the specified parent
    pub fn add_child(
        &mut self,
        parent: NodeId,
        name: String,
        path: PathBuf,
        is_dir: bool,
        size: u64,
    ) -> NodeId {
        let id = NodeId(self.nodes.len() as u32);
        let node = Node {
            id,
            name,
            path,
            size,
            is_dir,
            parent: Some(parent),
            children: Vec::new(),
        };

        self.nodes.push(node);
        self.nodes[parent.0 as usize].children.push(id);
        id
    }

    /// Get immutable reference to a node
    pub fn node(&self, id: NodeId) -> &Node {
        &self.nodes[id.0 as usize]
    }

    /// Get mutable reference to a node
    pub fn node_mut(&mut self, id: NodeId) -> &mut Node {
        &mut self.nodes[id.0 as usize]
    }

    /// Iterator over a node's children
    pub fn children_of(&self, id: NodeId) -> impl Iterator<Item = &Node> {
        self.nodes[id.0 as usize]
            .children
            .iter()
            .map(|cid| &self.nodes[cid.0 as usize])
    }
}
