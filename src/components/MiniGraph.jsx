/* Shared node layout used by every card (same composition, different color) */
const NODES = [
  { x:0.55, y:0.54, r:22, shape:'hub' },       // 0 central hub
  { x:0.61, y:0.13, r:16, shape:'triangle' },  // 1 top alert
  { x:0.29, y:0.27, r:15, shape:'diamond' },   // 2 upper-left
  { x:0.86, y:0.31, r:15, shape:'diamond' },   // 3 upper-right
  { x:0.20, y:0.62, r:15, shape:'diamond' },   // 4 left
  { x:0.40, y:0.78, r:13, shape:'diamond' },   // 5 lower-left
  { x:0.83, y:0.66, r:15, shape:'alert' },     // 6 right exclamation
]
const EDGES = [
  [0,2],[0,3],[0,4],[0,5],[0,1],[0,6],
]
const DASHED = [
  [1,6],  // long dashed from top alert to right exclamation
]

export default function MiniGraph({ color }) {
  const W = 360, H = 210
  const P = (n) => [n.x*W, n.y*H]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%"
      style={{ position:'absolute', inset:0 }} preserveAspectRatio="xMidYMid slice">

      {/* solid edges */}
      {EDGES.map(([a,b],i) => {
        const [x1,y1]=P(NODES[a]), [x2,y2]=P(NODES[b])
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color} strokeOpacity="0.5" strokeWidth="1.3" />
      })}
      {/* dashed edges */}
      {DASHED.map(([a,b],i) => {
        const [x1,y1]=P(NODES[a]), [x2,y2]=P(NODES[b])
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color} strokeOpacity="0.45" strokeWidth="1.3" strokeDasharray="4 4" />
      })}

      {NODES.map((n,i) => {
        const [cx,cy]=P(n), r=n.r
        return (
          <g key={i}>
            {/* white circle base with colored ring */}
            <circle cx={cx} cy={cy} r={r}
              fill="#ffffff" fillOpacity="0.92"
              stroke={color} strokeWidth={n.shape==='hub'?2:1.5} />
            {n.shape==='hub' && (
              <>
                <circle cx={cx} cy={cy} r={r-4} fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
                <path d={diamond(cx,cy,r*0.42)} fill={color} />
              </>
            )}
            {n.shape==='diamond' && (
              <path d={diamond(cx,cy,r*0.45)} fill={color} />
            )}
            {n.shape==='triangle' && (
              <path d={`M${cx},${cy-r*0.42} L${cx-r*0.42},${cy+r*0.32} L${cx+r*0.42},${cy+r*0.32} Z`}
                fill={color} />
            )}
            {n.shape==='alert' && (
              <>
                <line x1={cx} y1={cy-r*0.4} x2={cx} y2={cy+r*0.12} stroke={color} strokeWidth="2.2" strokeLinecap="round" />
                <circle cx={cx} cy={cy+r*0.42} r="1.4" fill={color} />
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function diamond(cx, cy, s) {
  return `M${cx},${cy-s} L${cx+s},${cy} L${cx},${cy+s} L${cx-s},${cy} Z`
}
