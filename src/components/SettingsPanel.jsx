export default function SettingsPanel({
 open,
 setOpen,
 user
}){

 if(!open) return null

 return(

  <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

   <div className="bg-white p-10 w-[700px]">

    <h2>System Vault</h2>

    <div className="mt-4">
     User: {user?.displayName}
    </div>

    <button
     onClick={()=>setOpen(false)}
     className="mt-6"
    >
     Close
    </button>

   </div>

  </div>

 )
}