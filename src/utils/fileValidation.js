import { MAX_FILE_SIZE } from "../core/constants"

export function validateFiles(files){

 const allowedExt=["png","jpg","jpeg","webp","pdf","txt","json"]

 const allowedMime=[
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/json"
 ]

 const validated=[]

 for(const f of files){

  const parts=f.name.toLowerCase().split(".")
  const ext=parts.length>1?parts.pop():""

  const extOk=allowedExt.includes(ext)
  const mimeOk=!f.type || allowedMime.includes(f.type)

  if(extOk && mimeOk && f.size<MAX_FILE_SIZE){
   validated.push(f)
  }

 }

 return validated
}