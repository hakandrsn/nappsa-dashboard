import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useIngredientsSearch } from '@/hooks/use-ingredients-search'
import { useLanguage } from '@/contexts/LanguageContext'
import { X, Search, Plus } from 'lucide-react'
import type { FoodIngredient, FoodIngredientTranslation } from '@/api/types'

interface IngredientSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (ingredient: { ingredient: FoodIngredient; translation: FoodIngredientTranslation | null }) => void
  selectedIngredients: Array<{ ingredient_id: number; quantity: string; unit: string }>
}

interface SearchResult {
  ingredient: FoodIngredient
  translation: FoodIngredientTranslation | null
}

export function IngredientSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedIngredients 
}: IngredientSelectionModalProps) {
  const { currentLanguage } = useLanguage()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set())
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Yeni hook'u kullan - cache key'leri optimize edilmiş
  const {
    data: ingredientsData,
    count: ingredientsCount,
    isSearchMode,
    isLoading
  } = useIngredientsSearch({
    languageCode: currentLanguage,
    searchTerm,
    page: currentPage,
    limit: 50
  })

  // Modal açıldığında search input'a focus ol
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
        console.log('Ingredient selection modal opened, search input focused')
      }, 100)
    }
  }, [isOpen])

  // Search term değişince sayfa 1'e dön
  useEffect(() => {
    if (searchTerm) {
      setCurrentPage(1)
    }
  }, [searchTerm])

  // Modal kapandığında state'i temizle
  const handleClose = () => {
    setSearchTerm('')
    setCurrentPage(1)
    onClose()
  }

  // Malzeme seç
  const handleSelectIngredient = (result: SearchResult) => {
    // Zaten seçili mi kontrol et
    const isAlreadySelected = selectedIngredients.some(
      item => item.ingredient_id === result.ingredient.id
    )
    
    if (isAlreadySelected) {
      alert('Bu malzeme zaten seçili!')
      return
    }

    onSelect(result)
    handleClose()
  }

  // Daha fazla yükle
  const handleLoadMore = () => {
    const nextPage = currentPage + 1
    console.log('Loading more ingredients, page:', nextPage)
    setCurrentPage(nextPage)
  }

  // Scroll ile yeni data yükle
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const { scrollTop, scrollHeight, clientHeight } = target
    
    // Scroll sonuna yaklaşıldığında yeni data yükle
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (!isSearchMode && ingredientsData.length < ingredientsCount) {
        console.log('🔄 Scroll ile yeni data yükleniyor...')
        handleLoadMore()
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Malzeme Seç
          </DialogTitle>
          <DialogDescription>
            Aradığınız malzemeyi bulun ve seçin. Arama yaparak hızlıca bulabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-full space-y-4">
          {/* Arama Alanı */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder="Malzeme ara... (örn: domates, salmon, un, tavuk, et)"
              className="pl-10 pr-4 h-12 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

                        {/* Arama Durumu */}
              {searchTerm && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">"{searchTerm}"</span> için aranıyor...
                  {isSearchMode && (
                    <span className="ml-2">
                      {ingredientsData.length} sonuç bulundu
                    </span>
                  )}
                </div>
              )}

              {/* Seçili Malzemeler Özeti */}
              {selectedIngredients.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 mb-2">
                    🎯 Seçili Malzemeler ({selectedIngredients.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedIngredients.map((ingredient, index) => (
                      <div key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        #{ingredient.ingredient_id} - {ingredient.quantity} {ingredient.unit}
                      </div>
                    ))}
                  </div>
                </div>
              )}

          {/* Malzeme Listesi */}
          <div className="flex-1 overflow-hidden">
            <div 
              className="h-96 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              onScroll={handleScroll}
            >
              {/* Debug Bilgileri */}
              <div className="p-3 text-xs text-gray-500 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div>🔍 Search Mode: {isSearchMode ? 'Yes' : 'No'}</div>
                  <div>📝 Search Term: "{searchTerm}"</div>
                  <div>📊 Results: {ingredientsData.length}</div>
                  <div>📄 Page: {currentPage}</div>
                  <div>⏳ Loading: {isLoading ? 'Yes' : 'No'}</div>
                  <div>🌍 Language: {currentLanguage}</div>
                </div>
                {searchTerm && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700">
                    <strong>Arama Detayı:</strong> "{searchTerm}" için {ingredientsData.length} sonuç bulundu
                  </div>
                )}
              </div>

                             {/* Malzeme Kartları */}
               {ingredientsData.map((result) => {
                 const isSelected = selectedIngredients.some(
                   item => item.ingredient_id === result.ingredient.id
                 )
                 
                 return (
                   <div
                     key={result.ingredient.id}
                     className={`
                       p-4 border rounded-lg cursor-pointer transition-all
                       ${isSelected 
                         ? 'border-blue-500 bg-blue-50' 
                         : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                       }
                     `}
                     onClick={() => handleSelectIngredient(result)}
                   >
                     <div className="flex items-center justify-between">
                       <div className="flex-1">
                         <h4 className="font-medium text-lg">
                           {result.translation?.name || 'Ad Yok'}
                         </h4>
                         {result.translation?.description && (
                           <div className="mt-1">
                             <button
                               type="button"
                               onClick={(e) => {
                                 e.stopPropagation()
                                 // Description'ı aç/kapat
                                 const isExpanded = expandedDescriptions.has(result.ingredient.id)
                                 if (isExpanded) {
                                   setExpandedDescriptions(prev => {
                                     const newSet = new Set(prev)
                                     newSet.delete(result.ingredient.id)
                                     return newSet
                                   })
                                 } else {
                                   setExpandedDescriptions(prev => {
                                     const newSet = new Set(prev)
                                     newSet.add(result.ingredient.id)
                                     return newSet
                                   })
                                 }
                               }}
                               className="text-sm text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1"
                             >
                               {expandedDescriptions.has(result.ingredient.id) ? '📖 Gizle' : '📖 Detayları göster'}
                             </button>
                             <p className={`text-sm text-muted-foreground mt-1 transition-all duration-200 ${
                               expandedDescriptions.has(result.ingredient.id) ? '' : 'line-clamp-1'
                             }`}>
                               {result.translation.description}
                             </p>
                           </div>
                         )}
                         <div className="text-xs text-gray-400 mt-2">
                           ID: {result.ingredient.id}
                           {result.ingredient.source_id && (
                             <span className="ml-2">• Source: {result.ingredient.source_id}</span>
                           )}
                         </div>
                       </div>
                       <div className="flex items-center space-x-2">
                         {isSelected && (
                           <div className="text-blue-600 text-sm font-medium flex items-center gap-1">
                             <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                             Seçili
                           </div>
                         )}
                         <Button
                           variant={isSelected ? "secondary" : "outline"}
                           size="sm"
                           onClick={(e) => {
                             e.stopPropagation()
                             handleSelectIngredient(result)
                           }}
                           disabled={isSelected}
                         >
                           {isSelected ? (
                             <>
                               <X className="h-4 w-4 mr-1" />
                               Kaldır
                             </>
                           ) : (
                             <>
                               <Plus className="h-4 w-4 mr-1" />
                               Seç
                             </>
                           )}
                         </Button>
                       </div>
                     </div>
                   </div>
                 )
               })}

              {/* Loading State */}
              {isLoading && (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isSearchMode ? 'Aranıyor...' : 'Yükleniyor...'}
                  </p>
                </div>
              )}

              {/* No Results */}
              {!isLoading && ingredientsData.length === 0 && searchTerm && (
                <div className="p-8 text-center">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Sonuç bulunamadı
                  </h3>
                  <p className="text-gray-500">
                    "{searchTerm}" için malzeme bulunamadı. Farklı anahtar kelimeler deneyin.
                  </p>
                </div>
              )}

              {/* Load More Button */}
              {!isSearchMode && ingredientsData.length < ingredientsCount && (
                <div className="p-4 text-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Daha Fazla Yükle (+50)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            İptal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
