import { useEffect } from 'react'
import { ToolType } from '../../../type'
import './index.css'
import { PenSVG, SelectSVG } from './svgFile'
const ToolBar = (props: {setCurrentTool: (tool: ToolType) => void, currentTool: ToolType}) => {
  const toolList = [
    {
      icon: <SelectSVG></SelectSVG>,
      key: 'select'
    },
    {
      icon: <PenSVG></PenSVG>,
      key: 'pen'
    },
  ]

  useEffect(() => {
    window.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'p':
          props.setCurrentTool('pen')
          break;
        case 'v':
          props.setCurrentTool('select')
          break;
        default:
          break;
      }
    })
  },[])

  return <div className='tool-bar'>
    <div className='tool-bar-content'>
      {
        toolList.map((item, index) => {
          return <div key={index} className={`tool-bar-item ${props.currentTool===item.key ? 'tool-bar-item-selected' : ''}`} onClick={() => {props.setCurrentTool(item.key as ToolType)}}>
            {item.icon}
          </div>
        })
      }
    </div>
  </div>
}

export default ToolBar