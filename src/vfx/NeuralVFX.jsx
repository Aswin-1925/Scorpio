import { Canvas, useFrame } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import * as random from "maath/random"
import { useMemo, useRef } from "react"

function ParticleField({ theme }) {

 const ref = useRef()

 const particleCount = useMemo(()=>{
  if(typeof window==="undefined") return 400
  const count = window.innerWidth < 768 ? 200 : 500
  return Math.min(count,600)
 },[])

 const sphere = useMemo(
  ()=>random.inSphere(new Float32Array(particleCount),{radius:5.5}),
  [particleCount]
 )

 const color = theme==="dark" ? "#ffffff" : "#000000"

 useFrame((state,delta)=>{
  if(ref.current){
   ref.current.rotation.x -= delta/160
   ref.current.rotation.y -= delta/170
  }
 })

 return(
  <group rotation={[0,0,Math.PI/4]}>
   <Points ref={ref} positions={sphere} stride={3}>
    <PointMaterial
     transparent
     color={color}
     size={0.015}
     sizeAttenuation
     depthWrite={false}
     opacity={0.02}
    />
   </Points>
  </group>
 )
}

export default function NeuralVFX({theme}){

 return(
  <div className="fixed inset-0 -z-10">
   <Canvas camera={{position:[0,0,6],fov:50}} dpr={[1,2]}>
     <ParticleField theme={theme}/>
   </Canvas>
  </div>
 )
}