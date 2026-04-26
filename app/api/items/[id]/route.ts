import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
})

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. 사용자 세션 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 삭제 전 아이템 정보 조회 (스크린샷 URL 확인용)
    const { data: item, error: fetchError } = await supabase
      .from('items')
      .select('screenshot_url')
      .eq('id', id)
      .single()

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    console.log('screenshot_url:', item.screenshot_url)
    console.log('R2_PUBLIC_URL:', process.env.NEXT_PUBLIC_R2_PUBLIC_URL)
    console.log('is R2 file:', item.screenshot_url?.includes(process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''))
// 3. R2 이미지 삭제 (R2 URL인 경우에만)
const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
if (r2PublicUrl && item.screenshot_url && item.screenshot_url.includes(r2PublicUrl)) {
  try {
    // URL 객체를 사용하여 호스트 이후의 경로만 안전하게 추출
    const url = new URL(item.screenshot_url)
    const fileKey = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname

    if (fileKey) {
      console.log('Deleting from R2:', fileKey)
      const deleteRes = await r2Client.send(
...
            new DeleteObjectCommand({
              Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
              Key: fileKey,
            })
          )
          console.log('R2 delete result:', deleteRes)
        }
      } catch (r2Error) {
        console.error('R2 delete error:', r2Error)
        // R2 삭제 실패해도 DB 삭제는 진행 (또는 정책에 따라 결정)
      }
    }

    // 4. Supabase DB에서 삭제
    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
