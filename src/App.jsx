import Sidebar from "./components/Sidebar"
import ChatWorkspace from "./components/ChatWorkspace"
import CommandInput from "./components/CommandInput"
import SettingsPanel from "./components/SettingsPanel"
import ErrorToast from "./components/ErrorToast"
import NeuralVFX from "./vfx/NeuralVFX"

function App(){

 return(
  <div className="flex h-screen w-screen overflow-hidden">

   <NeuralVFX/>

   <Sidebar/>

   <main className="flex flex-col flex-1">

    <ChatWorkspace/>

    <CommandInput/>

   </main>

   <SettingsPanel/>

   <ErrorToast/>

  </div>
 )

}

export default App