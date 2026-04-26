'use client'

import { useState, useEffect, useRef } from 'react'
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
  Grid,
  Check,
  X as CloseIcon
} from 'lucide-react'
import { signOut } from '@/app/login/actions'
import AddItemModal from '@/components/AddItemModal'
import ImageZoomModal from '@/components/ImageZoomModal'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface DashboardClientProps {
  initialItems: any[]
  initialCollections: any[]
  userEmail?: string
}

export default function DashboardClient({ initialItems, initialCollections, userEmail }: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState(initialItems)
  const [collections, setCollections] = useState(initialCollections)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(initialItems[0] || null)
  
  // 패널 너비 상태 (기본값 및 로컬스토리지 로드)
  const [sidebarWidth, setSidebarWidth] = useState(200)
  const [detailWidth, setDetailWidth] = useState(240)
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)
  const [isResizingDetail, setIsResizingDetail] = useState(false)

  useEffect(() => {
    const savedSidebarWidth = localStorage.getItem('sidebarWidth')
    const savedDetailWidth = localStorage.getItem('detailWidth')
    if (savedSidebarWidth) setSidebarWidth(parseInt(savedSidebarWidth))
    if (savedDetailWidth) setDetailWidth(parseInt(savedDetailWidth))
  }, [])

  // 드래그 이벤트 핸들러
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) {
        const newWidth = Math.min(Math.max(e.clientX, 160), 320)
        setSidebarWidth(newWidth)
        localStorage.setItem('sidebarWidth', newWidth.toString())
      }
      if (isResizingDetail) {
        const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 200), 400)
        setDetailWidth(newWidth)
        localStorage.setItem('detailWidth', newWidth.toString())
      }
    }

    const handleMouseUp = () => {
      setIsResizingSidebar(false)
      setIsResizingDetail(false)
      document.body.style.cursor = 'default'
    }

    if (isResizingSidebar || isResizingDetail) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingSidebar, isResizingDetail])

  // 컬렉션 관련 상태
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingCollection, setIsAddingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  // 플랫폼 감지 (Mac 여부)
  const [modifierKey, setModifierKey] = useState('Ctrl')
  useEffect(() => {
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
    setModifierKey(isMac ? '⌘' : 'Ctrl')
  }, [])

  // 검색창 참조
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 단축키 핸들러 (Mac: ⌘K, Windows/Linux: Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
      const modifier = isMac ? e.metaKey : e.ctrlKey

      if (modifier && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('')
        searchInputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 태그 목록 추출 및 집계
  const tagCounts = items.reduce((acc: Record<string, number>, item) => {
    item.user_tags?.forEach((tag: string) => {
      acc[tag] = (acc[tag] || 0) + 1
    })
    return acc
  }, {})
  const allTags = Object.keys(tagCounts).sort()

  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, itemId: string } | null>(null)

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  // 컬렉션 추가/제거 로직
  const toggleCollectionForItem = async (itemId: string, collectionId: string) => {
    const item = items.find(i => i.id === itemId)
    const isAlreadyIn = item?.collections?.some((c: any) => c.id === collectionId)

    if (isAlreadyIn) {
      // 제거
      const { error } = await supabase
        .from('collection_items')
        .delete()
        .match({ item_id: itemId, collection_id: collectionId })
      
      if (!error) {
        setItems(prev => prev.map(i => {
          if (i.id === itemId) {
            return { ...i, collections: i.collections.filter((c: any) => c.id !== collectionId) }
          }
          return i
        }))
      }
    } else {
      // 추가
      const { error } = await supabase
        .from('collection_items')
        .insert([{ item_id: itemId, collection_id: collectionId }])
      
      if (!error) {
        const col = collections.find(c => c.id === collectionId)
        setItems(prev => prev.map(i => {
          if (i.id === itemId) {
            const newCols = [...(i.collections || []), { id: collectionId, name: { name: col.name } }]
            return { ...i, collections: newCols }
          }
          return i
        }))
      }
    }
  }

  // 아이템 삭제 로직
  const handleDeleteItem = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation()
    console.log('handleDeleteItem called for:', itemId)
    if (!confirm('정말 삭제할까요?')) return

    try {
      console.log('Initiating DELETE request to:', `/api/items/${itemId}`)
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      })

      console.log('DELETE response status:', response.status)
      if (response.ok) {
        setItems(prev => prev.filter(i => i.id !== itemId))
        if (selectedItem?.id === itemId) setSelectedItem(null)
      } else {
        const data = await response.json()
        console.error('DELETE error data:', data)
        throw new Error(data.error || '삭제 실패')
      }
    } catch (error: any) {
      console.error('handleDeleteItem error:', error)
      alert(error.message || '삭제 중 오류가 발생했습니다.')
    }
  }

  // 수정 관련 상태
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  // 아이템 업데이트 로직
  const handleUpdateItem = async (itemId: string, field: string, value: any) => {
    const { error } = await supabase
      .from('items')
      .update({ [field]: value })
      .match({ id: itemId })

    if (!error) {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: value } : i))
      setSaveStatus(field)
      setTimeout(() => setSaveStatus(null), 1000)
    }
    setEditingField(null)
  }

  // 태그 추가/삭제 핸들러
  const handleToggleTag = async (itemId: string, tag: string, action: 'add' | 'remove') => {
    const item = items.find(i => i.id === itemId)
    let newTags = [...(item?.user_tags || [])]
    
    if (action === 'add') {
      if (!tag.trim() || newTags.includes(tag.trim())) return
      newTags.push(tag.trim())
    } else {
      newTags = newTags.filter(t => t !== tag)
    }

    handleUpdateItem(itemId, 'user_tags', newTags)
  }

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, itemId })
  }

  // 컬렉션 추가 핸들러
  const handleAddCollection = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newCollectionName.trim()) {
      const randomColors = ['#FFB800', '#FF4D4D', '#4D7DFF', '#4DFF88', '#BD4DFF', '#FF4DBC']
      const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)]
      
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data, error } = await supabase
        .from('collections')
        .insert([{ 
          name: newCollectionName.trim(), 
          color: randomColor,
          user_id: userData.user.id 
        }])
        .select()

      if (error) {
        console.error('Error adding collection:', error)
        return
      }

      if (data) {
        setCollections([...collections, data[0]])
        setNewCollectionName('')
        setIsAddingCollection(false)
      }
    } else if (e.key === 'Escape') {
      setIsAddingCollection(false)
      setNewCollectionName('')
    }
  }

  // 필터링된 아이템 (컬렉션 + 태그 + 검색어 동시 지원)
  const filteredItems = items.filter(item => {
    const matchesCollection = selectedCollectionId 
      ? (Array.isArray(item.collections) ? item.collections : [item.collections])
          .some((c: any) => (c?.id || c?.collection_id) === selectedCollectionId)
      : true
    
    const matchesTag = selectedTag 
      ? item.user_tags?.includes(selectedTag)
      : true

    const query = searchQuery.toLowerCase()
    const matchesSearch = query
      ? item.title?.toLowerCase().includes(query) ||
        item.url?.toLowerCase().includes(query) ||
        item.memo?.toLowerCase().includes(query) ||
        item.user_tags?.some((t: string) => t.toLowerCase().includes(query))
      : true

    return matchesCollection && matchesTag && matchesSearch
  })

  // selectedItem이 업데이트될 때마다 items 동기화
  const currentSelectedItem = items.find(i => i.id === selectedItem?.id) || selectedItem

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  const handleAddItemSuccess = (newItem: any) => {
    setItems([newItem, ...items])
    if (!selectedItem) setSelectedItem(newItem)
  }

  const handleImageClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation()
    if (item.screenshot_url) {
      setIsZoomModalOpen(true)
    } else {
      window.open(item.url, '_blank')
    }
  }

  return (
    <div className="flex h-screen w-full bg-[#1A1A1F] overflow-hidden text-[#E5E5E5] font-light">
      
      {/* 1. 사이드바 */}
      <aside 
        style={{ width: sidebarWidth }}
        className="bg-[#141418] border-r border-[#2A2A32] flex flex-col relative shrink-0"
      >
        {/* 드래그 핸들 (사이드바 오른쪽) */}
        <div 
          onMouseDown={() => setIsResizingSidebar(true)}
          className={`absolute -right-[2px] top-0 bottom-0 w-[4px] cursor-col-resize z-50 transition-colors ${isResizingSidebar ? 'bg-[#F5E642]' : 'hover:bg-[#F5E642]'}`}
        />
        <div className="p-5 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#F5E642] rounded-sm flex items-center justify-center shadow-lg shadow-[#F5E642]/10">
            <span className="text-[#1A1A1F] font-black text-base">V</span>
          </div>
          <h1 className="font-bold text-base tracking-tight text-white uppercase">VibeRef</h1>
        </div>

        <div className="px-3 mb-6">
          <div className="relative group">
            <Search className={`absolute left-2.5 top-2.5 h-3.5 w-3.5 transition-colors ${searchQuery ? 'text-[#F5E642]' : 'text-[#666666] group-focus-within:text-[#F5E642]'}`} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder={`검색 ${modifierKey}K`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1A1F] border border-[#2A2A32] rounded-md py-1.5 pl-8 pr-2 text-[11px] text-[#E5E5E5] placeholder-[#444] focus:outline-none focus:border-[#F5E642] transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-[#444] hover:text-white transition-colors"
              >
                <CloseIcon size={12} />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 space-y-6">
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <h2 className="text-[10px] font-bold text-[#444] uppercase tracking-[0.2em]">Collections</h2>
              <button 
                onClick={() => setIsAddingCollection(true)}
                className="text-[#444] cursor-pointer hover:text-[#F5E642] transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              <button 
                onClick={() => {
                  setSelectedCollectionId(null)
                  setSelectedTag(null)
                }}
                className={`flex items-center justify-between w-full px-2.5 py-2 text-[13px] rounded-md transition-all ${
                  (selectedCollectionId === null && selectedTag === null)
                  ? 'bg-[#F5E642] text-[#1A1A1F] font-semibold' 
                  : 'text-[#666666] hover:bg-[#222228] hover:text-[#E5E5E5]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${(selectedCollectionId === null && selectedTag === null) ? 'bg-[#1A1A1F]' : 'bg-[#444]'}`} />
                  <span className="font-normal">전체</span>
                </div>
                <span className={`text-[10px] ${(selectedCollectionId === null && selectedTag === null) ? 'text-[#1A1A1F]/60' : 'text-[#444]'}`}>{items.length}</span>
              </button>
              
              {collections.map((col) => {
                const itemCount = items.filter(item => 
                  item.collections?.some((c: any) => c.id === col.id)
                ).length
                
                return (
                  <button 
                    key={col.id} 
                    onClick={() => setSelectedCollectionId(col.id)}
                    className={`flex items-center justify-between w-full px-2.5 py-2 text-[13px] rounded-md transition-all group ${
                      selectedCollectionId === col.id 
                      ? 'bg-[#F5E642] text-[#1A1A1F] font-semibold' 
                      : 'text-[#666666] hover:bg-[#222228] hover:text-[#E5E5E5]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color || '#FFB800' }} />
                      <span className="font-normal truncate max-w-[110px]">{col.name}</span>
                    </div>
                    <span className={`text-[10px] ${selectedCollectionId === col.id ? 'text-[#1A1A1F]/60' : 'text-[#444]'}`}>
                      {itemCount}
                    </span>
                  </button>
                )
              })}

              {isAddingCollection && (
                <div className="px-2.5 py-1.5">
                  <input
                    autoFocus
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={handleAddCollection}
                    onBlur={() => {
                      if (!newCollectionName) setIsAddingCollection(false)
                    }}
                    placeholder="이름 입력..."
                    className="w-full bg-[#1A1A1F] border border-[#F5E642] rounded px-2 py-1 text-[12px] text-[#E5E5E5] focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <h2 className="text-[10px] font-bold text-[#444] uppercase tracking-[0.2em]">Tags</h2>
            </div>
            <div className="space-y-0.5">
              {allTags.map(tag => (
                <button 
                  key={tag} 
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`flex items-center justify-between w-full px-2.5 py-1.5 text-[12px] rounded-md transition-all ${
                    selectedTag === tag 
                    ? 'text-[#F5E642] font-semibold bg-[#F5E642]/5' 
                    : 'text-[#666666] hover:text-[#E5E5E5]'
                  }`}
                >
                  <span className="truncate max-w-[130px]">#{tag}</span>
                  <span className="text-[10px] opacity-40">{tagCounts[tag]}</span>
                </button>
              ))}
              {allTags.length === 0 && (
                <div className="px-2.5 py-2 text-[11px] text-[#444] italic">태그가 없습니다</div>
              )}
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
            <h2 className="text-sm font-semibold text-white tracking-tight">
              {searchQuery && `검색: ${searchQuery}`}
              {!searchQuery && selectedCollectionId && !selectedTag && collections.find(c => c.id === selectedCollectionId)?.name}
              {!searchQuery && !selectedCollectionId && selectedTag && `태그: #${selectedTag}`}
              {!searchQuery && selectedCollectionId && selectedTag && `${collections.find(c => c.id === selectedCollectionId)?.name} + #${selectedTag}`}
              {!searchQuery && !selectedCollectionId && !selectedTag && "전체 레퍼런스"}
            </h2>
            <span className="text-[#666666] text-xs">|</span>
            <span className="text-xs text-[#666666]">{filteredItems.length} items</span>
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
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedItem(item)}
                  onContextMenu={(e) => handleContextMenu(e, item.id)}
                  className={`group flex flex-col gap-2.5 cursor-pointer ${currentSelectedItem?.id === item.id ? 'opacity-100' : ''}`}
                >
                  <div className={`aspect-[4/3] bg-[#222228] rounded-lg border overflow-hidden group-hover:border-[#F5E642]/50 group-hover:shadow-2xl group-hover:shadow-black/50 transition-all duration-300 relative ${currentSelectedItem?.id === item.id ? 'border-[#F5E642]' : 'border-[#2A2A32]'}`}>
                    {/* 삭제 버튼 */}
                    <button 
                      onClick={(e) => handleDeleteItem(e, item.id)}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-[#ff4444] text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#ff0000] shadow-xl"
                    >
                      <CloseIcon size={12} />
                    </button>

                    <div 
                      className="w-full h-full cursor-zoom-in"
                      onClick={(e) => handleImageClick(e, item)}
                    >
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
                    </div>
                    {/* 컬러 칩 (오버레이) */}                    <div className="absolute bottom-2 right-2 flex gap-1 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                      <div className="w-2 h-2 rounded-full bg-[#F5E642]" />
                      <div className="w-2 h-2 rounded-full bg-[#E5E5E5]" />
                    </div>
                  </div>
                  <div className="px-1">
                    <h3 className={`text-[13px] font-normal truncate transition-colors ${currentSelectedItem?.id === item.id ? 'text-[#F5E642]' : 'text-[#E5E5E5] group-hover:text-[#F5E642]'}`}>
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-[#666666] mt-0.5 truncate">{getHostname(item.url)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#444] space-y-4">
              <Search size={48} strokeWidth={1} />
              <div className="text-sm tracking-widest uppercase">검색 결과가 없습니다</div>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-[#F5E642] hover:underline"
              >
                검색 초기화
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 3. 디테일 패널 */}
      <aside 
        style={{ width: detailWidth }}
        className="bg-[#141418] border-l border-[#2A2A32] flex flex-col overflow-x-hidden relative shrink-0"
      >
        {/* 드래그 핸들 (디테일 패널 왼쪽) */}
        <div 
          onMouseDown={() => setIsResizingDetail(true)}
          className={`absolute -left-[2px] top-0 bottom-0 w-[4px] cursor-col-resize z-50 transition-colors ${isResizingDetail ? 'bg-[#F5E642]' : 'hover:bg-[#F5E642]'}`}
        />
        {currentSelectedItem ? (
          <>
            <div className="h-14 border-b border-[#2A2A32] flex items-center justify-between px-5 shrink-0">
              <h2 className="font-bold text-[10px] text-[#444] uppercase tracking-[0.2em]">Properties</h2>
              <ChevronRight size={16} className="text-[#444] cursor-pointer hover:text-[#666666]" />
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-8 scrollbar-hide overflow-x-hidden">
              <div 
                className="aspect-video bg-[#222228] rounded-lg border border-[#2A2A32] flex items-center justify-center overflow-hidden shadow-inner relative shrink-0 cursor-zoom-in group/preview"
                onClick={(e) => handleImageClick(e, currentSelectedItem)}
              >
                {currentSelectedItem.screenshot_url ? (
                  <>
                    <img 
                      src={currentSelectedItem.screenshot_url} 
                      alt={currentSelectedItem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Search size={20} className="text-white" />
                    </div>
                  </>
                ) : (
                  <span className="text-[9px] text-[#444] font-bold tracking-[0.3em] uppercase">Preview</span>
                )}
              </div>

              <div className="space-y-5 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-[#444] uppercase tracking-wider block">Title</label>
                    {saveStatus === 'title' && <Check size={10} className="text-[#F5E642] animate-in fade-in" />}
                  </div>
                  {editingField === 'title' ? (
                    <input 
                      autoFocus
                      className="w-full bg-[#1A1A1F] border border-[#F5E642] rounded px-2 py-1 text-[13px] text-[#E5E5E5] focus:outline-none"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleUpdateItem(currentSelectedItem.id, 'title', editValue)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateItem(currentSelectedItem.id, 'title', editValue)}
                    />
                  ) : (
                    <div 
                      onClick={() => {
                        setEditingField('title')
                        setEditValue(currentSelectedItem.title || '')
                      }}
                      className="text-[13px] font-normal text-[#E5E5E5] leading-snug break-words cursor-pointer hover:text-[#F5E642] transition-colors"
                    >
                      {currentSelectedItem.title}
                    </div>
                  )}
                </div>
                
                <div className="min-w-0">
                  <label className="text-[10px] font-bold text-[#444] uppercase tracking-wider block mb-1.5">URL</label>
                  <a href={currentSelectedItem.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12px] text-[#F5E642] hover:underline cursor-pointer group min-w-0">
                    <span className="truncate flex-1">{currentSelectedItem.url}</span>
                    <ExternalLink size={10} className="shrink-0 opacity-50 group-hover:opacity-100" />
                  </a>
                </div>

                {/* 컬렉션 섹션 */}
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <label className="text-[10px] font-bold text-[#444] uppercase tracking-wider">Collections</label>
                    <div className="relative group shrink-0">
                      <button className="text-[#444] hover:text-[#F5E642] transition-colors p-1">
                        <Plus size={12} />
                      </button>
                      <div className="absolute right-0 left-auto top-6 w-36 bg-[#222228] border border-[#2A2A32] rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-focus-within:opacity-100 group-focus-within:visible transition-all z-20">
                        <div className="py-1 max-h-48 overflow-y-auto scrollbar-hide">
                          {collections.map(col => (
                            <button 
                              key={col.id}
                              onClick={() => toggleCollectionForItem(currentSelectedItem.id, col.id)}
                              className="w-full px-3 py-1.5 text-[11px] text-left hover:bg-[#2A2A32] flex items-center justify-between gap-2"
                            >
                              <span className="truncate flex-1">{col.name}</span>
                              {currentSelectedItem.collections?.some((c: any) => (c.id || c.collection_id) === col.id) && <Check size={10} className="text-[#F5E642] shrink-0" />}
                            </button>
                          ))}
                        </div>
                        {collections.length === 0 && (
                          <div className="px-3 py-2 text-[10px] text-[#444] italic">컬렉션 없음</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 overflow-hidden">
                    {currentSelectedItem.collections?.map((col: any) => (
                      <div key={col.id} className="flex items-center gap-1.5 px-2 py-1 bg-[#1A1A1F] border border-[#2A2A32] rounded text-[11px] text-[#E5E5E5] max-w-full">
                        <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: collections.find(c => c.id === col.id)?.color || '#FFB800' }} />
                        <span className="truncate">{col.name?.name || col.name}</span>
                        <CloseIcon 
                          size={10} 
                          className="text-[#444] hover:text-[#FF4D4D] cursor-pointer shrink-0" 
                          onClick={() => toggleCollectionForItem(currentSelectedItem.id, col.id)}
                        />
                      </div>
                    ))}
                    {(!currentSelectedItem.collections || currentSelectedItem.collections.length === 0) && (
                      <div className="text-[10px] text-[#444] italic">지정된 컬렉션 없음</div>
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-[#444] uppercase tracking-wider block">Memo</label>
                    {saveStatus === 'memo' && <Check size={10} className="text-[#F5E642] animate-in fade-in" />}
                  </div>
                  {editingField === 'memo' ? (
                    <textarea 
                      autoFocus
                      rows={3}
                      className="w-full bg-[#1A1A1F] border border-[#F5E642] rounded px-2 py-1 text-[12px] text-[#E5E5E5] focus:outline-none resize-none"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleUpdateItem(currentSelectedItem.id, 'memo', editValue)}
                    />
                  ) : (
                    <div 
                      onClick={() => {
                        setEditingField('memo')
                        setEditValue(currentSelectedItem.memo || '')
                      }}
                      className="text-[12px] text-[#666666] leading-relaxed bg-[#1A1A1F] p-3 rounded-md border border-[#2A2A32] cursor-pointer hover:border-[#F5E642] transition-colors min-h-[60px]"
                    >
                      {currentSelectedItem.memo || '메모를 입력하세요...'}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-[10px] font-bold text-[#444] uppercase tracking-wider">Tags</label>
                    {saveStatus === 'user_tags' && <Check size={10} className="text-[#F5E642] animate-in fade-in" />}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSelectedItem.user_tags?.map((tag: string) => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-[#2A2A32] border border-[#2A2A32] rounded text-[10px] text-[#F5E642] group">
                        #{tag}
                        <CloseIcon 
                          size={8} 
                          className="text-[#444] hover:text-[#ff4444] cursor-pointer" 
                          onClick={() => handleToggleTag(currentSelectedItem.id, tag, 'remove')}
                        />
                      </span>
                    ))}
                    {editingField === 'tags' ? (
                      <input 
                        autoFocus
                        placeholder="태그 입력..."
                        className="bg-transparent border-b border-[#F5E642] text-[10px] text-[#F5E642] outline-none w-20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleToggleTag(currentSelectedItem.id, (e.target as HTMLInputElement).value, 'add')
                            ;(e.target as HTMLInputElement).value = ''
                          }
                          if (e.key === 'Escape') setEditingField(null)
                        }}
                        onBlur={() => setEditingField(null)}
                      />
                    ) : (
                      <button 
                        onClick={() => setEditingField('tags')}
                        className="px-2 py-0.5 border border-dashed border-[#444] rounded text-[10px] text-[#444] hover:text-[#F5E642] hover:border-[#F5E642] transition-colors"
                      >
                        + 추가
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#444] text-[10px] uppercase tracking-widest px-10 text-center leading-loose">
            아이템을 선택하여 상세 정보를 확인하세요
          </div>
        )}

        <div className="p-5 border-t border-[#2A2A32] bg-[#141418]">
          <button disabled={!currentSelectedItem} className="w-full bg-[#F5E642] text-[#1A1A1F] py-2.5 rounded-lg text-xs font-bold hover:bg-[#e0d23a] transition-all shadow-lg shadow-[#F5E642]/5 flex items-center justify-center gap-2 group disabled:opacity-20">
             AI Tailwind 변환
             <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </aside>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div 
          className="fixed z-[100] w-48 bg-[#222228] border border-[#2A2A32] rounded-lg shadow-2xl py-1 animate-in fade-in zoom-in duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-[#444] uppercase tracking-wider border-b border-[#2A2A32] mb-1">
            컬렉션에 추가
          </div>
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {collections.map(col => {
              const item = items.find(i => i.id === contextMenu.itemId)
              const isIn = item?.collections?.some((c: any) => c.id === col.id)
              return (
                <button 
                  key={col.id}
                  onClick={() => {
                    toggleCollectionForItem(contextMenu.itemId, col.id)
                    setContextMenu(null)
                  }}
                  className="w-full px-3 py-2 text-[12px] text-left hover:bg-[#2A2A32] flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-[#E5E5E5] group-hover:text-white">{col.name}</span>
                  </div>
                  {isIn && <Check size={14} className="text-[#F5E642]" />}
                </button>
              )
            })}
          </div>
          {collections.length === 0 && (
            <div className="px-3 py-4 text-center text-[11px] text-[#444] italic">
              생성된 컬렉션이 없습니다
            </div>
          )}
        </div>
      )}

      <AddItemModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleAddItemSuccess}
        collections={collections}
      />

      <ImageZoomModal 
        isOpen={isZoomModalOpen}
        onClose={() => setIsZoomModalOpen(false)}
        item={currentSelectedItem}
        collections={collections}
      />
    </div>
  )
}
