import type { FreeChoiceOptionPayload } from '@/lib/polls/create-form-options'

type UploadPollImage = (formData: FormData) => Promise<{ url?: string; error?: string }>

type UploadResult = { ok: true } | { ok: false; message: string }

export async function uploadThumbnailIfNeeded(
  formData: FormData,
  uploadPollImage: UploadPollImage
): Promise<UploadResult> {
  const thumbnailFile = formData.get('thumbnail_image_file') as File | null
  formData.delete('thumbnail_image_file')

  if (String(formData.get('thumbnail_url') ?? '').trim() || !thumbnailFile || thumbnailFile.size === 0) {
    return { ok: true }
  }

  const thumbnailForm = new FormData()
  thumbnailForm.set('file', thumbnailFile)
  thumbnailForm.set('folder', 'poll-thumbnails')
  thumbnailForm.set('preset', 'poll-thumbnail')
  const uploadResult = await uploadPollImage(thumbnailForm)
  if (uploadResult.error || !uploadResult.url) {
    return { ok: false, message: uploadResult.error ?? '대표 이미지 업로드에 실패했습니다.' }
  }

  formData.set('thumbnail_url', uploadResult.url)
  return { ok: true }
}

export async function uploadFreeChoiceImages(
  formData: FormData,
  uploadPollImage: UploadPollImage
): Promise<UploadResult> {
  const parsedOptions = JSON.parse(String(formData.get('options') ?? '[]')) as FreeChoiceOptionPayload[]
  const uploadedOptions = []

  for (const option of parsedOptions) {
    const imageFile = formData.get(option.imageField) as File | null
    formData.delete(option.imageField)

    if (!option.image_url && imageFile && imageFile.size > 0) {
      const imageForm = new FormData()
      imageForm.set('file', imageFile)
      imageForm.set('folder', 'poll-options')
      imageForm.set('preset', 'poll-option')
      const uploadResult = await uploadPollImage(imageForm)
      if (uploadResult.error || !uploadResult.url) {
        return { ok: false, message: uploadResult.error ?? '선택지 이미지 업로드에 실패했습니다.' }
      }

      uploadedOptions.push({
        label: option.label,
        description: option.description,
        image_url: uploadResult.url,
      })
    } else {
      uploadedOptions.push({
        label: option.label,
        description: option.description,
        image_url: option.image_url,
      })
    }
  }

  formData.set('options', JSON.stringify(uploadedOptions))
  return { ok: true }
}
