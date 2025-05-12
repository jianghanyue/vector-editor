import { ArcData } from "../../../type/vector";
import { PathCommands } from "./pathCommand";

const k = 0.5522847498307936;

const defaultResult = (isCommand = false) => {
    const pathCommands = new PathCommands();
    return isCommand ? pathCommands.toCmdPath() : pathCommands.toVectorPath();
}

class BasicVector {
    constructor() {}
    rectangle(w: number, h: number, isCommand = false) {
        const pathCommands = new PathCommands();
        pathCommands.moveTo({ x: 0, y: 0 });
        pathCommands.lineTo({ x: w, y: 0 });
        pathCommands.lineTo({ x: w, y: h });
        pathCommands.lineTo({ x: 0, y: h });
        pathCommands.lineTo({ x: 0, y: 0 });
        pathCommands.closePath();
        return isCommand ? pathCommands.toCmdPath() : pathCommands.toVectorPath();
    }

    ellipse(w: number, h: number, arcData: ArcData, isCommand = false) {
        if (arcData.startingAngle === 0 && arcData.endingAngle === 6.2831854820251465 && arcData.innerRadius === 0) {
            const cx = w / 2;
            const cy = h / 2;
            return this.oval(cx, cy, cx, cy, isCommand);
        }
        
        return defaultResult(isCommand);
    }

    // private circle(cx: number, cy: number, r: number, isCommand = false) {
    //     const l = k * r;

    //     const pathCommands = new PathCommands();
    //     pathCommands.moveTo({x: cx + r, y: cy})
    //     pathCommands.curveTo({x: cx + r, y: cy + l}, {x: cx + l, y: cy + r}, {x: cx, y: cy + r});
    //     pathCommands.curveTo({x: cx - l, y: cy + r}, {x: cx - r, y: cy + l}, {x: cx - r, y: cy});
    //     pathCommands.curveTo({x: cx - r, y: cy - l}, {x: cx - l, y: cy - r}, {x: cx, y: cy - r});
    //     pathCommands.curveTo({x: cx + l, y: cy - r}, {x: cx + r, y: cy - l}, {x: cx + r, y: cy});
    //     pathCommands.closePath();
        
    //     return isCommand ? pathCommands.toCmdPath() : pathCommands.toVectorPath();
    // }

    private oval(cx: number, cy: number, rx: number, ry: number, isCommand = false) {
        const lx = rx * k;
        const ly = ry * k;

        const pathCommands = new PathCommands();
        pathCommands.moveTo({x: cx + rx, y: cy})
        pathCommands.curveTo({x: cx + rx, y: cy + ly}, {x: cx + lx, y: cy + ry}, {x: cx, y: cy + ry});
        pathCommands.curveTo({x: cx - lx, y: cy + ry}, {x: cx - rx, y: cy + ly}, {x: cx - rx, y: cy});
        pathCommands.curveTo({x: cx - rx, y: cy - ly}, {x: cx - lx, y: cy - ry}, {x: cx, y: cy - ry});
        pathCommands.curveTo({x: cx + lx, y: cy - ry}, {x: cx + rx, y: cy - ly}, {x: cx + rx, y: cy});
        pathCommands.closePath();
        
        return isCommand ? pathCommands.toCmdPath() : pathCommands.toVectorPath();
    }

    start(w: number, h: number, count = 5, starInnerScale: 0.3819660246372223, isCommand = false) {
        const pathCommands = new PathCommands();

        const cx = w / 2;
        const cy = h / 2;
        const outerRadius = Math.min(w, h) / 2;
        const innerRadius = outerRadius * starInnerScale;
      
        const angleStep = (Math.PI * 2) / (count * 2);
      
        for (let i = 0; i < count * 2; i++) {
          const isOuter = i % 2 === 0;
          const radius = isOuter ? outerRadius : innerRadius;
          const angle = i * angleStep - Math.PI / 2;
      
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
      
          if (i === 0) {
            pathCommands.moveTo({x, y});
          } else {
            pathCommands.lineTo({x, y});
          }
        }
      
        pathCommands.closePath();
        return isCommand ? pathCommands.toCmdPath() : pathCommands.toVectorPath();
    }

    polygon(w: number, h: number, count = 5, isCommand = false) {
        const pathCommands = new PathCommands();

        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(w, h) / 2;

        const angleStep = (Math.PI * 2) / count;

        for (let i = 0; i < count; i++) {
            const angle = i * angleStep - Math.PI / 2; // 从正上方开始
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;

            if (i === 0) {
                pathCommands.moveTo({x, y});
            } else {
                pathCommands.lineTo({x, y});
            }
        }

        pathCommands.closePath();
        return isCommand ? pathCommands.toCmdPath() : pathCommands.toVectorPath();
    }
}

export const test = () => {
    const basicVector = new BasicVector();
    const rectangle = basicVector.rectangle(100, 100);
    const ellipse = basicVector.ellipse(100, 100, {
        startingAngle: 0,
        endingAngle: 6.2831854820251465,
        innerRadius: 0
    });
    const star = basicVector.start(100, 100, 5, 0.3819660246372223);
    const polygon = basicVector.polygon(100, 100, 4);
    console.log({rectangle,ellipse,star,polygon});
}