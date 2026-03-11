export default function ErrorToast({
 error,
 setError
}){

 if(!error) return null

 return(

  <div className="fixed bottom-6 right-6 bg-red-500 text-white p-4">

   {error}

   <button
    onClick={()=>setError(null)}
    className="ml-4"
   >
    x
   </button>

  </div>

 )
}