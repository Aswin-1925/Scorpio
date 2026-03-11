export default function MessageBubble({message}){

 const isAI = message.role === "ai"

 return(

  <div
   className={`flex ${isAI?"justify-start":"justify-end"}`}
  >

   <div
    className="max-w-[70%] p-6 border rounded-xl"
   >

    <p>{message.text}</p>

    {message.retry && (
     <div className="mt-4 flex gap-2">
      <button>Retry</button>
      <button>Copy</button>
     </div>
    )}

   </div>

  </div>

 )
}