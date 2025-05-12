declare module "pathkit-wasm";
import { VectorNetwork } from "./figmaType";

export type ToolType = "pen" | "select" | "curve";

export type TangentKey = "tangentStart" | "tangentEnd";

export type ElementNode = {
  vectorData: {
    vectorNetwork: VectorNetwork;
  };
  transform: {
    m00: number;
    m01: number;
    m02: number;
    m10: number;
    m11: number;
    m12: number;
  };
};
