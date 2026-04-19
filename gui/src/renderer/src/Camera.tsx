import React, { useRef, useEffect, useState } from 'react'
import Human, { type FaceResult } from '@vladmandic/human'

interface CameraProps {
  onBack:()=>void;
}

const Camera: React.FC<CameraProps> = ({onBack}) => {
  const videoRef=useRef<HTMLVideoElement>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading]=useState(true);
  const humanRef=useRef<Human|null>(null);
  const detectionsRef=useRef<FaceResult[]>([]);
  const frameCounter=useRef(0);
  const faceNameRef=useRef<Map<string,string>>(new Map());
  const recognizingRef=useRef<Set<string>>(new Set());
  const cooldownRef=useRef<Map<string,number>>(new Map());
  const prevDetectionsRef=useRef<FaceResult[]>([]);
  const prevKeysRef=useRef<Set<string>>(new Set());

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

        if (humanRef.current && video.readyState >= 2) {
          const allDetections = [...detectionsRef.current, ...prevDetectionsRef.current]
          const allKeys = new Set<string>()
          for (const det of detectionsRef.current) allKeys.add(posKey(det.box[0], det.box[1]))
          for (const k of prevKeysRef.current) allKeys.add(k)

          for (const key of allKeys) {
            const allDets = allDetections.filter(d => posKey(d.box[0], d.box[1]) === key)
            if (allDets.length === 0) continue
            const det = allDets[0]
            const bx = det.box[0], by = det.box[1], bw = det.box[2], bh = det.box[3]
            const transformedX = canvas.width - bx - bw
            const boxScale = 0.7
            const newBw = bw * boxScale
            const newBh = bh * boxScale
            const newBx = transformedX + (bw - newBw) / 2
            const newBy = by + (bh - newBh) / 2
            ctx.strokeStyle = 'lime'
            ctx.lineWidth = 2
            ctx.strokeRect(newBx, newBy, newBw, newBh)
            let name = faceNameRef.current.get(key)
            if (!name) {
              name = findNameByNearbyKey(faceNameRef.current, bx, by)
            }
            if (name) {
              ctx.fillStyle = 'lime'
              ctx.font = '16px Arial'
              ctx.fillText(name, newBx, newBy - 5)
            }
          }

          frameCounter.current = (frameCounter.current + 1) % 1
          if (frameCounter.current === 0) {
            humanRef.current.detect(video).then((result) => {
              const detections = result.face
              const prevDet = detectionsRef.current
              detectionsRef.current = detections
              const currentKeys=new Set<string>()
              for (const det of detections) {
                currentKeys.add(posKey(det.box[0], det.box[1]))
              }
              prevKeysRef.current = currentKeys

              const oldNames = faceNameRef.current
              faceNameRef.current = new Map()
              for (const det of detections) {
                const bx = det.box[0], by = det.box[1], bw = det.box[2], bh = det.box[3]
                const key = posKey(bx, by)
                const matched = findNearestKey(oldNames, bx, by)
                if (matched) {
                  faceNameRef.current.set(key, oldNames.get(matched)!)
                } else if (!recognizingRef.current.has(key) && !isInCooldown(key)) {
                  recognizingRef.current.add(key);
                  const padSide=0.2;
                  const padTop=0.3;
                  const padBottom=0.2;
                  const sx=Math.max(0,bx-bw*padSide/2);
                  const sy=Math.max(0,by-bh*padTop);
                  const sw=Math.min(video.videoWidth-sx,bw*(1+padSide));
                  const sh=Math.min(video.videoHeight-sy,bh*(1+padTop+padBottom));
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

              const prevKeysSet = new Set<string>()
              for (const d of prevDet) prevKeysSet.add(posKey(d.box[0], d.box[1]))
              for (const k of prevKeysSet) {
                if (!currentKeys.has(k) && !isInCooldown(k)) {
                  cooldownRef.current.delete(k)
                  faceNameRef.current.delete(k)
                }
              }

              prevDetectionsRef.current = detections
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
    const human = new Human({
      modelBasePath: './human-models',
      backend: 'webgl',
      face: {
        detector: { maxDetected: 10, minConfidence: 0.7, rotation: true },
        description: { enabled: false },
        emotion: { enabled: false },
        iris: { enabled: false },
        mesh: { enabled: false },
        antispoof: { enabled: false },
        liveness: { enabled: false },
      },
      body: { enabled: false },
      hand: { enabled: false },
    })
    await human.load()
    humanRef.current = human
    console.log('Human 模型加载完成')
  }

  function posKey(x: number, y: number): string {
    return `${Math.round(x/100)}_${Math.round(y/100)}`
  }

  function findNearestKey(map: Map<string, string>, x: number, y: number): string | null {
    const kx = Math.round(x/100), ky = Math.round(y/100)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${kx+dx}_${ky+dy}`
        if (map.has(key)) return key
      }
    }
    return null
  }

  function findNameByNearbyKey(map: Map<string, string>, x: number, y: number): string | undefined {
    const kx = Math.round(x/100), ky = Math.round(y/100)
    for (let r = 0; r <= 2; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          const key = `${kx+dx}_${ky+dy}`
          if (map.has(key)) return map.get(key)
        }
      }
    }
    return undefined
  }

  function isInCooldown(key: string): boolean {
    const last = cooldownRef.current.get(key)
    if (!last) return false
    if (Date.now() - last < 2000) return true
    cooldownRef.current.delete(key)
    return false
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
        cooldownRef.current.set(key, Date.now())
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
      {isLoading && <div>加载中...</div>}
    </div>
  )
}

export default Camera
