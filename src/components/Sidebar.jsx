import { Plus, Power } from "lucide-react"

export default function Sidebar({
 history = [],
 searchQuery = "",
 setSearchQuery,
 startNewChat,
 confirmDelete,
 user,
 signOut
}) {

 return (
  <aside className="w-72 border-r flex flex-col h-full">

   {/* Logo / Title */}
   <div className="p-6 font-bold text-xl">
    Scorpio
   </div>

   {/* New Chat */}
   <button
    onClick={startNewChat}
    className="flex items-center gap-2 p-4 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
   >
    <Plus size={16}/> New Chat
   </button>

   {/* Search */}
   <div className="p-4">
    <input
     id="search"
     name="search"
     type="text"
     aria-label="Search chats"
     value={searchQuery}
     onChange={(e)=>setSearchQuery?.(e.target.value)}
     placeholder="Search"
     className="w-full border rounded p-2 text-sm"
    />
   </div>

   {/* Chat History */}
   <div className="flex-1 overflow-y-auto">

    {history?.map((item)=>(
     <div
      key={item.id}
      className="p-3 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
     >
      <span className="truncate">{item.text}</span>

      <button
       onClick={()=>confirmDelete?.(item.id)}
       className="text-xs opacity-60 hover:opacity-100"
      >
       delete
      </button>
     </div>
    ))}

   </div>

   {/* User Section */}
   <div className="p-4 border-t">

    <div className="text-sm mb-2">
     {user?.displayName || "User"}
    </div>

    <button
     onClick={()=>signOut?.()}
     className="flex items-center gap-2 text-sm"
    >
     <Power size={16}/> Logout
    </button>

   </div>

  </aside>
 )
}