import type { CollatzNode } from "./tree";

export type NodePosition = {
  value: number;
  x: number;
  y: number;
  isTrunk: boolean;
  isLeaf: boolean;
  hasOddChild: boolean;
  isOddChild: boolean;
};

export type Edge = {
  from: NodePosition;
  to: NodePosition;
  via: { x: number; y: number } | null;
  isTrunk: boolean;
  isLeaf: boolean;
};

export type LayoutResult = {
  nodes: NodePosition[];
  edges: Edge[];
};

const H_SPACING = 80;
const V_SCALE = 1;
const DIAGONAL_RATIO = 0.3;

function isPowerOf2(n: number): boolean {
  return (n & (n - 1)) === 0 && n > 0;
}

export function computeLayout(root: CollatzNode): LayoutResult {
  const nodes: NodePosition[] = [];
  const edges: Edge[] = [];

  /**
   * DFS: even child first, odd child after.
   * Deeper branches claim lower column numbers → shallow branches' long
   * ×3+1 edges pass above deeper branches' y-range → zero crossings.
   *
   * nextCol: next available column for odd branches at this chain level.
   * Returns: placed NodePosition + updated nextCol after this subtree.
   */
  function layout(
    node: CollatzNode,
    col: number,
    y: number,
    isOddChild: boolean,
    nextCol: number
  ): { pos: NodePosition; nextCol: number } {
    const isTrunk = isPowerOf2(node.value);
    const isLeaf = !node.evenChild && !node.oddChild;
    const hasOddChild = node.oddChild !== null;

    const pos: NodePosition = {
      value: node.value,
      x: col * H_SPACING,
      y,
      isTrunk,
      isLeaf,
      hasOddChild,
      isOddChild,
    };
    nodes.push(pos);

    let available = nextCol;

    // Even child first: recurse down the chain so deeper branches
    // occupy lower column numbers before we place shallower ones.
    if (node.evenChild) {
      const evenY = y + node.value * V_SCALE;
      const { pos: evenPos, nextCol: c } = layout(
        node.evenChild,
        col,
        evenY,
        false,
        available
      );
      available = c;
      edges.push({
        from: pos,
        to: evenPos,
        via: null,
        isTrunk: isTrunk && isPowerOf2(node.evenChild.value),
        isLeaf: false,
      });
    }

    // Odd child after: gets the next available column (higher than all
    // deeper branches), keeping its own sub-branches exclusive from col+1.
    if (node.oddChild) {
      const oddCol = available;
      const oddY = y + node.value * V_SCALE * DIAGONAL_RATIO;
      const { pos: oddPos, nextCol: c } = layout(
        node.oddChild,
        oddCol,
        oddY,
        true,
        oddCol + 1
      );
      available = c;
      edges.push({
        from: pos,
        to: oddPos,
        via: null,
        isTrunk: false,
        isLeaf: oddPos.isLeaf,
      });
    }

    return { pos, nextCol: available };
  }

  layout(root, 0, 0, false, 1);
  return { nodes, edges };
}
