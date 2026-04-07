import { useState } from 'react';
import Camera from './Camera';
import Menu from './Menu'
import Register from './Register';

function App() {
  const [view,setView]=useState<"menu"|"camera"|"register">("menu");

  if(view=="camera"){
    return <Camera onBack={()=>setView("menu")}/>
  }else if(view=="register"){
    return <Register onBack={()=>setView("menu")}/>
  }

  return <Menu onStartCamera={()=>setView("camera")} onStartRegister={()=>setView("register")}/>
  
}

export default App
