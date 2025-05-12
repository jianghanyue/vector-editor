import { isNull } from "lodash";
import { PenV2 } from "./penV2";
import { PenSelect } from "./select";
import { ToolType } from "../../type";

type Vec2 = [number, number];

export class PenEvents {
  draggingInfo = {
    dragging: false,
    nextTangentLine: false,
    x: 0,
    y: 0
  };
  preCurrentState: ToolType = 'select'
  penSelect: PenSelect;
  isSelectDragging: boolean = false;
  constructor(private canvas: HTMLCanvasElement, private pen: PenV2) {
    this.penSelect = this.pen.select
    this.bindEvent()
  }

  bindEvent() {
    const {canvas} = this
    canvas.addEventListener("mousedown", this.handleMousedown);
    canvas.addEventListener("mousemove", this.handleMousemove);
    window.addEventListener("keydown", this.handleKeydown);
    window.addEventListener("keyup", this.handleKeyup)
    canvas.addEventListener("mouseup", this.handleMouseup);
  }

  unbindEvent() {
    const {canvas} = this
    canvas.removeEventListener("mousedown", this.handleMousedown);
    canvas.removeEventListener("mousemove", this.handleMousemove);
    window.removeEventListener("keydown", this.handleKeydown);
    window.removeEventListener("keyup", this.handleKeyup)
    canvas.removeEventListener("mouseup", this.handleMouseup);
  }

  handleKeyup = (e: KeyboardEvent) => {
    if (e.key === 'Meta' || e.key === 'Control') {
      this.pen.currentState = this.preCurrentState
    }
  }

  handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (!isNull(this.penSelect.selectPointIndex)) {
        const isLastPoint = this.penSelect.selectPointIndex === this.pen.data.vertices.length - 1
        const isSegment = this.pen.data.segments.find(item => item.start === this.penSelect.selectPointIndex || item.end === this.penSelect.selectPointIndex)
        if (isLastPoint && !isSegment) {
          this.pen.data.vertices.pop()
          this.pen.updateVectorNetwork?.()
        }
        this.penSelect.clearSelectContent()
      }
      this.penSelect.nextTangentLine = null
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const {selectContent} = this.penSelect
      selectContent.tangentPoints.forEach(tangentPoint => {
        this.pen.data.delTangentPoint(tangentPoint)
      })
      selectContent.points.forEach(pointIndex => {
        this.pen.data.delPoint(pointIndex)
      })
      selectContent.segments.forEach(segmentIndex => {
        this.pen.data.delSegment(segmentIndex)
      })
      this.penSelect.displayTangentSegments.clear()
      this.penSelect.clearSelectContent()
      this.pen.updateVectorNetwork?.()
    }
    if (e.key === 'Meta' || e.key === 'Control') {
      this.preCurrentState = this.pen.currentState
      this.pen.currentState = 'curve'
      this.penSelect.nextTangentLine = null
    }
  }

  handleMousedown = (e: MouseEvent) => {
    const pos = this.getMousePos(e);
    console.log(this.pen.currentState,'this.pen.currentState')
    if (this.pen.currentState === 'curve') {
      this.handleCurveTool()
      this.penSelect.runSelected()
      this.penSelect.nextTangentLine = null
      return
    }
    if (this.pen.isPen && this.penSelect.hoverTest?.type !== 'tangent') {
      this.pen.createPoint(pos[0], pos[1])
    }
    this.penSelect.runSelected()
    if (this.penSelect.selectPointIndex > -1 || this.penSelect.selectTangetPoint || this.penSelect.selectSegment > -1) {
      this.draggingInfo = {
        dragging: true,
        nextTangentLine: !!this.penSelect.nextTangentLine,
        x: pos[0],
        y: pos[1],
      }
    }
    this.pen.updateVectorNetwork?.()
    this.penSelect.nextTangentLine = null
  }

  handleMousemove = (e: MouseEvent) => {
    const pos = this.getMousePos(e);
    this.penSelect.runHoverTest(pos[0], pos[1])
    if (this.draggingInfo.dragging) {
      // 移动控制点
      if (this.penSelect.selectTangetPoint) {
        const {
          pointKey,
          segmentIndex,
        } = this.penSelect.selectTangetPoint
        const segment = this.pen.data.segments[segmentIndex]
        const oriPoint = this.pen.data.vertices[pointKey === 'tangentStart' ? segment.start : segment.end]
        segment[pointKey] = {
          x: pos[0] - oriPoint.x,
          y: pos[1] - oriPoint.y
        }
        this.pen.updateVectorNetwork?.()
        return
      }
      if (this.penSelect.selectSegment > -1) {
        const segment = this.pen.data.getSegment(this.penSelect.selectSegment)
        const startPoint = this.pen.data.getVertice(segment.start)
        const endPoint = this.pen.data.getVertice(segment.end)
        const moveX = pos[0] - this.draggingInfo.x
        const moveY = pos[1] - this.draggingInfo.y
        this.pen.movePoint(moveX + startPoint.x, moveY + startPoint.y, segment.start)
        this.pen.movePoint(moveX + endPoint.x, moveY + endPoint.y, segment.end)
        this.draggingInfo.x = pos[0]
        this.draggingInfo.y = pos[1]
        this.pen.updateVectorNetwork?.()
        return
      }
      // 移动点位
      if (this.pen.isSelect && this.penSelect.selectPointIndex >= 0) {
        this.pen.movePoint(pos[0], pos[1])
      }
      if (this.pen.isPen && this.penSelect.hoverTest?.type !== 'point') {
        // 设置下个线条的起点切线
        this.pen.setNextTangentLine(pos[0], pos[1])
        if (this.penSelect.selectPointIndex >= 0) {
          // 设置当前线条的终点切线
          this.pen.setLastSegmentTangentEnd(pos[0], pos[1], !this.draggingInfo.nextTangentLine)
        }
      }
      this.pen.updateVectorNetwork?.()

    }

    if (!isNull(this.penSelect.selectPointIndex) && this.pen.isPen) {
      this.penSelect.tipPoint = {x: pos[0], y: pos[1]}
    } else {
      this.penSelect.tipPoint = null
    }
  }

  handleMouseup = () => {
    this.draggingInfo = {
      dragging: false,
      nextTangentLine: false,
      x: 0,
      y: 0
    };
  }

  handleCurveTool() {
    const { hoverTest } = this.penSelect
    const { curveTool } = this.pen
    console.log(hoverTest)
    if (!hoverTest) return
    if (hoverTest.type === 'point') {
      curveTool.handlePoint(hoverTest.index)
    }
    if (hoverTest.type === 'segment') {
      curveTool.handleSegment()
    }
    if (hoverTest.type === 'tangent') {
      curveTool.hanldeTangent(hoverTest.tangentPoint)
    }
    this.pen.updateVectorNetwork?.()
  }
  
  getMousePos(e: MouseEvent): Vec2 {
    const rect = this.canvas.getBoundingClientRect();
    return [(e.clientX - rect.left), (e.clientY - rect.top)];
  }
}