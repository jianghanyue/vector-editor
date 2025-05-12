import { VectorSegment } from "../../type/figmaType";
import { getAtan2 } from "../utils/curve";
import { PenData } from "./data";

const base = 0.39052508429429217;

export class CurveTool {
  constructor(private data: PenData) {}

  hanldeTangent(key: string) {
    this.data.delTangentPoint(key);
  }

  handlePoint(index: number) {
    const segments = this.data.getSegmentsByVertice(index);
    if (segments.length === 1) {
      const segment = this.data.getSegment(segments[0]);
      const isStart = segment.start === index
      const key = isStart ? 'tangentStart': 'tangentEnd';
      const tangent = segment[key]
      if (!tangent || (tangent?.x === 0 && tangent.y === 0)) {
        this.generateReflectControlPoint(segment, isStart)
      } else {
        segment[key] = {x: 0, y: 0}
      }
    } else if (segments.length === 2) {
      const s1 = this.data.getSegment(segments[0]);
      const s2 = this.data.getSegment(segments[1]);
      const t1key = s1.end === index ? "tangentEnd" : "tangentStart";
      const t2key = s2.end === index ? "tangentEnd" : "tangentStart";
      const t1 = s1[t1key] ?? { x: 0, y: 0 };
      const t2 = s2[t2key] ?? { x: 0, y: 0 };
      const t1valid = t1?.x !== 0 || t1?.y !== 0;
      const t2valid = t2?.x !== 0 || t2?.y !== 0;
      if (t1valid && t2valid) {
        this.data.delTangentPoint(`${segments[0]}:${t1key}`);
        this.data.delTangentPoint(`${segments[1]}:${t2key}`);
        this.data.setHandleMirroring(index, 'NONE')
      } else if (t1valid || t2valid) {
        t1valid
          ? (s2[t2key] = {
              x: t1.x < 0 ? Math.abs(t1.x) : -t1.x,
              y: t1.y < 0 ? Math.abs(t1.y) : -t1.y,
            })
          : (s1[t1key] = {
              x: t2.x < 0 ? Math.abs(t2.x) : -t2.x,
              y: t2.y < 0 ? Math.abs(t2.y) : -t2.y,
            });
        this.data.setHandleMirroring(index, 'ANGLE_AND_LENGTH')
      } else {
        const s1angle = this.getSegmentAngle(s1, index);
        const s2angle = this.getSegmentAngle(s2, index);
        const s1len = this.getSegmentLength(s1);
        const s2len = this.getSegmentLength(s2);
        const c1len = s1len * base;
        const c2len = s2len * base;
        let angle = Math.abs(s2angle - s1angle);
        let newAngle = angle;
        if (angle > 180) {
          newAngle = 360 - angle;
        }
        const ratio1 = c1len / (c2len + c1len);
        const ratio2 = c2len / (c1len + c2len);
        const t1angle = ratio1 * (360 - newAngle - 180);
        const t2angle = ratio2 * (360 - newAngle - 180);

        const angleDeg1 =
          angle <= 180 && s1angle < s2angle
            ? s1angle - t1angle
            : s1angle + t1angle;
        const angleDeg2 =
          angle <= 180 && s2angle < s1angle
            ? s2angle - t2angle
            : s2angle + t2angle;
        s1[t1key] = this.rotatePoint(c1len, 0, angleDeg1);
        s2[t2key] = this.rotatePoint(c2len, 0, angleDeg2);
        this.data.setHandleMirroring(index, 'ANGLE')
      }
    } else {
      const filterSegments = segments.filter(segmentIndex => {
        const segment = this.data.getSegment(segmentIndex)
        const tangent = (segment.start === index ? segment.tangentStart : segment.tangentEnd) || {x: 0, y: 0}
        return tangent.x === 0 && tangent.y === 0
      })
      if (filterSegments.length === 0) {
        segments.forEach(segmentIndex => {
          const segment = this.data.getSegment(segmentIndex)
          if (segment.start === index) {
            segment.tangentStart = {x: 0, y: 0}
          } else {
            segment.tangentEnd = {x: 0, y: 0}
          }
        })
      } else {
        segments.forEach(segmentIndex => {
          const segment = this.data.getSegment(segmentIndex)
          this.generateReflectControlPoint(segment, segment.start === index)
        })
      }
    }
  }

