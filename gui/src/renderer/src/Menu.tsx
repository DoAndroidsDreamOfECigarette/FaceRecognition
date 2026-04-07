import React from "react";

interface MenuProps{
    onStartCamera:()=>void;
    onStartRegister:()=>void;
}

function Menu({onStartCamera,onStartRegister}:MenuProps){
    return(
        <div>
            <button onClick={onStartCamera}>开始识别</button>
            <button onClick={onStartRegister}>添加信息</button>
        </div>
    )
}

export default Menu;