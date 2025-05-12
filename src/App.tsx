import { useEffect, useRef, useState } from 'react'
import './App.css'
import { test } from './packages/vectorEditor/create/basicVector'
import { InitCnavas, Render } from './packages/render/render'
import { PenV2 } from './packages/render/penV2'
import ToolBar from './packages/vectorEditor/toolBar'
import { ElementNode, ToolType } from './type'
import { elements } from './packages/utils/mockData'
import { VectorNode } from './packages/render/vectorNode'
import { cloneDeep } from 'lodash'
import { VectorNetwork } from './type/figmaType'

function getMousePos(e: MouseEvent) {
  const canvas = document.getElementById('canvas')
  if (!canvas) return [0, 0]
  const rect = canvas.getBoundingClientRect();
  return [(e.clientX - rect.left), (e.clientY - rect.top)];
}
function App() {
  const [currentTool, setCurrentTool] = useState<ToolType>('select')
  const penRef = useRef<PenV2>(null)
  const vectorNodes = useRef<VectorNode[]>([])
  const hoverNode = useRef<VectorNode>(undefined)
  const selectNode = useRef<VectorNode>(undefined)
  const render = useRef<Render>(undefined)

  const init = async () => {
    const canvaskit = await InitCnavas()
    const pen = new PenV2(document.getElementById('canvas') as HTMLCanvasElement)
    pen.currentState = currentTool
    penRef.current = pen
    vectorNodes.current = elements.map(item => new VectorNode(item as ElementNode, canvaskit))
    render.current = new Render(canvaskit, pen, vectorNodes.current);
    (window as any).printData = () => {
      console.log(pen.vectorNetwork)
    }
  }

  const bindEvents = () => {

    window.addEventListener('mousemove', (e) => {
      const pos = getMousePos(e)
      hoverNode.current = vectorNodes.current.find(vectorNode => {
        if (!vectorNode.boundingBox) return
        const [x1, y1, x2, y2] = vectorNode.boundingBox
        return pos[0] > x1 && pos[0] < x2 && pos[1] > y1 && pos[1] < y2
      })
      render.current?.setSelectVectorNode(hoverNode.current)
    })

    window.addEventListener('dblclick', () => {
      if (hoverNode.current && penRef.current) {
        selectNode.current = hoverNode.current
        const vn = cloneDeep(hoverNode.current.vectorNetwork) as VectorNetwork
        const [a, c, e, b, d, f] = hoverNode.current.transform

        vn.vertices.forEach(item => {
          item.x = a * item.x + c * item.y + e
          item.y = b * item.x + d * item.y + f
        })

        penRef.current.data.setVectorNetwork(vn)
        penRef.current.updateVectorNetwork = () => {
          if (!selectNode.current || !penRef.current) return
          const [a, c, e, b, d, f] = selectNode.current.invertTransform
          selectNode.current.node.vectorData.vectorNetwork = {
            ...penRef.current.vectorNetwork,
            vertices: penRef.current.vectorNetwork.vertices.map(item => ({
              ...item,
              x: a * item.x + c * item.y + e,
              y: b * item.x + d * item.y + f
            }))
          }
          selectNode.current._bound = undefined
        }

      } else if (selectNode.current) {
        penRef.current?.clear()
        penRef.current = new PenV2(document.getElementById('canvas') as HTMLCanvasElement)
        penRef.current.currentState = currentTool
        render.current?.setPen(penRef.current)
        const bound = selectNode.current.relativeboundingBox
        if (bound && (bound[0] > 0 || bound[1] > 0)) {
          selectNode.current.translate(bound[0], bound[1])
          selectNode.current.node.vectorData.vectorNetwork.vertices.forEach(item => {
            item.x -= bound[0]
            item.y -= bound[1]
          })
        }
      }
    })
  }

  useEffect(() => {
    if (!penRef.current) return
    penRef.current.setCurrentState(currentTool);
  }, [currentTool])

  useEffect(() => {
    init()
    test()
    bindEvents()
  }, [])

  return (
    <>
      <canvas id="canvas"></canvas>
      <ToolBar setCurrentTool={setCurrentTool} currentTool={currentTool}></ToolBar>
    </>
  )
}

export default App
