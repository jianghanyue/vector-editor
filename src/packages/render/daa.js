var QLo = class {
  constructor(t) {
      this.regions = [];
      this.segments = [];
      this.vertices = [];
      t && (this.regions = t.regions,
      this.segments = t.segments,
      this.vertices = t.vertices)
  }
  isEmpty() {
      return this.vertices.length === 0
  }
  hasVertex(t, o) {
      return t.start === o || t.end === o
  }
  startingVertex(t) {
      if (t.length === 1)
          return this.segments[t[0]].start;
      let o = this.segments[t[0]]
        , r = this.segments[t[1]]
        , n = this.hasVertex(r, o.end)
        , i = this.hasVertex(r, o.start);
      if (n && i && t.length > 2) {
          let s = this.segments[t[2]];
          n = this.hasVertex(s, o.start)
      }
      if (n)
          return o.start;
      if (!i)
          throw new Error("Network: invalid starting vertex");
      return o.end
  }
  getOrderedLoop(t) {
      if (t.length === 0)
          return [];
      let o = []
        , r = this.startingVertex(t);
      for (let n of t) {
          let i = this.segments[n]
            , s = i.start === r;
          if (!(i.start === r || i.end === r))
              throw new Error("Network: invalid loop");
          s ? (o.push({
              segmentIndex: n,
              segment: {
                  start: i.start,
                  end: i.end,
                  tangentStart: i.tangentStart,
                  tangentEnd: i.tangentEnd
              }
          }),
          r = i.end) : (o.push({
              segmentIndex: n,
              segment: {
                  start: i.end,
                  end: i.start,
                  tangentStart: i.tangentEnd,
                  tangentEnd: i.tangentStart
              }
          }),
          r = i.start)
      }
      return o
  }
  getVertex(t) {
      return this.vertices[t]
  }
  checkValid() {
      for (let[t,o] of this.segments.entries()) {
          if (o.start >= this.vertices.length)
              throw new Error(`vectorNetwork.segments[${t}].start does not refer to a valid vertex. For more info see https://www.figma.com/plugin-docs/api/VectorNetwork/`);
          if (o.end >= this.vertices.length)
              throw new Error(`vectorNetwork.segments[${t}].end does not refer to a valid vertex. For more info see https://www.figma.com/plugin-docs/api/VectorNetwork/`)
      }
      for (let[t,o] of this.regions.entries()) {
          if (o.loops.length === 0)
              throw new Error(`vectorNetwork.regions[${t}].loops must have at least one loop. For more info see https://www.figma.com/plugin-docs/api/VectorNetwork/`);
          for (let[r,n] of o.loops.entries()) {
              if (n.length === 0)
                  throw new Error(`vectorNetwork.regions[${t}].loops[${r}] must have at least one segment. For more info see https://www.figma.com/plugin-docs/api/VectorNetwork/`);
              for (let[s,a] of n.entries())
                  if (a >= this.segments.length)
                      throw new Error(`vectorNetwork.regions[${t}].loops[${r}][${s}] does not refer to a valid segment. For more info see https://www.figma.com/plugin-docs/api/VectorNetwork/`);
              let i = this.startingVertex(n);
              for (let[s,a] of n.entries()) {
                  let l = this.segments[a];
                  if (i != l.start && i != l.end)
                      throw new Error(`vectorNetwork.regions[${t}].loops[${r}][${s}] does not connect properly with previous segment. For more info see https://www.figma.com/plugin-docs/api/VectorNetwork/`);
                  i = faa(l, i)
              }
          }
      }
  }
}
var YLo = class {
  static isCommands = false
  isCommands
  constructor(t) {
      this.windingRule = t,
      this.commands = [],
      this.lastPosition = null
      this.isCommands = this.windingRule === "NONE" ? false : YLo.isCommands
  }
  moveTo(t) { 
    const command = this.isCommands ? 0 : "M"
      this.commands.push(command, t.x, t.y),
      this.lastPosition = t
  }
  lineTo(t) {
    const command = this.isCommands ? 1 : "L"
      this.commands.push(command, t.x, t.y),
      this.lastPosition = t
  }
  curveTo(t, o, r) {
    const command = this.isCommands ? 4 : "C"
      this.commands.push(command, t.x, t.y, o.x, o.y, r.x, r.y),
      this.lastPosition = r
  }
  closePath() {
    const command = this.isCommands ? 5 : "Z"
      this.commands.push(command),
      this.lastPosition = null
  }
  toVectorPath() {
      return {
          windingRule: this.windingRule,
          data: this.commands.join(" ")
      }
  }
}
function Ysa(e, t) {
  return e?.x === t?.x && e?.y === t?.y
}
function naa(e) {
  return e.tangentStart.x === 0 && e.tangentStart.y === 0 && e.tangentEnd.x === 0 && e.tangentEnd.y === 0
}
function jZe(e, t) {
  return {
      x: e.x + t.x,
      y: e.y + t.y
  }
}
function faa(e, t) {
  if (t === e.start)
      return e.end;
  if (t === e.end)
      return e.start;
  throw new Error(`Unknown vertex (${t}) for segment (${e.start},${e.end})`)
}
export function daa(e, isCommands = false) {
  YLo.isCommands = isCommands
  let t = new QLo(e)
    , o = Array(e.segments.length).fill(!1)
    , r = [];
  if (t.isEmpty())
      return [];
  for (let s of t.regions) {
      let a = new YLo(s.windingRule);
      for (let l of s.loops) {
          let c = null;
          for (let {segment: d, segmentIndex: u} of t.getOrderedLoop(l)) {
              o[u] = !0;
              let p = t.getVertex(d.start)
                , f = t.getVertex(d.end);
              c === null && (a.moveTo(p),
              c = p),
              naa(d) ? a.lineTo(f) : a.curveTo(jZe(p, d.tangentStart), jZe(f, d.tangentEnd), f)
          }
          Ysa(a.lastPosition, c) && a.closePath()
      }
      r.push(a)
  }
  let n = [];
  for (let s = 0; s < t.vertices.length; s++)
      n[s] = [];
  for (let s = 0; s < t.segments.length; s++)
      o[s] || (n[t.segments[s].start].push(s),
      n[t.segments[s].end].push(s));
  let i = [];
  for (let s = 0; s < 2; s++)
      for (let a = 0; a < t.vertices.length; a++)
          if (!(s === 0 && n[a].length === 2))
              for (let l of n[a]) {
                  if (o[l])
                      continue;
                  let c = a
                    , d = l
                    , u = {
                      segments: [],
                      isClosed: !1,
                      startingVertex: c
                  };
                  for (i.push(u); !o[d]; ) {
                      o[d] = !0;
                      let p = t.segments[d];
                      c = faa(p, c),
                      u.segments.push(d);
                      let f = n[c];
                      if (f.length === 2)
                          d = f[0] === d ? f[1] : f[0];
                      else
                          break
                  }
                  c === a && (u.isClosed = !0)
              }
  if (i.length > 0) {
      let s = new YLo("NONE");
      r.push(s);
      for (let a of i) {
          let l = a.startingVertex
            , c = t.vertices[l];
          s.moveTo(c);
          for (let d of a.segments) {
              let u = t.segments[d];
              l = u.start === l ? u.end : u.start;
              let p = t.vertices[l];
              naa(u) ? s.lineTo(p) : l === u.end ? s.curveTo(jZe(c, u.tangentStart), jZe(p, u.tangentEnd), p) : s.curveTo(jZe(c, u.tangentEnd), jZe(p, u.tangentStart), p),
              c = p
          }
          a.isClosed && s.closePath()
      }
  }
  if (isCommands) {
    return r
  }
  return r.map(s=>s.toVectorPath())
}

// window.daa = (vectorNetwork) => daa({...vectorNetwork, regions: []})