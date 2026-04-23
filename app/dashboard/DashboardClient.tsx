'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  LayoutGrid, 
  Settings, 
  LogOut, 
  Plus, 
  ExternalLink,
  ChevronRight,
  Folder,
  MoreHorizontal,
  Grid
} from 'lucide-react'
import { signOut } from '@/app/login/actions'
import AddItemModal from '@/components/AddItemModal'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface DashboardClientProps {
  initialItems: any[]
  initialCollections: any[]
  userEmail?: string
}

export default function DashboardClient({ initialItems, initialCollections, userEmail }: DashboardClientProps) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [collections, setCollections] = useState(initialCollections)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(initialItems[0] || null)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      
      console.log('Current Supabase Session:', session)
      
      if (error || !session) {
        console.warn('No active session found, redirecting to login...')
        router.push('/login')
      }
    }

    checkSession()
  }, [router])

  const handleAddItemSuccess = (newItem: any) => {
    setItems([newItem, ...items]) // 낙관적 업데이트: 새 아이템을 맨 앞에 추가
    if (!selectedItem) setSelectedItem(newItem)
  }

  return (
    <div className="flex h-screen w-full bg-[#1A1A1F] overflow-hidden text-[#E5E5E5] font-light">
      
      {/* 1. 사이드바 */}
      <aside className="w-[200px] bg-[#141418] border-r border-[#2A2A32] flex flex-col">
        <div className="p-5 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#F5E642] rounded-sm flex items-center justify-center shadow-lg shadow-[#F5E642]/10">
            <span className="text-[#1A1A1F] font-black text-base">V</span>
          </div>
          <h1 className="font-bold text-base tracking-tight text-white uppercase">VibeRef</h1>
        </div>

        <div className="px-3 mb-6">
          <div className="relative group">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#666666] group-focus-within:text-[#F5E642] transition-colors" />
            <input 
              type="text" 
              placeholder="검색 ⌘K"
              className="w-full bg-[#1A1A1F] border border-[#2A2A32] rounded-md py-1.5 pl-8 pr-2 text-[11px] text-[#E5E5E5] placeholder-[#444] focus:outline-none focus:border-[#F5E642] transition-all"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 space-y-6">
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <h2 className="text-[10px] font-bold text-[#444] uppercase tracking-[0.2em]">Collections</h2>
              <Plus size={14} className="text-[#444] cursor-pointer hover:text-[#666666]" />
            </div>
            <div className="space-y-0.5">
              <button className="flex items-center justify-between w-full px-2.5 py-2 text-[13px] rounded-md bg-[#F5E642] text-[#1A1A1F] font-semibold">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1F]" />
                  <span className="font-normal">전체</span>
                </div>
                <span className="text-[10px] text-[#1A1A1F]/60">{items.length}</span>
              </button>
              {collections.map((col) => (
                <button key={col.id} className="flex items-center justify-between w-full px-2.5 py-2 text-[13px] rounded-md text-[#666666] hover:bg-[#222228] hover:text-[#E5E5E5] transition-all group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
                    <span className="font-normal">{col.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-[#2A2A32] space-y-1">
          <div className="px-2.5 py-2 text-[11px] text-[#444] truncate">{userEmail}</div>
          <button className="flex items-center gap-2.5 w-full px-2.5 py-2 text-[13px] text-[#666666] hover:bg-[#222228] hover:text-[#E5E5E5] rounded-md transition-all font-normal">
            <Settings size={16} strokeWidth={1.5} /> 설정
          </button>
          <form action={signOut}>
            <button type="submit" className="flex items-center gap-2.5 w-full px-2.5 py-2 text-[13px] text-[#666666] hover:bg-[#FF4D4D]/10 hover:text-[#FF4D4D] rounded-md transition-all font-normal">
              <LogOut size={16} strokeWidth={1.5} /> 로그아웃
            </button>
          </form>
        </div>
      </aside>

      {/* 2. 메인 그리드 */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#1A1A1F]">
        <header className="h-14 border-b border-[#2A2A32] flex items-center justify-between px-6 bg-[#1A1A1F]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-white tracking-tight">전체 레퍼런스</h2>
            <div className="h-3 w-[1px] bg-[#2A2A32]" />
            <span className="text-xs text-[#444]">{items.length} items</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#F5E642] text-[#1A1A1F] rounded-md text-xs font-bold hover:bg-[#e0d23a] transition-all shadow-lg shadow-[#F5E642]/5"
            >
              <Plus size={14} /> 아이템 추가
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {items.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className={`group flex flex-col gap-2.5 cursor-pointer ${selectedItem?.id === item.id ? 'opacity-100' : ''}`}
              >
                <div className={`aspect-[4/3] bg-[#222228] rounded-lg border overflow-hidden group-hover:border-[#F5E642]/50 group-hover:shadow-2xl group-hover:shadow-black/50 transition-all duration-300 relative ${selectedItem?.id === item.id ? 'border-[#F5E642]' : 'border-[#2A2A32]'}`}>
                  {item.screenshot_url ? (
                    <img 
                      src={item.screenshot_url} 
                      alt={item.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#2A2A32]/20 flex items-center justify-center opacity-40 group-hover:opacity-10 transition-opacity">
                      <span className="text-[9px] text-[#444] font-bold tracking-[0.3em] uppercase">Ref Image</span>
                    </div>
                  )}
                  {/* 컬러 칩 (오버레이) */}
                  <div className="absolute bottom-2 right-2 flex gap-1 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                    <div className="w-2 h-2 rounded-full bg-[#F5E642]" />
                    <div className="w-2 h-2 rounded-full bg-[#E5E5E5]" />
                  </div>
                </div>
                <div className="px-1">
                  <h3 className={`text-[13px] font-normal truncate transition-colors ${selectedItem?.id === item.id ? 'text-[#F5E642]' : 'text-[#E5E5E5] group-hover:text-[#F5E642]'}`}>
                    {item.title}
                  </h3>
                  <p className="text-[10px] text-[#666666] mt-0.5 truncate">{new URL(item.url).hostname}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 3. 디테일 패널 */}
      <aside className="w-[240px] bg-[#141418] border-l border-[#2A2A32] flex flex-col">
        {selectedItem ? (
          <>
            <div className="h-14 border-b border-[#2A2A32] flex items-center justify-between px-5">
              <h2 className="font-bold text-[10px] text-[#444] uppercase tracking-[0.2em]">Properties</h2>
              <ChevronRight size={16} className="text-[#444] cursor-pointer hover:text-[#666666]" />
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-8 scrollbar-hide">
              <div className="aspect-video bg-[#222228] rounded-lg border border-[#2A2A32] flex items-center justify-center overflow-hidden shadow-inner relative">
                {selectedItem.screenshot_url ? (
                  <img 
                    src={selectedItem.screenshot_url} 
                    alt={selectedItem.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[9px] text-[#444] font-bold tracking-[0.3em] uppercase">Preview</span>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-[#444] uppercase tracking-wider block mb-1.5">Title</label>
                  <div className="text-[13px] font-normal text-[#E5E5E5] leading-snug">{selectedItem.title}</div>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-[#444] uppercase tracking-wider block mb-1.5">URL</label>
                  <a href={selectedItem.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12px] text-[#F5E642] hover:underline cursor-pointer group">
                    <span className="truncate">{selectedItem.url}</span>
                    <ExternalLink size={10} className="shrink-0 opacity-50 group-hover:opacity-100" />
                  </a>
                </div>

                {selectedItem.memo && (
                  <div>
                    <label className="text-[10px] font-bold text-[#444] uppercase tracking-wider block mb-1.5">Memo</label>
                    <div className="text-[12px] text-[#666666] leading-relaxed bg-[#1A1A1F] p-3 rounded-md border border-[#2A2A32]">
                      {selectedItem.memo}
                    </div>
                  </div>
                )}
              </div>

              {selectedItem.user_tags && selectedItem.user_tags.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-[#444] uppercase tracking-wider block mb-2.5">Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.user_tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 bg-[#2A2A32] border border-[#2A2A32] rounded text-[10px] text-[#F5E642]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#444] text-[10px] uppercase tracking-widest px-10 text-center leading-loose">
            아이템을 선택하여 상세 정보를 확인하세요
          </div>
        )}

        <div className="p-5 border-t border-[#2A2A32] bg-[#141418]">
          <button disabled={!selectedItem} className="w-full bg-[#F5E642] text-[#1A1A1F] py-2.5 rounded-lg text-xs font-bold hover:bg-[#e0d23a] transition-all shadow-lg shadow-[#F5E642]/5 flex items-center justify-center gap-2 group disabled:opacity-20">
             AI Tailwind 변환
             <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </aside>

      <AddItemModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleAddItemSuccess}
        collections={collections}
      />
    </div>
  )
}
