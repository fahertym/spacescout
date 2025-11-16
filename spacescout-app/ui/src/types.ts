export interface NodeId {
  0: number;
}

export interface Rect {
  id: NodeId;
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
  size: number;
  is_dir: boolean;
}

export interface TreemapUpdate {
  rects: Rect[];
}

export interface BreadcrumbItem {
  id: number;
  name: string;
}

export interface BreadcrumbsResponse {
  items: BreadcrumbItem[];
}
