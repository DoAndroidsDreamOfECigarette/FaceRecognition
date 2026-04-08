import os
import cv2
import numpy
import pickle
import insightface
from fastapi import FastAPI,File,UploadFile,Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

FACE_DB_PATH="./Utils/face_database.pkl"


print("正在加载人脸识别模型...")
model=insightface.app.FaceAnalysis(name="buffalo_l",root='./Utils',providers=['CPUExecutionProvider'])
model.prepare(ctx_id=-1)
print("模型加载完成")

app=FastAPI(
    title="人脸识别系统API",
    description="基于深度学习的人脸识别接口,支持上传图片进行识别",
    version="0.0.1"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_face_database():
    if(os.path.exists(FACE_DB_PATH)):
        with open(FACE_DB_PATH,'rb') as f:
            face_db=pickle.load(f)
        print(f"成功加载人脸库，共录入{len(face_db)}人")
        return face_db
    else:
        print("人脸库不存在,创建新库")
        return{}

face_db=load_face_database()

def get_face_embedding(img):
    img_rgb=cv2.cvtColor(img,cv2.COLOR_BGR2RGB)

    faces=model.get(img_rgb)
    if(len(faces))==0:
        print("未检测到人脸")
        return None
    
    face=faces[0]

    embedding=face.normed_embedding
    return embedding

async def get_face_embedding_by_file(file:UploadFile=File(...)):
    contents=await file.read()
    nparr=numpy.frombuffer(contents,numpy.uint8)
    img=cv2.imdecode(nparr,cv2.IMREAD_COLOR)
    if img is None:
        return {"error":"图片解码失败"}

    cv2.imwrite("resources/debug_face.jpg",img)
    embedding=get_face_embedding(img)
    if embedding is None:
        return {"error":"未检测到人脸"}
    img_rgb=cv2.cvtColor(img,cv2.COLOR_BGR2RGB)
    faces=model.get(img_rgb)
    if(len(faces))==0:
        print("未检测到人脸")
        return None
    
    return faces[0].normed_embedding

def save_face_database(face_db):
    with open(FACE_DB_PATH,'wb') as f:
        pickle.dump(face_db,f)
    print(f"人脸库已保存，当前共{len(face_db)}人")

def recognize_face(image_path,threshold=0.6):
    embedding=get_face_embedding(image_path)
    if embedding is None:
        return "未知",0.0
    face_db=load_face_database()
    if not face_db:
        return "库为空",0.0
    
    max_sim=0
    name_result="未知"

    for name,emb in face_db.items():
        sim=numpy.dot(embedding,emb)
        if sim>max_sim:
            max_sim=sim
            name_result=name

    if max_sim<threshold:
        name_result="未知"
    
    return name_result,round(float(max_sim),4)

def recognize_face_by_embedding(embedding,threshold=0.6):
    if embedding is None:
        return "未知",0.0
    global face_db
    if face_db is None:
        face_db=load_face_database()
    if not face_db:
        return "库为空",0.0
    
    max_sim=0
    name_result="未知"

    for name,emb in face_db.items():
        sim=numpy.dot(embedding,emb)
        if sim>max_sim:
            max_sim=sim
            name_result=name

    if max_sim<threshold:
        name_result="未知"
    
    return name_result,round(float(max_sim),4)


@app.post("/recognize_by_file")
async def recognize_by_file(file:UploadFile=File(...)):
    embedding=await get_face_embedding_by_file(file)
    if embedding is not None:
        name,sim=recognize_face_by_embedding(embedding)
        print(f"识别结果:姓名:{name},相似度:{sim}")
        return {"name":f"{name}"}

@app.post("/register")
async def register(name:str=Form(...),file:UploadFile=File(...)):
    contents=await file.read()
    nparr=numpy.frombuffer(contents,numpy.uint8)
    img=cv2.imdecode(nparr,cv2.IMREAD_COLOR)
    if img is None:
        return {"error":"图片解码失败"}

    cv2.imwrite("resources/save_face.jpg",img)
    embedding=get_face_embedding(img)
    if embedding is not None:
        global face_db
        face_db[name]=embedding
        save_face_database(face_db)
        return {"message":"保存人脸成功"}

# @app.post("/save_face")
# async def save_face(name,file:UploadFile=File(...)):
#     contents=await file.read()
#     nparr=numpy.frombuffer(contents,numpy.uint8)
#     img=cv2.imdecode(nparr,cv2.IMREAD_COLOR)
#     if img is None:
#         return {"error":"图片解码失败"}
    
#     cv2.imwrite("resources/debug_face.jpg",img)
#     embedding=get_face_embedding(img)
#     if embedding is None:
#         return {"error":"未检测到人脸"}

#     print(f"成功提取特征,向量维度:{len(embedding)}")
#     print(f"前10个值:{embedding[:10]}")
#     face_db=load_face_database()
#     face_db[name]=embedding
#     save_face_database(face_db)

@app.get("/face_list")
def face_list():
    names=list(face_db.keys())
    return {"names":names}

@app.delete("/delete_face")
def delete_face(name:str=Form(...)):
    global face_db
    if name not in face_db:
        return {"error":f"人脸库中不存在'{name}'"}
    del face_db[name]
    save_face_database(face_db)
    return {"message":f"已删除'{name}'"}

@app.get("/recognize_test")
def recognize_test():
    test_image='./resources/zxg.jpg'
    emb=get_face_embedding(test_image) # type: ignore
    if emb is not None:
        # print(f"成功提取特征,向量维度:{len(emb)}")
        # print(f"前10个值:{emb[:10]}")
        # face_db=load_face_database()
        # face_db["张湘赣"]=emb
        # save_face_database(face_db)
        # face_db_reload=load_face_database()
        # print(f"验证:库中是否有'张湘赣'->{'张湘赣' in face_db_reload}")
        name,sim=recognize_face(test_image)
        print(f"识别结果:姓名:{name},相似度:{sim}")
        return {"message":f"识别结果:姓名:{name},相似度:{sim}"}
    else:
        print("特征提取失败")
        return {"message":"未找到人脸"}

if __name__=='__main__':
    uvicorn.run(app,host="0.0.0.0",port=5000)
    # test_image="./resources/lwh.jpg"
    # img=cv2.imread(test_image)
    # emb=get_face_embedding(img)
    # if emb is not None:
    #     face_db=load_face_database()
    #     face_db["廖炜灏"]=emb
    #     save_face_database(face_db)
    
    # face_db=load_face_database()
    # del face_db["廖炜灏"]
    # save_face_database(face_db)
        