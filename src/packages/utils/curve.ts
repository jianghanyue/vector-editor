import { VectorVertex } from "../../type/figmaType";

export type BoundsT = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export function getOneThirdPoint(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  options = 1 / 3
) {
  const x2 = x0 + (x1 - x0) * options;
  const y2 = y0 + (y1 - y0) * options;
  return { x2, y2 };
}

// 计算线段包围盒
export function curveBBox(
  [x0, y0, x1, y1, x2, y2, x3, y3]: number[],
  boundsT: BoundsT = { minX: 0, minY: 0, maxX: 0, maxY: 0 }
) {
  // 提前分配数组，t值最多四个
  let tValues = [-1, -1, -1, -1];
  let tIndex = -1;
  let xmin = Math.min(x0, x3);
  let xmax = Math.max(x0, x3);
  let ymin = Math.min(y0, y3);
  let ymax = Math.max(y0, y3);

  // 直线包围盒
  if (x0 === x1 && y0 === y1 && x2 === x3 && y2 === y3) {
    return [xmin, ymin, xmax, ymax];
  }

  // 使用多项式的导数（一阶导数）来找到极值点
  // 系数 a、b 和 c 分别是导数的二次项、一次项和常数项系数
  for (let i = 0; i < 2; ++i) {
    let a =
      i === 0
        ? -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3
        : -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
    let b = i === 0 ? 6 * x0 - 12 * x1 + 6 * x2 : 6 * y0 - 12 * y1 + 6 * y2;
    let c = i === 0 ? 3 * x1 - 3 * x0 : 3 * y1 - 3 * y0;
    // 如果 a 接近于 0，方程退化为一次方程
    if (Math.abs(a) < 1e-12) {
      // 如果 b 不为 0，我们可以直接计算出 t
      if (Math.abs(b) >= 1e-12) {
        const t = -c / b;
        // t 有效区间在 [0, 1] 内
        if (0 < t && t < 1) {
          tIndex++;
          tValues[tIndex] = t;
        }
      }
    } else {
      const b2ac = b * b - 4 * c * a;
      // 是否有实数解
      if (b2ac >= 0) {
        // 通过求根公式找到两个可能的 t 值
        const sqrtb2ac = Math.sqrt(b2ac);
        const t1 = (-b + sqrtb2ac) / (2 * a);
        const t2 = (-b - sqrtb2ac) / (2 * a);
        if (0 < t1 && t1 < 1) {
          tIndex++;
          tValues[tIndex] = t1;
        }
        if (0 < t2 && t2 < 1) {
          tIndex++;
          tValues[tIndex] = t2;
        }
      }
    }
  }
  // 极值点换算 (x, y) , 计算曲线包围盒
  for (let i = 0; i <= tIndex; i++) {
    const t = tValues[i];
    const mt = 1 - t;
    const x =
      mt * mt * mt * x0 +
      3 * mt * mt * t * x1 +
      3 * mt * t * t * x2 +
      t * t * t * x3;
    const y =
      mt * mt * mt * y0 +
      3 * mt * mt * t * y1 +
      3 * mt * t * t * y2 +
      t * t * t * y3;
    if (boundsT && x < xmin) boundsT.minX = t;
    xmin = Math.min(x, xmin);
    if (boundsT && x > xmax) boundsT.maxX = t;
    xmax = Math.max(x, xmax);
    if (boundsT && y < ymin) boundsT.minY = t;
    ymin = Math.min(y, ymin);
    if (boundsT && y > ymax) boundsT.minY = t;
    ymax = Math.max(y, ymax);
  }

  return [
    xmin,
    ymin,
    xmax,
    ymax,
    boundsT.minX,
    boundsT.minY,
    boundsT.maxX,
    boundsT.maxY,
  ];
}

export function bezierPoint(
  t: number,
  p0: VectorVertex,
  p1: VectorVertex,
  p2: VectorVertex,
  p3: VectorVertex
) {
  const mt = 1 - t;
  return {
    x:
      mt * mt * mt * p0.x +
      3 * mt * mt * t * p1.x +
      3 * mt * t * t * p2.x +
      t * t * t * p3.x,
    y:
      mt * mt * mt * p0.y +
      3 * mt * mt * t * p1.y +
      3 * mt * t * t * p2.y +
      t * t * t * p3.y,
  };
}

export function bezierClosestPoint(
  A: VectorVertex,
  P0: VectorVertex,
  P1: VectorVertex,
  P2: VectorVertex,
  P3: VectorVertex,
  steps = 100
) {
  let minDist = Infinity;
  let closestPoint = null;
  let closestT = 0;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const pt = bezierPoint(t, P0, P1, P2, P3);
    const dx = pt.x - A.x;
    const dy = pt.y - A.y;
    const dist = dx * dx + dy * dy;

    if (dist < minDist) {
      minDist = dist;
      closestPoint = pt;
      closestT = t;
    }
  }

  return {
    point: closestPoint,
    distance: Math.sqrt(minDist),
    t: closestT,
  };
}

export function getAtan2([x1, y1, x2, y2]: number[]) {
  const tangentVector = {
    x: x2 - x1,
    y: y2 - y1,
  };

  const c1 = (Math.atan2(tangentVector.y, tangentVector.x) * 180) / Math.PI;

  return c1 > 0 ? c1 : 360 + c1;
}
