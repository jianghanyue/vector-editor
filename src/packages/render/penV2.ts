import { ToolType } from "../../type";
import { getOneThirdPoint } from "../utils/curve";
import { CurveTool } from "./curveTool";
import { PenData } from "./data";
import { PenEvents } from "./event";
import { PenSelect } from "./select";

export class PenV2 {
  currentState: ToolType = "select";
  data = new PenData();
  select = new PenSelect(this, this.data);
  curveTool = new CurveTool(this.data);
  updateVectorNetwork: Function | undefined = undefined
  events

  get vectorNetwork() {
    return this.data.vectorNetwork;
  }

  constructor(canvas: HTMLCanvasElement) {
   this.events = new PenEvents(canvas, this);
  }

  get vectorPath() {
    return this.data.vectorPath;
  }

  get isPen() {
    return this.currentState === "pen";
  }

  get isSelect() {
    return this.currentState === "select";
  }
  
  clear() {
    this.events.unbindEvent()
  }

  createPoint(x: number, y: number) {
    const { selectPointIndex, hoverTest } = this.select;

    // 连接已有点位
    if (selectPointIndex > -1 && hoverTest?.type === "point" && hoverTest.index !== selectPointIndex) {
      this.addSegment(hoverTest.index, selectPointIndex);
      return;
    } else if (hoverTest?.type === "point") {
      return
    }
    // 创建新点位
    const pointIndex = this.data.addVertice({ x, y });
    if (selectPointIndex > -1) this.addSegment(selectPointIndex, pointIndex);
    this.select.runHoverTest(x,y);
  }

  addSegment(start: number, end: number) {
    // 存在相同线条不操作
    const defaultTangent = {
      x: 0,
      y: 0,
    };
    let tangentStart = this.select.nextTangentLine ?? defaultTangent;
    if (this.select.nextTangentLine) {
      const { x, y } = this.select.nextTangentLine;
      const startVeritice = this.data.getVertice(start);
      const { x2, y2 } = getOneThirdPoint(
        startVeritice.x,
        startVeritice.y,
        x + startVeritice.x,
        y + startVeritice.y,
        4 / 5
      );
      tangentStart = {
        x: x2 - startVeritice.x,
        y: y2 - startVeritice.y,
      };
    }

    this.data.addSegment({
      start,
      end,
      tangentEnd: defaultTangent,
      tangentStart,
    });
    return true;
  }

  movePoint(x: number, y: number, index?: number) {
    const selectPointIndex =
      index !== undefined ? index : this.select.selectPointIndex;
    if (selectPointIndex > -1) {
      this.data.setVertice(selectPointIndex, { x, y });
    }
  }

  setLastSegmentTangentEnd(x: number, y: number, createTangentStart = false) {
    const { selectPointIndex } = this.select;

    if (selectPointIndex === -1) return;
    const lastSegment = this.data.lastSegment;
    if (!lastSegment || lastSegment.end !== selectPointIndex) return;
    const selectPoint = this.data.getVertice(selectPointIndex);
    const nextStartX = x - selectPoint.x;
    const nextStartY = y - selectPoint.y;
    const endX = nextStartX > 0 ? -nextStartX : Math.abs(nextStartX);
    const endY = nextStartY > 0 ? -nextStartY : Math.abs(nextStartY);
    const lastEndVeritices = this.data.getVertice(lastSegment.end);

    const { x2: resultX, y2: resultY } = getOneThirdPoint(
      lastEndVeritices.x,
      lastEndVeritices.y,
      endX + lastEndVeritices.x,
      endY + lastEndVeritices.y,
      4 / 5
    );
    lastSegment.tangentEnd = {
      x: resultX - lastEndVeritices.x,
      y: resultY - lastEndVeritices.y,
    };
    if (createTangentStart) {
      const lastStartVeritices = this.data.getVertice(lastSegment.start);
      const x1 = endX + lastEndVeritices.x;
      const y1 = endY + lastEndVeritices.y;
      const { x2, y2 } = getOneThirdPoint(
        lastStartVeritices.x,
        lastStartVeritices.y,
        x1,
        y1
      );

      lastSegment.tangentStart = {
        x: x2 - lastStartVeritices.x,
        y: y2 - lastStartVeritices.y,
      };
    }

    // }
  }

  setNextTangentLine(x: number, y: number) {
    const { selectPointIndex } = this.select;
    if (selectPointIndex === -1) return;
    const selectPoint = this.data.getVertice(selectPointIndex);
    this.select.nextTangentLine = {
      x: x - selectPoint.x,
      y: y - selectPoint.y,
    };
  }

  setCurrentState(state: ToolType) {
    if (state === "select") {
      this.select.nextTangentLine = null;
    }
    this.currentState = state;
  }

  getCurve(segmentIndex: number) {
    const segment = this.data.getSegment(segmentIndex);
    const start = this.data.getVertice(segment.start);
    const end = this.data.getVertice(segment.end);
    const { tangentStart, tangentEnd } = segment;
    const c1x = start.x + (tangentStart?.x || 0);
    const c1y = start.y + (tangentStart?.y || 0);
    const c2x = end.x + (tangentEnd?.x || 0);
    const c2y = end.y + (tangentEnd?.y || 0);
    return [start.x, start.y, c1x, c1y, c2x, c2y, end.x, end.y];
  }
}
