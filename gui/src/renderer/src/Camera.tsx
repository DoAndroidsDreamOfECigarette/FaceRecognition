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
  const faceNameRef=useRef<Map<string,string>>(new Map());
  const recognizingRef=useRef<Set<string>>(new Set());

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
            const key = posKey(x, y)
            const name = faceNameRef.current.get(key)
            if (name) {
              ctx.fillStyle = 'lime';
              ctx.font = '16px Arial';
              ctx.fillText(name, transformedX, y - 5);
            }
          }

          frameCounter.current = (frameCounter.current + 1) % 1
          if (frameCounter.current === 0) {
            faceapi
              .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
              .then((detections) => {
                detectionsRef.current = detections
                const oldNames = faceNameRef.current
                faceNameRef.current = new Map()
                for (const det of detections) {
                  const { x, y, width, height } = det.box;
                  const key = posKey(x, y)
                  const matched = findNearestKey(oldNames, x, y)
                  if (matched) {
                    faceNameRef.current.set(key, oldNames.get(matched)!)
                  }
                  if (!faceNameRef.current.get(key) && !recognizingRef.current.has(key)) {
                    recognizingRef.current.add(key);
                    const padSide=0.4;
                    const padTop=0.8;
                    const padBottom=0.5;
                    const sx=Math.max(0,x-width*padSide/2);
                    const sy=Math.max(0,y-height*padTop);
                    const sw=Math.min(video.videoWidth-sx,width*(1+padSide));
                    const sh=Math.min(video.videoHeight-sy,height*(1+padTop+padBottom));
                    const tempCanvas=document.createElement('canvas');
                    tempCanvas.width=sw;
                    tempCanvas.height=sh;
                    const tempCtx = tempCanvas.getContext('2d');
                    if (tempCtx) {
                      tempCtx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh)
                      tempCanvas.toBlob((blob) => {
                        if (blob) {
                          recongnizeFace(blob, key);
                        }else{
                          recognizingRef.current.delete(key);
                        }
                      }, 'image/jpeg')
                    }else{
                      recognizingRef.current.delete(key);
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

  function posKey(x: number, y: number): string {
    return `${Math.round(x/50)}_${Math.round(y/50)}`
  }

  function findNearestKey(map: Map<string, string>, x: number, y: number): string | null {
    const kx = Math.round(x/50), ky = Math.round(y/50)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${kx+dx}_${ky+dy}`
        if (map.has(key)) return key
      }
    }
    return null
  }

  async function recongnizeFace(blob: Blob, key: string) {
    const formData = new FormData()
    formData.append('file', blob, 'face.jpg')
    try {
      const res = await fetch('http://127.0.0.1:5000/recognize_by_file', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.name) {
        faceNameRef.current.set(key, data.name)
      }
    } catch (error) {
      console.error('识别失败', error)
    } finally {
      recognizingRef.current.delete(key)
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
