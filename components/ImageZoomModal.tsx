'use client'

import { useEffect } from 'react'
import { X, ExternalLink, Hash, Folder } from 'lucide-react'

interface ImageZoomModalProps {
  isOpen: boolean
  onClose: () => void
  item: any
  collections: any[]
}

export default function ImageZoomModal({ isOpen, onClose, item, collections }: ImageZoomModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!isOpen || !item) return null

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl bg-[#1A1A1F] border border-[#2A2A32] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A32] bg-[#141418]">
          <div className="flex flex-col gap-0.5 min-w-0">
            <h2 className="text-sm font-bold text-white truncate">{item.title}</h2>
            <a 
              href={item.url} 
              target="_blank" 
              rel="noreferrer" 
              className="text-[11px] text-[#F5E642] hover:underline flex items-center gap-1 group"
            >
              <span className="truncate">{item.url}</span>
              <ExternalLink size={10} className="shrink-0 opacity-50 group-hover:opacity-100" />
            </a>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#666666] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 중앙 이미지 섹션 */}
        <div className="flex-1 overflow-auto bg-[#0F0F12] flex items-start justify-center p-4">
          <img 
            src={item.screenshot_url} 
            alt={item.title} 
            className="max-w-full h-auto object-contain shadow-2xl rounded-sm"
          />
        </div>

        {/* 하단 정보 섹션 */}
        <div className="p-6 border-t border-[#2A2A32] bg-[#141418] grid grid-cols-1 md:grid-cols-2 gap-8 shrink-0">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-[#444] uppercase tracking-widest block mb-2">Memo</label>
              <p className="text-[12px] text-[#E5E5E5] leading-relaxed whitespace-pre-wrap">
                {item.memo || <span className="text-[#333] italic">작성된 메모가 없습니다.</span>}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-[#444] uppercase tracking-widest block mb-2.5">Collections</label>
              <div className="flex flex-wrap gap-2">
                {item.collections?.map((col: any) => (
                  <div key={col.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1A1F] border border-[#2A2A32] rounded text-[11px] text-[#E5E5E5]">
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: collections.find(c => c.id === col.id)?.color || '#FFB800' }} />
                    <span>{col.name?.name || col.name}</span>
                  </div>
                ))}
                {(!item.collections || item.collections.length === 0) && (
                  <span className="text-[10px] text-[#333] italic">지정된 컬렉션 없음</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#444] uppercase tracking-widest block mb-2.5">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {item.user_tags?.map((tag: string) => (
                  <span key={tag} className="px-2.5 py-1 bg-[#2A2A32] border border-[#2A2A32] rounded text-[10px] text-[#F5E642] font-medium">
                    #{tag}
                  </span>
                ))}
                {(!item.user_tags || item.user_tags.length === 0) && (
                  <span className="text-[10px] text-[#333] italic">태그 없음</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
