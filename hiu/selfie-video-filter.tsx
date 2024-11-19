'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const { camera } = useThree()

  useEffect(() => {
    if (scene) {
      scene.scale.set(0.1, 0.1, 0.1)
      scene.position.set(0, -0.5, 0)
    }
  }, [scene])

  useFrame(() => {
    if (scene) {
      scene.rotation.y += 0.01
    }
  })

  return <primitive object={scene} />
}

function VideoTexture() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { camera } = useThree()

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          video.srcObject = stream
          video.play()
        })
        .catch((err) => {
          console.error("Error accessing the camera", err)
        })
    }
  }, [])

  useFrame(() => {
    if (videoRef.current) {
      camera.position.z = 5
    }
  })

  return (
    <>
      <mesh>
        <planeGeometry args={[16, 9]} />
        <meshBasicMaterial>
          <videoTexture attach="map" args={[videoRef.current!]} />
        </meshBasicMaterial>
      </mesh>
      <video
        ref={videoRef}
        style={{
          display: 'none'
        }}
      />
    </>
  )
}

export default function Component() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [downloadLink, setDownloadLink] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [modelUrl, setModelUrl] = useState('/aespa_short_hair_with_bones.glb')

  const startRecording = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const stream = canvas.captureStream(30) // 30 FPS
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data])
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      setDownloadLink(url)
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-4">Selfie Video Filter</h1>
        <div className="mb-4">
          <Label htmlFor="model-url">3D Model URL (GLB file)</Label>
          <Input 
            id="model-url" 
            type="text" 
            value={modelUrl} 
            onChange={(e) => setModelUrl(e.target.value)} 
            placeholder="Enter GLB file URL"
            className="mt-1"
          />
        </div>
        <div className="aspect-video relative">
          <Canvas ref={canvasRef}>
            <VideoTexture />
            {modelUrl && <Model url={modelUrl} />}
            <OrbitControls />
          </Canvas>
        </div>
        <div className="mt-4 flex space-x-2">
          {!isRecording ? (
            <Button onClick={startRecording}>Start Recording</Button>
          ) : (
            <Button onClick={stopRecording}>Stop Recording</Button>
          )}
          {downloadLink && (
            <Button as="a" href={downloadLink} download="filtered_video.webm">
              Download Video
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
