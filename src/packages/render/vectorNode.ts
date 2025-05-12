import { CanvasKit, Rect } from "canvaskit-wasm";
import { ElementNode } from "../../type";
import { VectorPaths } from "../../type/figmaType";
import { daa } from "./daa";

export class VectorNode {
  _bound: Rect | undefined = undefined

  constructor(public node: ElementNode, private canvasKit: CanvasKit) {}

  get vectorPaths() {
    return daa(this.node.vectorData.vectorNetwork) as VectorPaths
  }

  get transform() {
    const { m00, m01, m02, m10, m11, m12 } = this.node.transform
    return [m00, m01, m02, m10, m11, m12]
  }

  translate(tx: number, ty: number) {
    const { m00, m01, m02, m10, m11, m12 } = this.node.transform
    this.node.transform.m02 = m00 * tx + m01 * ty + m02
    this.node.transform.m12 = m10 * tx + m11 * ty + m12
  }

  get invertTransform() {
    const [m00, m01, m02, m10, m11, m12] = this.transform
    const det = m00 * m11 - m10 * m01;

    if (det === 0) {
      throw new Error("Matrix is not invertible");
    }
    return [
      m11 / det,
      -m01 / det,
      (m01 * m12 - m11 * m02) / det,
      -m10 / det,
      m00 / det,
      (m10 * m02 - m00 * m12) / det
    ]
  }

  get vectorNetwork() {
    return this.node.vectorData.vectorNetwork
  }

  get boundingBox() {
    if (this._bound) return this._bound
    const path = this.canvasKit.Path.MakeFromSVGString(this.vectorPaths.map(item => item.data).join(' '))
    if (!path) return undefined
    path.transform(this.transform)
    this._bound = path.computeTightBounds()
    path.delete()
    return this._bound
  }

  get relativeboundingBox() {
    // if (this._bound) return this._bound
    const path = this.canvasKit.Path.MakeFromSVGString(this.vectorPaths.map(item => item.data).join(' '))
    if (!path) return undefined
    const bound = path.computeTightBounds()
    path.delete()
    return bound
  }
}