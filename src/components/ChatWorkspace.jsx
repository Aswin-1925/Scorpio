import MessageBubble from "./MessageBubble"

export default function ChatWorkspace({
 messages,
 isProcessing,
 scrollRef
}){

 return(

  <div
   ref={scrollRef}
   className="flex-1 overflow-y-auto p-10"
  >

   {messages.length===0 && (
    <div className="text-center opacity-20">
     Neural Nexus
    </div>
   )}

   {messages.map(m=>(
    <MessageBubble key={m.id} message={m}/>
   ))}

   {isProcessing && (
    <div className="opacity-20">
     Synthesizing...
    </div>
   )}

  </div>

 )
}