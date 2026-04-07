import React, { useRef, useEffect, useState } from 'react'
import * as faceapi from 'face-api.js'

interface CameraProps {
  onBack:()=>void;
}

const Camera: React.FC<CameraProps> = ({onBack}) => {
  const videoRef=useRef<HTMLVideoElement>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading]=useState(true);
  const modelLoadedRef=useRef(false);
  const detectionsRef=useRef<faceapi.FaceDetection[]>([]);
  const frameCounter=useRef(0);
  const faceNameRef=useRef<string|null>(null);
  const isRecognize=useRef(false);

  function waitForVideo():void {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      drawFrame();
    } else {
      setTimeout(waitForVideo, 100);
    }
  }

  function drawFrame():void {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        if (modelLoadedRef.current && video.readyState >= 2) {
          for (const det of detectionsRef.current) {
            const { x, y, width, height } = det.box;
            const transformedX = canvas.width - x - width;
            ctx.strokeStyle = 'lime';
            ctx.lineWidth = 2;
            ctx.strokeRect(transformedX, y, width, height);
            if (faceNameRef.current) {
              ctx.fillStyle = 'lime';
              ctx.font = '16px Arial';
              ctx.fillText(faceNameRef.current, transformedX, y - 5);
            }
          }

          frameCounter.current = (frameCounter.current + 1) % 1
          if (frameCounter.current === 0) {
            faceapi
              .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
              .then((detections) => {
                detectionsRef.current = detections
                if (detections.length>0&&!isRecognize.current) {
                  isRecognize.current=true;
                  for(let i=0;i<detections.length;i++){
                    const {x,y,width,height}=detections[i].box;
                    const tempCanvas=document.createElement('canvas');
                    tempCanvas.width=width;
                    tempCanvas.height=height;
                    const tempCtx = tempCanvas.getContext('2d');
                    if (tempCtx) {
                      tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height)
                      tempCanvas.toBlob((blob) => {
                        if (blob) {
                          recongnizeFace(blob).finally(()=>{
                            isRecognize.current=false;
                          });
                        }else{
                          isRecognize.current=false;
                        }
                      }, 'image/jpeg')
                    }
                  }
                }
                return detections;
              })
          }
        }
      }
    }
    requestAnimationFrame(drawFrame)
  }

  async function startCamera():Promise<void>{
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsLoading(false)
      }
    } catch (err) {
      console.error('摄像头启动失败', err)
      setIsLoading(false)
    }
  }

  async function loadModels() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
    modelLoadedRef.current = true
    console.log('人脸检测模型加载完成')
  }

  async function recongnizeFace(blob: Blob) {
    const formData = new FormData()
    formData.append('file', blob, 'face.jpg')
    try {
      const res = await fetch('http://127.0.0.1:5000/recognize_by_file', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.name) {
        faceNameRef.current = data.name
      }
    } catch (error) {
      console.error('识别失败', error)
    }
  }

  useEffect(() => {
    loadModels()
    startCamera()
    waitForVideo()

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
       <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 20,
          padding: '8px 16px',
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          ← 返回
        </button>

      <video ref={videoRef} autoPlay muted style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      {isLoading && <div>加载摄像头中...</div>}
    </div>
  )
}

export default Camera
