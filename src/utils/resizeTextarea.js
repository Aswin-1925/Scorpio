export default function resizeTextarea(el){
 if(!el) return
 requestAnimationFrame(()=>{
  el.style.height="auto"
  el.style.height=Math.min(el.scrollHeight,200)+"px"
 })
}