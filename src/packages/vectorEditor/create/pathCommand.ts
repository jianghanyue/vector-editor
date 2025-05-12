import { Point, WindingRule } from "../../../type/vector";

/**
 * svg路径处理，收集svg指令，支持M L C Z四种指令，存储数字指令
 * 参数t定义路径填充规则
 */
export class PathCommands {
    static isCommands = false;
    windingRule: WindingRule;
    lastPosition: Point | null = null;
    commands: (string | number)[] = [];
    commandsNumber: number[] = [];
    isCommands;
    constructor(t: WindingRule = "NONZERO") {
      (this.windingRule = t),
        (this.isCommands =
          this.windingRule === "NONE" ? false : PathCommands.isCommands);
    }
    addPathCommands(pathCommands: PathCommands) {
      this.lastPosition = null
      this.commands = this.commands.concat(pathCommands.commands)
      this.commandsNumber = this.commandsNumber.concat(pathCommands.commandsNumber)
    }
    moveTo(t: Point) {
      this.commands.push("M", t.x, t.y),
        this.commandsNumber.push(0, t.x, t.y),
        (this.lastPosition = t);
    }
    lineTo(t: Point) {
      this.commands.push("L", t.x, t.y),
        this.commandsNumber.push(1, t.x, t.y),
        (this.lastPosition = t);
    }
    curveTo(t: Point, o: Point, r: Point) {
      this.commands.push("C", t.x, t.y, o.x, o.y, r.x, r.y),
        this.commandsNumber.push(4, t.x, t.y, o.x, o.y, r.x, r.y),
        (this.lastPosition = r);
    }
    closePath() {
      this.commands.push("Z"),
        this.commandsNumber.push(5),
        (this.lastPosition = null);
    }
    // 转为路径字符串
    toVectorPath() {
      return {
        windingRule: this.windingRule,
        data: this.commands.join(" "),
      };
    }
    // 转为路径指令
    toCmdPath() {
      return {
        windingRule: this.windingRule,
        commandsData: this.commandsNumber,
      };
    }
  }