export type CollatzNode = {
  value: number;
  evenChild: CollatzNode | null; // 2n
  oddChild: CollatzNode | null; // (n-1)/3 (conditional)
};

function isPowerOf2(n: number): boolean {
  return (n & (n - 1)) === 0 && n > 0;
}

export function buildTree(max: number): CollatzNode {
  // Trunk extends to the smallest power of 2 exceeding max
  let trunkMax = 1;
  while (trunkMax <= max) trunkMax *= 2;

  const root: CollatzNode = { value: 1, evenChild: null, oddChild: null };
  const nodeMap = new Map<number, CollatzNode>();
  nodeMap.set(1, root);

  const queue: CollatzNode[] = [root];

  while (queue.length > 0) {
    const node = queue.shift()!;
    const n = node.value;

    // Even child: trunk nodes can extend to trunkMax, others limited to max
    const evenLimit = isPowerOf2(n) ? trunkMax : max;
    const even = 2 * n;
    if (even <= evenLimit && !nodeMap.has(even)) {
      const child: CollatzNode = { value: even, evenChild: null, oddChild: null };
      node.evenChild = child;
      nodeMap.set(even, child);
      queue.push(child);
    }

    // Odd child: only from nodes within max (don't branch from extended trunk)
    if (n <= max && (n - 1) % 3 === 0) {
      const odd = (n - 1) / 3;
      if (odd > 1 && odd % 2 === 1 && odd <= max && !nodeMap.has(odd)) {
        const child: CollatzNode = { value: odd, evenChild: null, oddChild: null };
        node.oddChild = child;
        nodeMap.set(odd, child);
        queue.push(child);
      }
    }
  }

  return root;
}
