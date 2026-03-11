import Sidebar from "./components/Sidebar"
import ChatWorkspace from "./components/ChatWorkspace"
import CommandInput from "./components/CommandInput"
import SettingsPanel from "./components/SettingsPanel"
import ErrorToast from "./components/ErrorToast"
import NeuralVFX from "./vfx/NeuralVFX"

function App(){

 return(
  <>
   <NeuralVFX/>
   <Sidebar/>
   <ChatWorkspace/>
   <CommandInput/>
   <SettingsPanel/>
   <ErrorToast/>
  </>
 )
}

export default App