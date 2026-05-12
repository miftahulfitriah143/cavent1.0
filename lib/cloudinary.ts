/**
 * Cloudinary helper — Upload gambar ke Cloudinary
 * Menggunakan unsigned upload preset (aman untuk client-side)
 */
export async function uploadImage(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables belum dikonfigurasi')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', 'cavent/posters')

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) {
    throw new Error('Gagal upload gambar ke Cloudinary')
  }

  const data = await response.json()
  return data.secure_url as string
}

/**
 * Hapus gambar dari Cloudinary (via API route)
 */
export async function deleteImage(publicId: string): Promise<void> {
  await fetch('/api/cloudinary/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId }),
  })
}
