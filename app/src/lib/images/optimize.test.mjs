import assert from 'node:assert/strict'
import test from 'node:test'
import sharp from 'sharp'
import {
  createImageStoragePath,
  getImageUploadPreset,
  optimizeImageForUpload,
} from './optimize.ts'

async function pngFile(width, height, name = 'source.png') {
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: '#41b6e6',
    },
  }).png().toBuffer()

  return new File([buffer], name, { type: 'image/png' })
}

test('normalizes upload preset values', () => {
  assert.equal(getImageUploadPreset('poll-option'), 'poll-option')
  assert.equal(getImageUploadPreset('transfer-banner'), 'transfer-banner')
  assert.equal(getImageUploadPreset('unknown'), 'general')
  assert.equal(getImageUploadPreset(null), 'general')
})

test('creates webp storage paths regardless of source extension', () => {
  const path = createImageStoragePath('poll-options', 'original.large.PNG', 1780385000000, 'abc123')
  assert.equal(path, 'poll-options/1780385000000-abc123.webp')
})

test('converts png uploads to webp with webp content type', async () => {
  const file = await pngFile(1800, 1200)
  const result = await optimizeImageForUpload(file, 'poll-thumbnail')
  const metadata = await sharp(result.bytes).metadata()

  assert.equal(result.extension, 'webp')
  assert.equal(result.contentType, 'image/webp')
  assert.equal(metadata.format, 'webp')
  assert.ok((metadata.width ?? 0) <= 1280)
})

test('outputs transfer banners in a 21:9 frame', async () => {
  const file = await pngFile(2400, 2400)
  const result = await optimizeImageForUpload(file, 'transfer-banner')
  const metadata = await sharp(result.bytes).metadata()

  assert.equal(metadata.width, 1400)
  assert.equal(metadata.height, 600)
})
