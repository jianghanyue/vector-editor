export type ArcData = {
    "startingAngle": number,   // 圆弧or扇形起始角度
    "endingAngle": number,     // 结束角度
    "innerRadius": number      // 内圆半径，圆环使用
}

export type WindingRule = "EVENODD" | "NONE" | "NONZERO";

export type Point = {
    x: number;
    y: number;
  };