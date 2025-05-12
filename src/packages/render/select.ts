import { VectorVertex } from "../../type/figmaType";
import { bezierClosestPoint, curveBBox } from "../utils/curve";
import { PenData } from "./data";
import { PenV2 } from "./penV2";

type SelectContent = {
  points: number[];
  tangentPoints: string[];
  segments: number[];
};

type hoverTest = {
  type: "point" | "segment" | "tangent";
  index: number;
  tangentPoint: string;
};

export class PenSelect {
  selectContent: SelectContent = {
    points: [],
    tangentPoints: [],
    segments: [],
  };
  hoverTest: hoverTest | null = null;
  tipPoint: VectorVertex | null = null;
  nextTangentLine: VectorVertex | null = null;
  displayTangentSegments = new Set<number>();
  // preSelectPointIndex: number = -1;
  // preSelectSegmentIndex: number = -1;
  // preSelectTangentPoint: {
  //   pointKey: "tangentStart" | "tangentEnd",
  //   segmentIndex: number,
  // } | null = null;
  // hoverPoint: VectorVertex | null = null;

  constructor(private pen: PenV2, private data: PenData) {}

  get selectPointIndex() {
    const { points, tangentPoints, segments } = this.selectContent;
    if (tangentPoints.length > 0 || segments.length > 0 || points.length !== 1)
      return -1;
    return this.selectContent.points[0];
  }

  get selectTangetPoint() {
    const { points, tangentPoints, segments } = this.selectContent;
    if (tangentPoints.length !== 1 || segments.length > 0 || points.length > 0)
      return null;
    const [segmentIndex, pointKey] = tangentPoints[0].split(":");
    return {
      pointKey: pointKey as "tangentStart" | "tangentEnd",
      segmentIndex: Number(segmentIndex),
    };
  }

  get selectSegment() {
    const { points, tangentPoints, segments } = this.selectContent;
    if (tangentPoints.length > 0 || segments.length !== 1 || points.length > 0)
      return -1;
    return segments[0];
  }

  setSelectContent(value: SelectContent) {
    this.selectContent = value;
    if (value) {
      this.setTangentPointInVertice();
    }
  }

  setSelectTangent(value: string) {
    this.selectContent.tangentPoints.push(value);
  }

  setSelectPoint(value: number) {
    this.selectContent.points.push(value);
    this.setTangentPointInVertice();
  }

  setSelectSegment(value: number) {
    this.selectContent.segments.push(value);
  }

  clearSelectContent() {
    // this.preSelectPointIndex = this.selectPointIndex !== -1 ? this.selectPointIndex : -1;
    // this.preSelectSegmentIndex = this.preSelectSegmentIndex !== -1 ? this.preSelectSegmentIndex : -1;
    // this.preSelectTangentPoint = this.selectTangetPoint ? this.selectTangetPoint : null;
    this.selectContent = {
      points: [],
      tangentPoints: [],
      segments: [],
    };
  }

  setTangentPointInVertice() {
    this.displayTangentSegments.clear();
    const { points, segments } = this.selectContent;
    segments.forEach((seg) => this.displayTangentSegments.add(seg));

    this.data.segments.forEach((item, index) => {
      if (points.includes(item.start) || points.includes(item.end)) {
        this.displayTangentSegments.add(index);
      }
    });
  }

  distance(a: VectorVertex, b: VectorVertex): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  hitPointTest(x: number, y: number) {
    const result = this.data.vertices.findIndex((item) => {
      return this.distance(item, { x, y }) < 6;
    });

    return result;
  }

  isTangentContains(pointX: number, pointY: number, x: number, y: number) {
    return this.distance({ x: pointX, y: pointY }, { x, y }) < 6;
  }

  hitTangentTest(x: number, y: number) {
    let isStart = false;

    const { displayTangentSegments } = this;
    const segments = Array.from(displayTangentSegments);

    let result = -1;
    displayTangentSegments.values();
    displayTangentSegments.entries;
    for (let i = 0; i < segments.length; i++) {
      const segmentIndex = segments[i];
      const item = this.data.getSegment(segmentIndex);
      if (item.tangentStart) {
        const start = this.data.getVertice(item.start);
        const tangentX = start.x + item.tangentStart.x;
        const tangentY = start.y + item.tangentStart.y;
        if (this.isTangentContains(tangentX, tangentY, x, y)) {
          isStart = true;
          result = segmentIndex;
          break;
        }
      }
      if (item.tangentEnd) {
        const end = this.data.getVertice(item.end);
        const tangentX = end.x + item.tangentEnd.x;
        const tangentY = end.y + item.tangentEnd.y;
        if (this.isTangentContains(tangentX, tangentY, x, y)) {
          result = segmentIndex;
          break;
        }
      }
    }

    // if (result > -1)
    //   this.setSelectTangent(
    //     `${result}:${isStart ? "tangentStart" : "tangentEnd"}`
    //   );

    return result > -1
      ? `${result}:${isStart ? "tangentStart" : "tangentEnd"}`
      : "";
  }

