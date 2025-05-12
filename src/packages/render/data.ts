import {
  HandleMirroring,
  VectorNetwork,
  VectorPaths,
  VectorSegment,
  VectorVertex,
} from "../../type/figmaType";
import { daa } from "./daa";

export class PenData {
  vectorNetwork: VectorNetwork = {
    vertices: [],
    segments: [],
    regions: [],
  };
  constructor() {}

  setVectorNetwork(vectorNetwork: VectorNetwork) {
    this.vectorNetwork = vectorNetwork;
  }

  addVertice(point: VectorVertex) {
    return this.vectorNetwork.vertices.push(point) - 1;
  }

  addSegment(segment: VectorSegment) {
    return this.vectorNetwork.segments.push(segment) - 1;
  }

  get vectorPath() {
    return daa(this.vectorNetwork) as VectorPaths;
  }

  get segments() {
    return this.vectorNetwork.segments;
  }

  get vertices() {
    return this.vectorNetwork.vertices;
  }

  get verticesCount() {
    return this.vectorNetwork.vertices.length;
  }

  get lastSegment() {
    return this.vectorNetwork.segments[this.vectorNetwork.segments.length - 1];
  }

  getVertice(index: number) {
    return this.vectorNetwork.vertices[index];
  }

  setVertice(index: number, point: VectorVertex) {
    this.vectorNetwork.vertices[index] = point;
  }

  getSegment(index: number) {
    return this.vectorNetwork.segments[index];
  }

  getSegmentsByVertice(index: number) {
    const result: number[] = []
    this.vectorNetwork.segments.forEach(
      (item, segmentIndex) => {
        if (item.start === index || item.end === index)  {
          result.push(segmentIndex)
        }
      }
    );
    return result
  }

  delTangentPoint(key: string) {
    const [segmentIndex, pointKey] = key.split(":");
    this.vectorNetwork.segments[Number(segmentIndex)][pointKey as "tangentStart" | "tangentEnd"] = {
      x: 0,
      y: 0,
    };
  }

  setHandleMirroring(index: number, mirroringType: HandleMirroring) {
    this.vectorNetwork.vertices[index].handleMirroring = mirroringType;
  }
  delPoint(index: number) {
    this.vectorNetwork.vertices.splice(index, 1);
    this.vectorNetwork.segments = this.vectorNetwork.segments.filter(
      (item) => item.start !== index && item.end !== index
    );
    const resetSegment = (i: number) => this.vectorNetwork.segments.forEach((item) => {
      if (item.start > i) {
        item.start -= 1;
      }
      if (item.end > i) {
        item.end -= 1;
      }
    });
    resetSegment(index)
    this.vectorNetwork.vertices.forEach((_, index) => {
      const notFind = !this.segments.find((item) => {return item.start === index || item.end === index})
      if (notFind) {
        this.vectorNetwork.vertices.splice(index, 1);
        resetSegment(index)
      }
    })
    console.log(this.vectorNetwork,'this.vectorNetwork')
  }

  delSegment(index: number) {
    const segment = this.segments[index]
    this.vectorNetwork.segments.splice(index, 1);
    [segment.start, segment.end].forEach((index) => {
      const notFind = !this.segments.find((item) => {return item.start === index || item.end === index})
      if (notFind) {
        this.delPoint(index)
      }
    })
  }
}
