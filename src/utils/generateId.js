export default function generateId(){
 return crypto?.randomUUID?.()
  || `${Date.now()}-${Math.random().toString(36).slice(2)}`
}