  calcIsLine(segmentIndex: number) {
    const segment = this.data.getSegment(segmentIndex);
    const { tangentEnd, tangentStart } = segment;
    const start =
      !tangentStart || (tangentStart.x === 0 && tangentStart.y === 0);
    const end = !tangentEnd || (tangentEnd.x === 0 && tangentEnd.y === 0);
    return start && end;
  }

  hitSegmentTest(x: number, y: number) {
    let minDistance = Infinity;
    let minSegmentIndex = -1;
    this.data.segments.forEach((item, index) => {
      const isLine = this.calcIsLine(index);
      if (isLine) {
        const start = this.data.getVertice(item.start);
        const end = this.data.getVertice(item.end);
        const result = this.pointToSegmentDistance(
          x,
          y,
          start.x,
          start.y,
          end.x,
          end.y
        );
        if (result < minDistance) {
          minSegmentIndex = index;
        }
        minDistance = Math.min(minDistance, result);
      } else {
        const curve = this.pen.getCurve(index);
        const [xmin, ymin, xmax, ymax] = curveBBox(curve);
        if (xmin <= x && x <= xmax && ymin <= y && y <= ymax) {
          const { distance } = bezierClosestPoint(
            { x, y },
            { x: curve[0], y: curve[1] },
            { x: curve[2], y: curve[3] },
            { x: curve[4], y: curve[5] },
            { x: curve[6], y: curve[7] }
          );
          if (distance < minDistance) {
            minSegmentIndex = index;
          }
          minDistance = Math.min(minDistance, distance);
        }
      }
    });

    return minDistance < 3 ? minSegmentIndex : -1;
  }

  runHoverTest(x: number, y: number) {
    const hitTangentResult = this.hitTangentTest(x, y);
    const pointIndex = this.hitPointTest(x, y);
    if (pointIndex > -1) {
      this.hoverTest = {
        type: "point",
        index: pointIndex,
        tangentPoint: "",
      };
      return;
    }
    if (hitTangentResult) {
      this.hoverTest = {
        type: "tangent",
        index: -1,
        tangentPoint: hitTangentResult,
      };
      return;
    }
    const segmentIndex = this.hitSegmentTest(x, y);
    if (segmentIndex > -1) {
      this.hoverTest = {
        type: "segment",
        index: segmentIndex,
        tangentPoint: "",
      };
      return;
    }
    this.hoverTest = null;
  }

  runSelected() {
    this.clearSelectContent();
    if (!this.hoverTest) {
      return false
    };
    if (this.hoverTest.type === "point") {
      this.setSelectPoint(this.hoverTest.index);
    } else if (this.hoverTest.type === "segment") {
      this.setSelectSegment(this.hoverTest.index);
    } else if (this.hoverTest.type === "tangent") {
      this.setSelectTangent(this.hoverTest.tangentPoint);
    } else {
      return false;
    }
    return true;
  }

  pointToSegmentDistance(
    ax: number,
    ay: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {
      // B1 和 B2 是同一个点
      return Math.hypot(ax - x1, ay - y1);
    }

    // 计算投影比例 t（用于判断 A 在线段的投影位置）
    const t = ((ax - x1) * dx + (ay - y1) * dy) / (dx * dx + dy * dy);

    if (t < 0) {
      // A 投影在 B1 外 → 返回 A 到 B1 的距离
      return Math.hypot(ax - x1, ay - y1);
    } else if (t > 1) {
      // A 投影在 B2 外 → 返回 A 到 B2 的距离
      return Math.hypot(ax - x2, ay - y2);
    } else {
      // 投影在线段内 → 返回点到直线的垂直距离
      const projX = x1 + t * dx;
      const projY = y1 + t * dy;
      return Math.hypot(ax - projX, ay - projY);
    }
  }
}
