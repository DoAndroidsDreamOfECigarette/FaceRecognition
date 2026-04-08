import { useState } from 'react';
import Camera from './Camera';
import Menu from './Menu'
import Register from './Register';
import Delete from './Delete';

function App() {
  const [view,setView]=useState<"menu"|"camera"|"register"|"delete">("menu");

  if(view=="camera"){
    return <Camera onBack={()=>setView("menu")}/>
  }else if(view=="register"){
    return <Register onBack={()=>setView("menu")}/>
  }else if(view=="delete"){
    return <Delete onBack={()=>setView("menu")}/>
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Menu onStartCamera={()=>setView("camera")} onStartRegister={()=>setView("register")} onStartDelete={()=>setView("delete")}/>
    </div>
  )
}

export default App
