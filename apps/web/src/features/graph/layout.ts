/**
 * Deterministic force-directed layout for small subgraphs (≤ 150 nodes).
 * Runs once per node/edge set; same input → same positions.
 */
export interface LayoutEdge {
  source: string;
  target: string;
}

export function forceLayout(ids: string[], edges: LayoutEdge[], { width = 1500, height = 1000, iterations = 400, sizes = new Map<string, number>() } = {}): Map<string, { x: number; y: number }> {
  const n = ids.length;
  const index = new Map(ids.map((id, i) => [id, i]));
  const pos = ids.map((_, i) => {
    const angle = (i / Math.max(1, n)) * Math.PI * 2;
    const r = Math.min(width, height) * 0.38 * (0.6 + ((i * 37) % 10) / 25);
    return { x: width / 2 + Math.cos(angle) * r, y: height / 2 + Math.sin(angle) * r };
  });
  const links = edges.map((e) => [index.get(e.source), index.get(e.target)]).filter((l): l is [number, number] => l[0] !== undefined && l[1] !== undefined);
  const ideal = Math.sqrt((width * height) / Math.max(1, n)) * 0.75;

  for (let step = 0; step < iterations; step++) {
    const temp = (1 - step / iterations) * 30 + 0.5;
    const disp = pos.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i].x - pos[j].x;
        const dy = (pos[i].y - pos[j].y) * 1.6;
        const d = Math.max(1, Math.hypot(dx, dy));
        const force = (ideal * ideal) / d;
        disp[i].x += (dx / d) * force;
        disp[i].y += (dy / d) * force;
        disp[j].x -= (dx / d) * force;
        disp[j].y -= (dy / d) * force;
      }
    }
    for (const [a, b] of links) {
      const dx = pos[a].x - pos[b].x;
      const dy = pos[a].y - pos[b].y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const force = (d * d) / ideal;
      disp[a].x -= (dx / d) * force;
      disp[a].y -= (dy / d) * force;
      disp[b].x += (dx / d) * force;
      disp[b].y += (dy / d) * force;
    }
    for (let i = 0; i < n; i++) {
      disp[i].x += (width / 2 - pos[i].x) * 0.02 * ideal;
      disp[i].y += (height / 2 - pos[i].y) * 0.03 * ideal;
      const d = Math.max(1, Math.hypot(disp[i].x, disp[i].y));
      pos[i].x += (disp[i].x / d) * Math.min(d, temp);
      pos[i].y += (disp[i].y / d) * Math.min(d, temp);
    }
  }
  // Resolve overlaps between node boxes (pill width from label length, height 40).
  const w = ids.map((id) => sizes.get(id) ?? 160);
  for (let pass = 0; pass < 80; pass++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const overlapX = (w[i] + w[j]) / 2 + 24 - Math.abs(pos[i].x - pos[j].x);
        const overlapY = 40 + 28 - Math.abs(pos[i].y - pos[j].y);
        if (overlapX > 0 && overlapY > 0) {
          moved = true;
          if (overlapY < overlapX) {
            const dir = pos[i].y <= pos[j].y ? -1 : 1;
            pos[i].y += (dir * overlapY) / 2;
            pos[j].y -= (dir * overlapY) / 2;
          } else {
            const dir = pos[i].x <= pos[j].x ? -1 : 1;
            pos[i].x += (dir * overlapX) / 2;
            pos[j].x -= (dir * overlapX) / 2;
          }
        }
      }
    }
    if (!moved) break;
  }
  return new Map(ids.map((id, i) => [id, { x: Math.round(pos[i].x - w[i] / 2), y: Math.round(pos[i].y - 20) }]));
}
