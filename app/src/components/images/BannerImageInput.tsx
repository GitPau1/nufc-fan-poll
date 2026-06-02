'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  name: string
  label: string
}

type CropState = {
  zoom: number
  x: number
  y: number
}

const OUTPUT_WIDTH = 1400
const OUTPUT_HEIGHT = 600

function setInputFile(input: HTMLInputElement, file: File) {
  const transfer = new DataTransfer()
  transfer.items.add(file)
  input.files = transfer.files
}

export function BannerImageInput({ name, label }: Props) {
  const previewRef = useRef<HTMLCanvasElement>(null)
  const hiddenFileRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<CropState>({ zoom: 1, x: 50, y: 50 })

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    }
  }, [sourceUrl])

  useEffect(() => {
    const image = imageRef.current
    const canvas = previewRef.current
    if (!image || !canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = OUTPUT_WIDTH
    canvas.height = OUTPUT_HEIGHT
    context.clearRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT)

    const scale = Math.max(OUTPUT_WIDTH / image.naturalWidth, OUTPUT_HEIGHT / image.naturalHeight) * crop.zoom
    const drawWidth = image.naturalWidth * scale
    const drawHeight = image.naturalHeight * scale
    const maxX = Math.max(0, drawWidth - OUTPUT_WIDTH)
    const maxY = Math.max(0, drawHeight - OUTPUT_HEIGHT)
    const offsetX = -maxX * (crop.x / 100)
    const offsetY = -maxY * (crop.y / 100)

    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
    canvas.toBlob(blob => {
      const input = hiddenFileRef.current
      if (!blob || !input) return
      setInputFile(input, new File([blob], 'banner.webp', { type: 'image/webp' }))
    }, 'image/webp', 0.72)
  }, [crop, sourceUrl])

  function handleSourceChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (!file) return
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    const nextUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      imageRef.current = image
      setCrop({ zoom: 1, x: 50, y: 50 })
      setSourceUrl(nextUrl)
    }
    image.src = nextUrl
  }

  return (
    <div className="rounded-lg border border-dashed border-border px-3 py-2 text-[12px] font-semibold text-muted-foreground">
      <p>{label}</p>
      <input type="file" accept="image/*" onChange={handleSourceChange} className="mt-2 block w-full text-[12px]" />
      <input ref={hiddenFileRef} name={name} type="file" accept="image/webp" className="hidden" tabIndex={-1} />
      {sourceUrl && (
        <div className="mt-3 space-y-2">
          <canvas ref={previewRef} className="aspect-[21/9] w-full rounded-lg bg-[#07111f] object-cover" />
          <label className="block text-[11px] font-bold text-foreground">
            확대
            <input
              type="range"
              min="1"
              max="2.2"
              step="0.05"
              value={crop.zoom}
              onChange={event => setCrop(current => ({ ...current, zoom: Number(event.target.value) }))}
              className="mt-1 w-full"
            />
          </label>
          <label className="block text-[11px] font-bold text-foreground">
            가로 위치
            <input
              type="range"
              min="0"
              max="100"
              value={crop.x}
              onChange={event => setCrop(current => ({ ...current, x: Number(event.target.value) }))}
              className="mt-1 w-full"
            />
          </label>
          <label className="block text-[11px] font-bold text-foreground">
            세로 위치
            <input
              type="range"
              min="0"
              max="100"
              value={crop.y}
              onChange={event => setCrop(current => ({ ...current, y: Number(event.target.value) }))}
              className="mt-1 w-full"
            />
          </label>
        </div>
      )}
    </div>
  )
}
