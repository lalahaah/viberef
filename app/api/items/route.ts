import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { url, title, memo, collection_id, tags } = body

    // 1. 사용자 세션 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Microlink API로 스크린샷 캡처
    const screenshot_url = `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&embed=screenshot.url`

    // 3. 아이템 저장
    const { data: item, error: itemError } = await supabase
      .from('items')
      .insert([
        {
          user_id: user.id,
          url,
          title: title || url,
          memo,
          user_tags: tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          screenshot_url
        }
      ])
      .select()
      .single()

    if (itemError) throw itemError

    // 4. 컬렉션 연결
    if (collection_id && item) {
      const { error: relError } = await supabase
        .from('collection_items')
        .insert([{ collection_id, item_id: item.id }])
      
      if (relError) console.error('Collection link error:', relError)
    }

    const response = NextResponse.json({ success: true, item }, { status: 200 })
    
    // CORS 헤더 추가
    response.headers.set('Access-Control-Allow-Origin', '*')
    
    return response

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// 컬렉션 목록을 가져오기 위한 GET (확장 프로그램용)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: collections } = await supabase
      .from('collections')
      .select('id, name')
      .order('name')

    const response = NextResponse.json({ collections }, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
