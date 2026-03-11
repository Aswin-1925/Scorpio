import { Plus, Search, Power } from "lucide-react"

export default function Sidebar({
 history,
 searchQuery,
 setSearchQuery,
 startNewChat,
 confirmDelete,
 user,
 signOut
}) {

 return (
  <aside className="w-72 border-r flex flex-col">

   <div className="p-6 font-bold text-xl">
    Scorpio
   </div>

   <button
    onClick={startNewChat}
    className="flex items-center gap-2 p-4"
   >
    <Plus size={16}/> New Chat
   </button>

   <div className="p-4">
    <input
     value={searchQuery}
     onChange={e=>setSearchQuery(e.target.value)}
     placeholder="Search"
     className="w-full border p-2"
    />
   </div>

   <div className="flex-1 overflow-y-auto">

    {history.map(item=>(
     <div
      key={item.id}
      className="p-3 flex justify-between"
     >
      <span>{item.text}</span>

      <button
       onClick={()=>confirmDelete(item.id)}
      >
       delete
      </button>
     </div>
    ))}

   </div>

   <div className="p-4 border-t">

    <div>{user?.displayName}</div>

    <button
     onClick={()=>signOut()}
     className="flex items-center gap-2"
    >
     <Power size={16}/> Logout
    </button>

   </div>

  </aside>
 )
}