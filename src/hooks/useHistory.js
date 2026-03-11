import { useEffect, useState } from "react"
import { db } from "../core/firebase"
import { collection, onSnapshot } from "firebase/firestore"

export default function useHistory(user){

 const [history,setHistory]=useState([])

 useEffect(()=>{

  if(!user) return

  const ref = collection(db,"history")

  const unsub = onSnapshot(ref,snap=>{
   setHistory(
    snap.docs.map(d=>({id:d.id,...d.data()}))
   )
  })

  return unsub

 },[user])

 return history
}