import { useEffect, useState } from "react"
import { auth } from "../core/firebase"
import { onAuthStateChanged, signInAnonymously } from "firebase/auth"

export default function useAuth(){

 const [user,setUser]=useState(null)

 useEffect(()=>{

  return onAuthStateChanged(auth,async u=>{

   if(u){
    setUser(u)
   }
   else{
    await signInAnonymously(auth)
   }

  })

 },[])

 return user
}