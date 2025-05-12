import initCanvasKit, { Canvas, CanvasKit, Paint, Path } from "canvaskit-wasm";
import CanvasKitWasm from "../../assets/canvaskit.wasm?url";
import { PenV2 } from "./penV2";
import { isNull } from "lodash";
import { VectorVertex } from "../../type/figmaType";
import { PenSelect } from "./select";
import { VectorNode } from "./vectorNode";

export const InitCnavas = async () =>
  await initCanvasKit({
    locateFile: () => CanvasKitWasm,
  });

export class Render {
  paint: Paint;
  pointStrokePaint: Paint;
  pointSelectedStrokePaint: Paint;
  pointFillPaint: Paint;
  tangentLinePaint: Paint;
  canvas: HTMLCanvasElement;
  surface: ReturnType<CanvasKit["MakeSurface"]>;
  skCanvas: Canvas;
  penSelect: PenSelect;
  selectStrokePaint: Paint;
  selectFillPaint: Paint;
  vectorNode: VectorNode | undefined = undefined
  
  constructor(private canvasKit: CanvasKit, private pen: PenV2, private elements: VectorNode[]) {
    this.penSelect = pen.select
    this.paint = this.getPaint();
    this.paint.setColor(canvasKit.Color(0, 0, 0, 1));
    this.paint.setStrokeWidth(4);
    this.paint.setStyle(canvasKit.PaintStyle.Stroke);

    this.tangentLinePaint = this.getPaint();
    this.tangentLinePaint.setColor(canvasKit.Color(170, 170, 170, 1));
    this.tangentLinePaint.setStyle(canvasKit.PaintStyle.Stroke);

    this.pointStrokePaint = this.getPaint();
    this.pointStrokePaint.setColor(canvasKit.Color(48, 148, 248, 1));
    this.pointStrokePaint.setStrokeWidth(1);
    this.pointStrokePaint.setStyle(canvasKit.PaintStyle.Stroke);

    this.pointSelectedStrokePaint = this.pointStrokePaint.copy();
    this.pointSelectedStrokePaint.setColor(canvasKit.Color(195, 230, 255, 1));

    this.pointFillPaint = this.getPaint();
    this.pointFillPaint.setColor(canvasKit.Color(255, 255, 255, 1));

    this.selectStrokePaint = this.pointFillPaint.copy()
    this.selectStrokePaint.setStyle(canvasKit.PaintStyle.Stroke);

    this.selectFillPaint = this.pointFillPaint.copy()
    this.selectFillPaint.setColor(canvasKit.Color(48, 148, 248, 1));

    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const { surface: s, skCanvas: sk } = this.resizeCanvasForDPR(this.canvas, window.innerWidth, window.innerHeight);
    this.surface = s;
    this.skCanvas = sk;
    window.onresize = () => {
      const { surface: s, skCanvas: sk } = this.resizeCanvasForDPR(this.canvas, window.innerWidth, window.innerHeight);
      this.surface = s;
      this.skCanvas = sk;
    };

    this.draw();
  }

  setPen(pen: PenV2) {
    this.pen = pen;
    this.penSelect = this.pen.select;
  }

  setSelectVectorNode(vectorNode: VectorNode | undefined) {
    this.vectorNode = vectorNode
  }

  getPaint() {
    const paint = new this.canvasKit.Paint()
    paint.setAntiAlias(true)
    return paint
  }

