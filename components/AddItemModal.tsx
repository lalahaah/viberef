'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newItem: any) => void
  collections: any[]
}

export default function AddItemModal({ isOpen, onClose, onSuccess, collections }: AddItemModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    memo: '',
    collection_id: '',
    tags: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      // 1. Microlink API를 이용한 이미지 캡처 (Screenshot -> og:image 순서)
      let screenshot_url = ''
      try {
        // 우선 스크린샷 시도
        const screenshotApi = `https://api.microlink.io?url=${encodeURIComponent(formData.url)}&screenshot=true&embed=screenshot.url`
        
        // 실제 데이터가 존재하는지 확인하기 위해 fetch 시도 (선택 사항이나 권장)
        const response = await fetch(screenshotApi)
        if (response.ok) {
          screenshot_url = screenshotApi
        } else {
          // 스크린샷 실패 시 og:image 시도
          screenshot_url = `https://api.microlink.io?url=${encodeURIComponent(formData.url)}&embed=image.url`
        }
      } catch (err) {
        console.error('Image capture failed:', err)
      }

      // 2. 태그 처리
      const user_tags = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
        : []

      const { data, error } = await supabase
        .from('items')
        .insert([
          {
            url: formData.url,
            title: formData.title || formData.url,
            memo: formData.memo,
            user_tags: user_tags,
            screenshot_url: screenshot_url, // 받아온 스크린샷 URL 저장
          }
        ])
        .select()
        .single()

      if (error) throw error

      // 컬렉션이 선택된 경우 collection_items에도 저장
      let itemWithCollections = { ...data, collections: [] as any[] }
      if (formData.collection_id && data) {
        const { error: relError } = await supabase
          .from('collection_items')
          .insert([
            { collection_id: formData.collection_id, item_id: data.id }
          ])
        
        if (!relError) {
          const selectedCol = collections.find(c => c.id === formData.collection_id)
          itemWithCollections.collections = [{ id: formData.collection_id, name: selectedCol?.name }]
        }
      }

      onSuccess(itemWithCollections)
      onClose()
      setFormData({ url: '', title: '', memo: '', collection_id: '', tags: '' })
    } catch (error: any) {
      alert(error.message || '아이템 저장 중 에러가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#222228] border border-[#2A2A32] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-[#2A2A32]">
          <h2 className="text-lg font-bold text-white tracking-tight">아이템 추가</h2>
          <button onClick={onClose} className="text-[#666666] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">URL *</label>
            <input
              required
              type="url"
              placeholder="https://example.com"
              className="w-full bg-[#1A1A1F] border border-[#2A2A32] rounded-md py-2 px-3 text-sm text-[#E5E5E5] placeholder-[#444] focus:outline-none focus:border-[#F5E642] transition-all"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Title</label>
            <input
              type="text"
              placeholder="제목 (비워두면 URL 사용)"
              className="w-full bg-[#1A1A1F] border border-[#2A2A32] rounded-md py-2 px-3 text-sm text-[#E5E5E5] placeholder-[#444] focus:outline-none focus:border-[#F5E642] transition-all"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Collection</label>
              <select
                className="w-full bg-[#1A1A1F] border border-[#2A2A32] rounded-md py-2 px-3 text-sm text-[#E5E5E5] focus:outline-none focus:border-[#F5E642] appearance-none"
                value={formData.collection_id}
                onChange={(e) => setFormData({ ...formData, collection_id: e.target.value })}
              >
                <option value="">컬렉션 선택 안함</option>
                {collections.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Tags</label>
              <input
                type="text"
                placeholder="미니멀, SaaS (쉼표 구분)"
                className="w-full bg-[#1A1A1F] border border-[#2A2A32] rounded-md py-2 px-3 text-sm text-[#E5E5E5] placeholder-[#444] focus:outline-none focus:border-[#F5E642] transition-all"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Memo</label>
            <textarea
              rows={3}
              placeholder="메모를 입력하세요..."
              className="w-full bg-[#1A1A1F] border border-[#2A2A32] rounded-md py-2 px-3 text-sm text-[#E5E5E5] placeholder-[#444] focus:outline-none focus:border-[#F5E642] transition-all resize-none"
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-transparent border border-[#2A2A32] text-[#666666] py-2.5 rounded-lg text-sm font-bold hover:bg-[#2A2A32] hover:text-[#E5E5E5] transition-all"
            >
              취소
            </button>
            <button
              disabled={loading}
              type="submit"
              className="flex-[2] bg-[#F5E642] text-[#1A1A1F] py-2.5 rounded-lg text-sm font-bold hover:bg-[#e0d23a] transition-all shadow-lg shadow-[#F5E642]/5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
