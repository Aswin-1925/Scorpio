import { Send, Mic, Paperclip } from "lucide-react"

export default function CommandInput({
 command,
 setCommand,
 handleCommand,
 handleFileUpload,
 handleDictation,
 textareaRef,
 isProcessing
}){

 return(

  <div className="p-6 border-t">

   <textarea
    ref={textareaRef}
    value={command}
    onChange={e=>setCommand(e.target.value)}
    className="w-full border p-4"
    placeholder="Draft Neural Prompt..."
   />

   <div className="flex justify-between mt-4">

    <div className="flex gap-2">

     <button onClick={handleDictation}>
      <Mic size={18}/>
     </button>

     <label>
      <Paperclip size={18}/>
      <input
       type="file"
       hidden
       multiple
       onChange={handleFileUpload}
      />
     </label>

    </div>

    <button
     onClick={handleCommand}
     disabled={isProcessing}
     className="flex items-center gap-2"
    >
     Enter <Send size={16}/>
    </button>

   </div>

  </div>

 )
}