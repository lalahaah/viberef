'use client'

import { useState, useRef } from 'react'
import { X, Loader2, Upload, Globe, Image as ImageIcon, Check } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { translations, Language } from '@/utils/translations'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newItem: any) => void
  collections: any[]
  language: Language
}

type TabMode = 'url' | 'upload'
type UrlType = 'website' | 'image'

export default function AddItemModal({ isOpen, onClose, onSuccess, collections, language }: AddItemModalProps) {
  const t = translations[language]
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabMode>('url')
  const [urlType, setUrlType] = useState<UrlType>('website')
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    memo: '',
    collection_id: '',
    tags: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      let screenshot_url = ''

      if (activeTab === 'upload' && selectedFile) {
        // 1. 이미지 직접 업로드
        const uploadFormData = new FormData()
        uploadFormData.append('file', selectedFile)
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        })
        
        if (!uploadRes.ok) throw new Error('업로드 실패')
        const uploadData = await uploadRes.json()
        screenshot_url = uploadData.url
      } else if (activeTab === 'url') {
        if (urlType === 'image') {
          // 2. 이미지 URL 직접 입력 - 어떠한 캡처나 업로드 없이 그대로 사용
          screenshot_url = formData.url
        } else {
          // 3. Microlink API를 이용한 웹사이트 캡처
          try {
            const screenshotApi = `https://api.microlink.io?url=${encodeURIComponent(formData.url)}&screenshot=true&embed=screenshot.url`
            const response = await fetch(screenshotApi)
            if (response.ok) {
              screenshot_url = screenshotApi
            } else {
              screenshot_url = `https://api.microlink.io?url=${encodeURIComponent(formData.url)}&embed=image.url`
            }
          } catch (err) {
            console.error('Image capture failed:', err)
          }
        }
      }

      // 태그 처리
      const user_tags = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
        : []

      // 최종 저장 시 urlType에 따른 분기 처리 강화
      const { data, error } = await supabase
        .from('items')
        .insert([
          {
            url: (activeTab === 'url' && urlType === 'image') ? screenshot_url : (activeTab === 'upload' ? screenshot_url : formData.url),
            title: formData.title || (activeTab === 'upload' ? selectedFile?.name : formData.url),
            memo: formData.memo,
            user_tags: user_tags,
            screenshot_url: screenshot_url,
          }
        ])
        .select()
        .single()

      if (error) throw error

      let itemWithCollections = { ...data, collections: [] as any[] }
      if (formData.collection_id && data) {
        const { error: relError } = await supabase
          .from('collection_items')
          .insert([{ collection_id: formData.collection_id, item_id: data.id }])
        
        if (!relError) {
          const selectedCol = collections.find(c => c.id === formData.collection_id)
          itemWithCollections.collections = [{ id: formData.collection_id, name: selectedCol?.name }]
        }
      }

      onSuccess(itemWithCollections)
      handleClose()
    } catch (error: any) {
      alert(error.message || '아이템 저장 중 에러가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setFormData({ url: '', title: '', memo: '', collection_id: '', tags: '' })
    setSelectedFile(null)
    setPreviewUrl(null)
    setActiveTab('url')
    setUrlType('website')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#222228] border border-[#2A2A32] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-[#2A2A32]">
          <h2 className="text-lg font-bold text-white tracking-tight">{t.addItem}</h2>
          <button onClick={handleClose} className="text-[#666666] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-[#1A1A1F] m-4 rounded-lg border border-[#2A2A32]">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === 'url' ? 'bg-[#2A2A32] text-[#F5E642]' : 'text-[#666666] hover:text-[#999]'
            }`}
          >
            <Globe size={14} /> {t.urlMode}
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === 'upload' ? 'bg-[#2A2A32] text-[#F5E642]' : 'text-[#666666] hover:text-[#999]'
            }`}
          >
            <Upload size={14} /> {t.uploadMode}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {activeTab === 'url' ? (
            <div className="space-y-4">
              <div className="flex bg-[#1A1A1F] rounded-md border border-[#2A2A32] p-0.5 w-fit">
                <button
                  type="button"
                  onClick={() => setUrlType('website')}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${
                    urlType === 'website' ? 'bg-[#2A2A32] text-[#E5E5E5]' : 'text-[#666666]'
                  }`}
                >
                  {t.websiteUrl}
                </button>
                <button
                  type="button"
                  onClick={() => setUrlType('image')}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${
                    urlType === 'image' ? 'bg-[#2A2A32] text-[#E5E5E5]' : 'text-[#666666]'
                  }`}
                >
                  {t.imageUrl}
                </button>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">
                  {urlType === 'website' ? 'Website URL *' : 'Image URL *'}
                </label>
                <input
                  required
                  type="url"
                  placeholder={urlType === 'website' ? "https://example.com" : "https://example.com/image.png"}
                  className="w-full bg-[#1A1A1F] border border-[#2A2A32] rounded-md py-2 px-3 text-sm text-[#E5E5E5] placeholder-[#444] focus:outline-none focus:border-[#F5E642] transition-all"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">{t.uploadFile}</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full aspect-video bg-[#1A1A1F] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[#F5E642]/50 group relative overflow-hidden ${
                  selectedFile ? 'border-[#F5E642]' : 'border-[#2A2A32]'
                }`}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-bold">{t.uploadChange}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-[#2A2A32] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload size={20} className="text-[#666666] group-hover:text-[#F5E642]" />
                    </div>
                    <p className="text-xs font-bold text-[#666666] group-hover:text-[#999]">{t.uploadPlaceholder}</p>
                    <p className="text-[10px] text-[#444] mt-1">{t.uploadHint}</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">{t.title}</label>
            <input
              type="text"
              placeholder={t.placeholderTitle}
              className="w-full bg-[#1A1A1F] border border-[#2A2A32] rounded-md py-2 px-3 text-sm text-[#E5E5E5] placeholder-[#444] focus:outline-none focus:border-[#F5E642] transition-all"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">{t.collections}</label>
              <select
                className="w-full bg-[#1A1A1F] border border-[#2A2A32] rounded-md py-2 px-3 text-sm text-[#E5E5E5] focus:outline-none focus:border-[#F5E642] appearance-none"
                value={formData.collection_id}
                onChange={(e) => setFormData({ ...formData, collection_id: e.target.value })}
              >
                <option value="">{t.selectCollection}</option>
                {collections.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">{t.tags}</label>
              <input
                type="text"
                placeholder={t.placeholderTags}
                className="w-full bg-[#1A1A1F] border border-[#2A2A32] rounded-md py-2 px-3 text-sm text-[#E5E5E5] placeholder-[#444] focus:outline-none focus:border-[#F5E642] transition-all"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">{t.memo}</label>
            <textarea
              rows={2}
              placeholder={t.placeholderMemo}
              className="w-full bg-[#1A1A1F] border border-[#2A2A32] rounded-md py-2 px-3 text-sm text-[#E5E5E5] placeholder-[#444] focus:outline-none focus:border-[#F5E642] transition-all resize-none"
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-transparent border border-[#2A2A32] text-[#666666] py-2.5 rounded-lg text-sm font-bold hover:bg-[#2A2A32] hover:text-[#E5E5E5] transition-all"
            >
              {t.cancel}
            </button>
            <button
              disabled={loading || (activeTab === 'upload' && !selectedFile) || (activeTab === 'url' && !formData.url)}
              type="submit"
              className="flex-[2] bg-[#F5E642] text-[#1A1A1F] py-2.5 rounded-lg text-sm font-bold hover:bg-[#e0d23a] transition-all shadow-lg shadow-[#F5E642]/5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
