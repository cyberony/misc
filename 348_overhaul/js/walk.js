(() => {
  const TREE = {
    1: [2, 3, 4],
    2: [5],
    3: [6, 7, 8],
    4: [9],
    5: [10, 11],
    6: [12, 13],
    7: [14, 15],
    8: [16, 17],
    9: [18, 19],
    10: [20],
    11: [21, 22, 23],
    20: [34, 35],
  };

  const POS = {
    1: [400, 28],
    2: [168, 112], 3: [400, 112], 4: [632, 112],
    5: [168, 196], 6: [312, 196], 7: [400, 196], 8: [488, 196], 9: [632, 196],
    10: [108, 286], 11: [210, 286], 12: [292, 286], 13: [338, 286],
    14: [384, 286], 15: [430, 286], 16: [500, 286], 17: [552, 286],
    18: [612, 286], 19: [668, 286],
    20: [108, 380], 21: [180, 380], 22: [232, 380], 23: [284, 380],
    34: [78, 474], 35: [138, 474],
  };

  const NODES = Object.keys(POS).map(Number);
  const EDGES = [];
  for (const [p, kids] of Object.entries(TREE)) {
    for (const c of kids) EDGES.push([Number(p), c]);
  }

  const BFS = [
    {
      say: "Goal is node 16. The fringe is a queue. Nothing in it yet.",
      fringe: [], current: null, visited: [],
    },
    {
      say: "Push 1 onto the empty fringe.",
      fringe: [1], current: null, visited: [],
    },
    {
      say: "Pop 1. Check it. Not the goal. Expand.",
      fringe: [], current: 1, visited: [1],
    },
    {
      say: "Children 2, 3, 4 go on the back of the queue.",
      fringe: [2, 3, 4], current: 1, visited: [1],
    },
    {
      say: "Pop 2. Not the goal. Expand → 5. Fringe is now 3, 4, 5.",
      fringe: [3, 4, 5], current: 2, visited: [1, 2],
    },
    {
      say: "Pop 3. Expand → 6, 7, 8. Fringe: 4, 5, 6, 7, 8.",
      fringe: [4, 5, 6, 7, 8], current: 3, visited: [1, 2, 3],
    },
    {
      say: "Pop 4. Expand → 9. Fringe: 5, 6, 7, 8, 9.",
      fringe: [5, 6, 7, 8, 9], current: 4, visited: [1, 2, 3, 4],
    },
    {
      say: "Pop 5. Expand → 10, 11. Fringe: 6, 7, 8, 9, 10, 11.",
      fringe: [6, 7, 8, 9, 10, 11], current: 5, visited: [1, 2, 3, 4, 5],
    },
    {
      say: "After 6 and 7 (they add 12–15), pop 8. Expand → 16, 17. Sixteen is on the fringe — we have not checked it yet.",
      fringe: [9, 10, 11, 12, 13, 14, 15, 16, 17], current: 8, visited: [1, 2, 3, 4, 5, 6, 7, 8],
    },
    {
      say: "Keep popping the front of the queue. Eventually we pop 16, check it, and stop. BFS always expanded the shallowest unexpanded node.",
      fringe: [17], current: 16, visited: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], goal: 16,
    },
  ];

  const DFS = [
    {
      say: "Same tree, same goal (16). The fringe is now a stack.",
      fringe: [], current: null, visited: [], stack: true,
    },
    {
      say: "Push 1. Pop 1. Not the goal. Expand → 2, 3, 4. Push them left to right.",
      fringe: [2, 3, 4], current: 1, visited: [1], stack: true,
    },
    {
      say: "Halt. If we pop now, we get 4 — right to left. To walk left to right, push right to left.",
      fringe: [4, 3, 2], current: 1, visited: [1], stack: true, halt: true,
    },
    {
      say: "Pop 2. Expand → 5. Push 5. We are going down the left branch.",
      fringe: [4, 3, 5], current: 2, visited: [1, 2], stack: true,
    },
    {
      say: "Pop 5. Expand → 10, 11. Push right to left, so 11 then 10.",
      fringe: [4, 3, 11, 10], current: 5, visited: [1, 2, 5], stack: true,
    },
    {
      say: "Pop 10. Expand → 20. Still diving.",
      fringe: [4, 3, 11, 20], current: 10, visited: [1, 2, 5, 10], stack: true,
    },
    {
      say: "Pop 20. Expand → 34, 35. Push 35 then 34.",
      fringe: [4, 3, 11, 35, 34], current: 20, visited: [1, 2, 5, 10, 20], stack: true,
    },
    {
      say: "34 is a leaf — cannot expand. Then 35, also a leaf. Leftmost spine is done. Fringe: 4, 3, 11.",
      fringe: [4, 3, 11], current: 35, visited: [1, 2, 5, 10, 20, 34, 35], stack: true,
    },
    {
      say: "Pop 11. Expand → 21, 22, 23. The right branch under 5, still depth-first.",
      fringe: [4, 3, 23, 22, 21], current: 11, visited: [1, 2, 5, 10, 20, 34, 35, 11], stack: true,
    },
    {
      say: "After the rest of 2, then 3’s left children, we pop 16 and stop. 4 and 17 are still on the stack. DFS always expanded the deepest unexpanded node.",
      fringe: [4, 17], current: 16, visited: [1, 2, 5, 10, 20, 34, 35, 11, 21, 22, 23, 3, 6, 7, 8, 16], goal: 16, stack: true,
    },
  ];

  const H = { A: 36.1, B: 28.3, C: 22.4, D: null, E: 31.6, F: 22.4, G: 14.1, H: 10, I: 30, J: 20, K: 10, L: 0 };
  const LETTERS = "ABCDEFGHIJKL".split("");

  const ASTAR = [
    {
      say: "Go from A to L. Orthogonal step 10, diagonal 14. h is straight-line distance. Open and closed start empty.",
      open: [], closed: [], current: null, cells: {},
    },
    {
      say: "Put A in open. g = 0, h = 36.1, f = 36.1. A is current.",
      open: ["A"], closed: [], current: "A",
      cells: { A: { g: 0, h: 36.1, f: 36.1, prev: "—" } },
    },
    {
      say: "A’s neighbors: B and E cost 10, F costs 14. Record g, h, f, previous = A. Then close A. Lowest f among B, E, F is F (36.4).",
      open: ["B", "E", "F"], closed: ["A"], current: "F",
      cells: {
        A: { g: 0, h: 36.1, f: 36.1, prev: "—" },
        B: { g: 10, h: 28.3, f: 38.3, prev: "A" },
        E: { g: 10, h: 31.6, f: 41.6, prev: "A" },
        F: { g: 14, h: 22.4, f: 36.4, prev: "A" },
      },
    },
    {
      say: "F has eight neighbors. A is closed. B via F would be 24 — worse than 10, leave it. Same for E. Add C, G, I, J, K. Close F. Lowest f is now K (38).",
      open: ["B", "C", "E", "G", "I", "J", "K"], closed: ["A", "F"], current: "K",
      cells: {
        A: { g: 0, h: 36.1, f: 36.1, prev: "—" },
        B: { g: 10, h: 28.3, f: 38.3, prev: "A" },
        C: { g: 28, h: 22.4, f: 50.4, prev: "F" },
        E: { g: 10, h: 31.6, f: 41.6, prev: "A" },
        F: { g: 14, h: 22.4, f: 36.4, prev: "A" },
        G: { g: 24, h: 14.1, f: 38.1, prev: "F" },
        I: { g: 28, h: 30, f: 58, prev: "F" },
        J: { g: 24, h: 20, f: 44, prev: "F" },
        K: { g: 28, h: 10, f: 38, prev: "F" },
      },
    },
    {
      say: "K’s neighbors: F already closed; G and J already cheaper. Update H and L. Close K. L’s f ties K’s old 38 — and L is the goal.",
      open: ["B", "C", "E", "G", "I", "J", "L"], closed: ["A", "F", "K"], current: "L",
      cells: {
        A: { g: 0, h: 36.1, f: 36.1, prev: "—" },
        B: { g: 10, h: 28.3, f: 38.3, prev: "A" },
        C: { g: 28, h: 22.4, f: 50.4, prev: "F" },
        E: { g: 10, h: 31.6, f: 41.6, prev: "A" },
        F: { g: 14, h: 22.4, f: 36.4, prev: "A" },
        G: { g: 24, h: 14.1, f: 38.1, prev: "F" },
        H: { g: 42, h: 10, f: 52, prev: "K" },
        I: { g: 28, h: 30, f: 58, prev: "F" },
        J: { g: 24, h: 20, f: 44, prev: "F" },
        K: { g: 28, h: 10, f: 38, prev: "F" },
        L: { g: 38, h: 0, f: 38, prev: "K" },
      },
    },
    {
      say: "Walk previous-pointers home: L ← K ← F ← A. Path A–F–K–L. C’s g is 28, not 20 — we reached C via F — and A* still found the shortest path.",
      open: ["B", "C", "E", "G", "I", "J"], closed: ["A", "F", "K"], current: "L",
      path: ["A", "F", "K", "L"], goal: "L",
      cells: {
        A: { g: 0, h: 36.1, f: 36.1, prev: "—" },
        B: { g: 10, h: 28.3, f: 38.3, prev: "A" },
        C: { g: 28, h: 22.4, f: 50.4, prev: "F" },
        E: { g: 10, h: 31.6, f: 41.6, prev: "A" },
        F: { g: 14, h: 22.4, f: 36.4, prev: "A" },
        G: { g: 24, h: 14.1, f: 38.1, prev: "F" },
        H: { g: 42, h: 10, f: 52, prev: "K" },
        I: { g: 28, h: 30, f: 58, prev: "F" },
        J: { g: 24, h: 20, f: 44, prev: "F" },
        K: { g: 28, h: 10, f: 38, prev: "F" },
        L: { g: 38, h: 0, f: 38, prev: "K" },
      },
    },
  ];

  const STEPS = { bfs: BFS, dfs: DFS, astar: ASTAR };

  function treeSvg() {
    const lines = EDGES.map(([a, b]) => {
      const [x1, y1] = POS[a];
      const [x2, y2] = POS[b];
      return `<line data-edge="${a}-${b}" x1="${x1}" y1="${y1 + 16}" x2="${x2}" y2="${y2 - 16}"/>`;
    }).join("");
    const nodes = NODES.map((n) => {
      const [x, y] = POS[n];
      return `<g class="tn" data-n="${n}" transform="translate(${x},${y})">
        <circle r="16"/>
        <text>${n}</text>
      </g>`;
    }).join("");
    return `<svg viewBox="0 0 800 510" aria-label="Search tree, goal node 16">${lines}${nodes}</svg>`;
  }

  function astarMount(root) {
    const grid = LETTERS.map((L, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      return `<div class="acell" data-v="${L}" style="grid-area:${row + 1}/${col + 1}">
        <span class="ag"></span><span class="ah"></span>
        <span class="af"></span>
        <span class="an">${L}</span>
      </div>`;
    }).join("");
    root.querySelector(".walk-viz").innerHTML = `
      <div class="astar-board">
        <div>
          <div class="agrid">${grid}</div>
          <div class="asets">
            <p><b>Open</b> <span data-open></span></p>
            <p><b>Closed</b> <span data-closed></span></p>
          </div>
        </div>
        <table class="atable">
          <thead><tr><th>v</th><th>g</th><th>h</th><th>f</th><th>prev</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>`;
  }

  function mount(slide) {
    const root = slide.querySelector("[data-walk]");
    if (!root || root.dataset.ready) return root;
    const kind = root.dataset.walk;
    const viz = root.querySelector(".walk-viz");
    if (kind === "astar") astarMount(root);
    else viz.innerHTML = treeSvg();
    root.dataset.ready = "1";
    root.dataset.step = "0";
    apply(root, 0);
    return root;
  }

  function fmtFringe(list, stack) {
    if (!list.length) return stack ? "[  ]" : "∅";
    return stack ? `[ ${list.join(", ")}` : list.join(" · ");
  }

  function applyTree(root, s) {
    const known = new Set([...(s.visited || []), ...(s.fringe || []), s.current, s.goal].filter(Boolean));
    root.querySelectorAll(".tn").forEach((g) => {
      const n = Number(g.dataset.n);
      g.classList.toggle("is-current", s.current === n);
      g.classList.toggle("in-fringe", s.fringe.includes(n) && s.current !== n);
      g.classList.toggle("is-visited", (s.visited || []).includes(n) && s.current !== n && s.goal !== n);
      g.classList.toggle("is-goal", s.goal === n);
      g.classList.toggle("is-target", n === 16);
      g.classList.toggle("is-dim", !known.has(n) && n !== 16);
    });
    root.querySelectorAll("line").forEach((ln) => {
      const [a, b] = ln.dataset.edge.split("-").map(Number);
      ln.classList.toggle("is-on", known.has(a) && known.has(b));
    });
    const say = root.querySelector(".say");
    const fv = root.querySelector(".fringe-val");
    const lab = root.querySelector(".fringe-label");
    if (say) say.innerHTML = s.say;
    if (fv) fv.textContent = fmtFringe(s.fringe, s.stack);
    if (lab) lab.textContent = s.stack ? "Fringe · stack  (bottom →)" : "Fringe · queue";
    root.classList.toggle("is-halt", !!s.halt);
  }

  function applyAstar(root, s) {
    const say = root.querySelector(".say");
    if (say) say.innerHTML = s.say;
    root.querySelector("[data-open]").textContent = s.open.length ? `{ ${s.open.join(", ")} }` : "{ }";
    root.querySelector("[data-closed]").textContent = s.closed.length ? `{ ${s.closed.join(", ")} }` : "{ }";
    LETTERS.forEach((L) => {
      const el = root.querySelector(`.acell[data-v="${L}"]`);
      const c = (s.cells || {})[L];
      el.classList.toggle("is-current", s.current === L);
      el.classList.toggle("is-open", s.open.includes(L) && s.current !== L);
      el.classList.toggle("is-closed", s.closed.includes(L));
      el.classList.toggle("on-path", (s.path || []).includes(L));
      el.classList.toggle("is-empty", !c);
      el.querySelector(".ag").textContent = c ? c.g : "";
      el.querySelector(".ah").textContent = c ? c.h : "";
      el.querySelector(".af").textContent = c ? c.f : "";
    });
    const tb = root.querySelector(".atable tbody");
    const rows = LETTERS.filter((L) => s.cells && s.cells[L]);
    tb.innerHTML = rows.map((L) => {
      const c = s.cells[L];
      const on = (s.path || []).includes(L) ? " class=\"on-path\"" : "";
      return `<tr${on}><td>${L}</td><td>${c.g}</td><td>${c.h}</td><td>${c.f}</td><td>${c.prev}</td></tr>`;
    }).join("");
  }

  function apply(root, step) {
    const kind = root.dataset.walk;
    const steps = STEPS[kind];
    const s = steps[step];
    root.dataset.step = String(step);
    const n = root.querySelector(".walk-n");
    if (n) n.textContent = `${step + 1} / ${steps.length}`;
    if (kind === "astar") applyAstar(root, s);
    else applyTree(root, s);
  }

  function len(root) {
    return STEPS[root.dataset.walk].length;
  }

  window.Walk = {
    prepare(slide) {
      const root = slide.querySelector("[data-walk]");
      if (!root) return null;
      return mount(slide);
    },
    advance(slide) {
      const root = this.prepare(slide);
      if (!root) return false;
      const i = Number(root.dataset.step || 0);
      if (i >= len(root) - 1) return false;
      apply(root, i + 1);
      return true;
    },
    rewind(slide) {
      const root = this.prepare(slide);
      if (!root) return false;
      const i = Number(root.dataset.step || 0);
      if (i <= 0) return false;
      apply(root, i - 1);
      return true;
    },
    reset(slide) {
      const root = slide.querySelector("[data-walk]");
      if (!root) return;
      if (root.dataset.ready) apply(root, 0);
    },
    finish(slide) {
      const root = this.prepare(slide);
      if (!root) return;
      apply(root, len(root) - 1);
    },
  };
})();
