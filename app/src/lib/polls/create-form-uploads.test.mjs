import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.join(__dirname, 'create-form-uploads.ts')

async function loadModule() {
  return import(`${sourcePath}?cacheBust=${Date.now()}`)
}

function imageFile(name = 'image.webp') {
  return new File(['image-bytes'], name, { type: 'image/webp' })
}

function uploadStub(urls) {
  const calls = []
  return {
    calls,
    upload: async formData => {
      calls.push({
        file: formData.get('file')?.name,
        folder: formData.get('folder'),
        preset: formData.get('preset'),
      })
      const next = urls.shift()
      return typeof next === 'string' ? { url: next } : next
    },
  }
}

test('uploads thumbnail only when no thumbnail url exists', async () => {
  const { uploadThumbnailIfNeeded } = await loadModule()
  const fd = new FormData()
  fd.set('thumbnail_url', '')
  fd.set('thumbnail_image_file', imageFile('thumbnail.webp'))
  const stub = uploadStub(['https://cdn.example.com/thumbnail.webp'])

  assert.deepEqual(await uploadThumbnailIfNeeded(fd, stub.upload), { ok: true })
  assert.equal(fd.get('thumbnail_url'), 'https://cdn.example.com/thumbnail.webp')
  assert.equal(fd.has('thumbnail_image_file'), false)
  assert.deepEqual(stub.calls, [{
    file: 'thumbnail.webp',
    folder: 'poll-thumbnails',
    preset: 'poll-thumbnail',
  }])
})

test('keeps existing thumbnail url and removes thumbnail file field', async () => {
  const { uploadThumbnailIfNeeded } = await loadModule()
  const fd = new FormData()
  fd.set('thumbnail_url', 'https://cdn.example.com/existing.webp')
  fd.set('thumbnail_image_file', imageFile('ignored.webp'))
  const stub = uploadStub([])

  assert.deepEqual(await uploadThumbnailIfNeeded(fd, stub.upload), { ok: true })
  assert.equal(fd.get('thumbnail_url'), 'https://cdn.example.com/existing.webp')
  assert.equal(fd.has('thumbnail_image_file'), false)
  assert.deepEqual(stub.calls, [])
})

test('uploads free choice image files and removes upload-only fields', async () => {
  const { uploadFreeChoiceImages } = await loadModule()
  const fd = new FormData()
  fd.set('free_option_image_0', imageFile('home.webp'))
  fd.set('free_option_image_1', imageFile('away.webp'))
  fd.set('options', JSON.stringify([
    { label: 'Home', description: 'Blue', image_url: null, imageField: 'free_option_image_0' },
    { label: 'Away', description: null, image_url: 'https://cdn.example.com/away-url.webp', imageField: 'free_option_image_1' },
  ]))
  const stub = uploadStub(['https://cdn.example.com/home.webp'])

  assert.deepEqual(await uploadFreeChoiceImages(fd, stub.upload), { ok: true })
  assert.deepEqual(JSON.parse(String(fd.get('options'))), [
    { label: 'Home', description: 'Blue', image_url: 'https://cdn.example.com/home.webp' },
    { label: 'Away', description: null, image_url: 'https://cdn.example.com/away-url.webp' },
  ])
  assert.equal(fd.has('free_option_image_0'), false)
  assert.equal(fd.has('free_option_image_1'), false)
  assert.deepEqual(stub.calls, [{
    file: 'home.webp',
    folder: 'poll-options',
    preset: 'poll-option',
  }])
})

test('returns an upload error when a free choice image upload fails', async () => {
  const { uploadFreeChoiceImages } = await loadModule()
  const fd = new FormData()
  fd.set('free_option_image_0', imageFile('home.webp'))
  fd.set('options', JSON.stringify([
    { label: 'Home', description: null, image_url: null, imageField: 'free_option_image_0' },
  ]))
  const stub = uploadStub([{ error: 'storage down' }])

  assert.deepEqual(await uploadFreeChoiceImages(fd, stub.upload), {
    ok: false,
    message: 'storage down',
  })
})

