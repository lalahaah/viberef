import { createClient } from '@/utils/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. 초기 아이템 데이터 가져오기 (컬렉션 정보 포함)
  const { data: items } = await supabase
    .from('items')
    .select('*, collections:collection_items(id:collection_id, name:collections(name))')
    .order('created_at', { ascending: false })

  // 2. 컬렉션 목록 가져오기
  const { data: collections } = await supabase
    .from('collections')
    .select('*')
    .order('name')

  // 3. 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <DashboardClient 
      initialItems={items || []} 
      initialCollections={collections || []} 
      userEmail={user?.email}
    />
  )
}