  resizeCanvasForDPR(
    canvas: HTMLCanvasElement,
    width: number,
    height: number
  ) {
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  
    const surface = this.canvasKit.MakeSWCanvasSurface("canvas")!;
    const skCanvas = surface.getCanvas();
  
    // 缩放 skCanvas，让绘图逻辑保持在“逻辑像素”坐标系
    skCanvas.scale(dpr, dpr);
  
    return { surface, skCanvas };
  }
  async draw() {
    this.skCanvas.clear(this.canvasKit.WHITE);
    this.elements.forEach((element) => {
      this.skCanvas.save()
      if (element.boundingBox) {
        this.skCanvas.drawRect(element.boundingBox, this.tangentLinePaint)
      }
      this.skCanvas.concat(element.transform)
      const vectorPaths = element.vectorPaths
      vectorPaths.forEach((path) => {
        const canvasPath = this.canvasKit.Path.MakeFromSVGString(path.data)
        if (!canvasPath) return
        this.skCanvas.drawPath(canvasPath, this.paint)
        if (element === this.vectorNode) {
          this.skCanvas.drawPath(canvasPath, this.pointStrokePaint)
        }
      });
      
      this.skCanvas.restore()
    });
    

    this.renderTipLine()
    this.renderTangentLine()
    this.renderNextTangetLine()

    // 渲染选中线条
    this.pen.vectorNetwork.segments.forEach((_, index) => {
      const hoverTest = this.penSelect.hoverTest
      const isHover = hoverTest && hoverTest.type === 'segment' && hoverTest.index === index
      const isSelect = this.penSelect.selectSegment === index
      const curve = this.pen.getCurve(index)
      const path = this.canvasKit.Path.MakeFromCmds([0, curve[0], curve[1], 4, curve[2], curve[3], curve[4], curve[5], curve[6], curve[7]]) as Path
      const paint = isSelect ? this.pointStrokePaint : this.tangentLinePaint
      this.skCanvas.drawPath(path, isHover ? this.pointSelectedStrokePaint : paint)
    })

    this.pen.vectorNetwork.vertices.forEach((item, index) => {
      let fillPaint = this.pointFillPaint;
      let strokePaint = this.pointStrokePaint;
      const hoverTest = this.penSelect.hoverTest
      const isSelect = hoverTest && hoverTest.type === 'point' && hoverTest.index === index
      if (this.penSelect.selectPointIndex === index) {
        fillPaint = this.pointFillPaint.copy()
        strokePaint = this.pointStrokePaint.copy()
        fillPaint.setColor(this.canvasKit.Color(48, 148, 248, 1))
        strokePaint.setColor(this.canvasKit.Color(255, 255, 255, 1))
        this.skCanvas.drawCircle(item.x, item.y, 5, fillPaint);
        this.skCanvas.drawCircle(item.x, item.y, 5, strokePaint);
        fillPaint.delete()
        strokePaint.delete()
      } else {
        this.skCanvas.drawCircle(item.x, item.y, 5, fillPaint);
        this.skCanvas.drawCircle(item.x, item.y, 5, isSelect ? this.pointSelectedStrokePaint : strokePaint);
      }
    })

    this.surface?.flush();
    // this.draw()
    requestAnimationFrame(() => this.draw());
  }

  renderTipLine() {
    if (!this.penSelect.tipPoint || this.penSelect.selectPointIndex === -1) return
    const selectPoint = this.pen.vectorNetwork.vertices[this.penSelect.selectPointIndex]
    this.skCanvas.drawLine(this.penSelect.tipPoint.x, this.penSelect.tipPoint.y, selectPoint.x, selectPoint.y, this.pointStrokePaint)
    this.skCanvas.drawCircle(this.penSelect.tipPoint.x, this.penSelect.tipPoint.y, 3, this.pointFillPaint);
    this.skCanvas.drawCircle(this.penSelect.tipPoint.x, this.penSelect.tipPoint.y, 3, this.pointStrokePaint);
  }

  renderTangentLine() {
    this.penSelect.displayTangentSegments.forEach(segmentIndex => {
      const segment = this.pen.vectorNetwork.segments[segmentIndex]
      const {
        tangentEnd,
        tangentStart,
        start,
        end
      } = segment
      const startPoint = this.pen.vectorNetwork.vertices[start]
      const endPoint = this.pen.vectorNetwork.vertices[end]
      const {selectTangetPoint} = this.penSelect
      if (tangentStart) this.renderTangetPoint(startPoint, tangentStart, !!selectTangetPoint && segmentIndex === selectTangetPoint.segmentIndex && selectTangetPoint.pointKey === 'tangentStart' )
      if (tangentEnd) this.renderTangetPoint(endPoint, tangentEnd, !!selectTangetPoint && segmentIndex === selectTangetPoint.segmentIndex && selectTangetPoint.pointKey === 'tangentEnd' )
    })
  }

  renderTangetPoint(startPoint: VectorVertex, endPoint: VectorVertex, isSelect: boolean = false) {
    if (endPoint.x !== 0 || endPoint.y !== 0) {
      const startX = startPoint.x + endPoint.x
      const startY = startPoint.y + endPoint.y
      this.skCanvas.drawLine(startX, startY, startPoint.x, startPoint.y, isSelect ? this.pointSelectedStrokePaint : this.tangentLinePaint)
      this.skCanvas.drawRect(this.canvasKit.XYWHRect(startX - 2.5, startY - 2.5, 5, 5), isSelect ? this.selectStrokePaint : this.pointStrokePaint)
      this.skCanvas.drawRect(this.canvasKit.XYWHRect(startX - 2.5, startY - 2.5, 5, 5), isSelect ? this.selectFillPaint : this.pointFillPaint)
    }
  }

  renderNextTangetLine() {
    if (!this.penSelect.nextTangentLine || isNull(this.penSelect.selectPointIndex)) return
    const startPoint = this.pen.vectorNetwork.vertices[this.penSelect.selectPointIndex]
    this.renderTangetPoint(startPoint, this.penSelect.nextTangentLine)
  }
}
