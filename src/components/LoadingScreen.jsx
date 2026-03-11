import { RefreshCw } from "lucide-react"

export default function LoadingScreen(){

 return(

  <div className="fixed inset-0 flex items-center justify-center">

   <RefreshCw className="animate-spin"/>

  </div>

 )
}