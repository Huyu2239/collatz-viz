import { useRef, useEffect, useCallback, useMemo } from "react";
import type { LayoutResult } from "../collatz/layout";

const COLORS = {
  bg: "#111111",
  trunkEdge: "#a08050",
  trunkNode: "#c9a96e",
  branchEdge: "#3a7e99",
  branchNode: "#4a9ebb",
  leafEdge: "#5ea068",
  leafNode: "#7ec488",
  label: "#999999",
};

const PADDING = 40;

type Props = {
  layout: LayoutResult;
};

export default function Canvas({ layout }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    offsetX: PADDING,
    offsetY: PADDING,
    scale: 1,
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  const worldBounds = useMemo(() => {
    let maxX = 0,
      maxY = 0;
    for (const node of layout.nodes) {
      if (node.x > maxX) maxX = node.x;
      if (node.y > maxY) maxY = node.y;
    }
    return { maxX, maxY };
  }, [layout]);
  const boundsRef = useRef(worldBounds);
  boundsRef.current = worldBounds;

  const clampOffset = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;
    const { maxX, maxY } = boundsRef.current;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    const maxOX = PADDING;
    const minOX = Math.min(PADDING, w - PADDING - maxX * s.scale);
    s.offsetX = Math.max(minOX, Math.min(maxOX, s.offsetX));

    const maxOY = PADDING;
    const minOY = Math.min(PADDING, h - PADDING - maxY * s.scale);
    s.offsetY = Math.max(minOY, Math.min(maxOY, s.offsetY));
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    clampOffset();

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    const { offsetX, offsetY, scale } = stateRef.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const viewLeft = -offsetX / scale;
    const viewTop = -offsetY / scale;
    const viewRight = (w - offsetX) / scale;
    const viewBottom = (h - offsetY) / scale;

    // Draw edges
    ctx.lineWidth = 2 / scale;
    for (const edge of layout.edges) {
      const minX = Math.min(edge.from.x, edge.to.x);
      const maxX = Math.max(edge.from.x, edge.to.x);
      const minY = Math.min(edge.from.y, edge.to.y);
      const maxY = Math.max(edge.from.y, edge.to.y);
      if (
        maxX < viewLeft ||
        minX > viewRight ||
        maxY < viewTop ||
        minY > viewBottom
      )
        continue;

      ctx.strokeStyle = edge.isTrunk
        ? COLORS.trunkEdge
        : edge.isLeaf
          ? COLORS.leafEdge
          : COLORS.branchEdge;
      ctx.beginPath();
      ctx.moveTo(edge.from.x, edge.from.y);
      ctx.lineTo(edge.to.x, edge.to.y);
      ctx.stroke();
    }

    // Draw nodes
    const nodeRadius = Math.max(3, 5 / scale);
    for (const node of layout.nodes) {
      if (
        node.x < viewLeft - nodeRadius ||
        node.x > viewRight + nodeRadius ||
        node.y < viewTop - nodeRadius ||
        node.y > viewBottom + nodeRadius
      )
        continue;

      ctx.fillStyle = node.isTrunk
        ? COLORS.trunkNode
        : node.isLeaf
          ? COLORS.leafNode
          : COLORS.branchNode;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw labels — progressive visibility by node importance
    if (scale > 0.7) {
      ctx.fillStyle = COLORS.label;
      const fontSize = Math.max(10, 12 / scale);
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const labelOffset = nodeRadius + 4;
      for (const node of layout.nodes) {
        if (scale <= 1.5 && !node.hasOddChild) continue;
        if (scale <= 3 && !node.hasOddChild && !node.isOddChild) continue;
        if (
          node.x < viewLeft - 60 ||
          node.x > viewRight + 10 ||
          node.y < viewTop - 10 ||
          node.y > viewBottom + 10
        )
          continue;
        ctx.fillText(String(node.value), node.x - labelOffset, node.y);
      }
    }

    ctx.restore();
  }, [layout, clampOffset]);

  // Resize canvas with devicePixelRatio support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight - 44; // header height
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      draw();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Pan + zoom handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      stateRef.current.dragging = true;
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!stateRef.current.dragging) return;
      stateRef.current.offsetX += e.clientX - stateRef.current.lastX;
      stateRef.current.offsetY += e.clientY - stateRef.current.lastY;
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
      draw();
    };

    const onMouseUp = () => {
      stateRef.current.dragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const { offsetX, offsetY, scale } = stateRef.current;
        const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const newScale = Math.min(Math.max(scale * zoomFactor, 0.01), 20);

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        stateRef.current.offsetX =
          mouseX - (mouseX - offsetX) * (newScale / scale);
        stateRef.current.offsetY =
          mouseY - (mouseY - offsetY) * (newScale / scale);
        stateRef.current.scale = newScale;
      } else {
        stateRef.current.offsetX -= e.deltaX;
        stateRef.current.offsetY -= e.deltaY;
      }

      draw();
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", cursor: "grab", background: COLORS.bg }}
    />
  );
}