  generateReflectControlPoint(segment: VectorSegment, isStart: boolean) {
    const start = this.data.getVertice(segment.start)
    const end = this.data.getVertice(segment.end)
    const len = this.getSegmentLength(segment)
    if (isStart) {
      const angle = getAtan2([start.x, start.y, end.x, end.y])
      const clen = len * base
      const tangentEnd = segment.tangentEnd ?? {x: 0, y: 0}
      const isLine = tangentEnd.x === 0 && tangentEnd.y === 0
      segment.tangentStart = isLine ? this.rotatePoint(clen, 0, angle) : this.reflectControlPoint(segment , isStart)
    } else {
      const angle = getAtan2([end.x, end.y, start.x, start.y])
      const clen = len * base
      const tangentStart = segment.tangentStart ?? {x: 0, y: 0}
      const isLine = tangentStart.x === 0 && tangentStart.y === 0
      segment.tangentEnd = isLine ? this.rotatePoint(clen, 0, angle) : this.reflectControlPoint(segment , isStart)
    }
  }

  reflectControlPoint(segment: VectorSegment, isStart: boolean, length?: number) {
    const start = this.data.getVertice(segment.start)
    const end = this.data.getVertice(segment.end)
    const tangentEnd = segment.tangentEnd ?? {x: 0, y: 0}
    const tangentStart = segment.tangentStart ?? {x: 0, y: 0}
    const angle = getAtan2(isStart ? [start.x, start.y, end.x, end.y] : [end.x, end.y, start.x, start.y])
    const { x, y } = isStart ? this.rotatePoint(end.x, end.y, -angle, start.x, start.y) : this.rotatePoint(start.x, start.y, -angle, end.x, end.y)
    const {x: tangentX, y: tangentY} = isStart ? this.rotatePoint(end.x + tangentEnd.x, end.y + tangentEnd.y, -angle, start.x, start.y) : this.rotatePoint(start.x + tangentStart.x, start.y + tangentStart.y, -angle, end.x, end.y)
    let newTangentX = tangentX - x
    const newTangentY = tangentY - y
    newTangentX = newTangentX > 0 ? -newTangentX : Math.abs(newTangentX)
    const angle2 = getAtan2([0,0,newTangentX,newTangentY])
    // const {x:resultX, y:resultY} = this.rotatePoint(newTangentX, newTangentY, angle)
    if (length === undefined) {
      return this.rotatePoint(newTangentX, newTangentY, angle)
    }
    return this.rotatePoint(length, 0, angle2 + angle)
  }

  rotatePoint(x1: number, y1: number, angleDeg: number, cx = 0, cy = 0) {
    const angleRad = angleDeg * Math.PI / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
  
    // 平移到原点
    const dx = x1 - cx;
    const dy = y1 - cy;
  
    // 应用旋转矩阵
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
  
    // 平移回去
    return {
      x: rx + cx,
      y: ry + cy
    };
  }

  getSegmentAngle(segment: VectorSegment, pointIndex: number) {
    const start = this.data.getVertice(segment.start);
    const end = this.data.getVertice(segment.end);
    return getAtan2(
      segment.start === pointIndex
        ? [start.x, start.y, end.x, end.y]
        : [end.x, end.y, start.x, start.y]
    );
  }

  getSegmentLength(segment: VectorSegment) {
    const start = this.data.getVertice(segment.start);
    const end = this.data.getVertice(segment.end);
    const x1 = start.x;
    const y1 = start.y;
    const x2 = end.x;
    const y2 = end.y;
    const a = x2 - x1;
    const b = y2 - y1;
    const length = Math.sqrt(a * a + b * b);
    return length;
  }

  handleSegment() {}
}
