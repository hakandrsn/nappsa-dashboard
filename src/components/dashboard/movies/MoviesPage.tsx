import { useState, useEffect } from 'react'
import type { Movie } from '@/api/types'
import { MoviesTable } from './MoviesTable'
import { MovieFormModal } from './MovieFormModal'
import { MultipleMoviesModal } from './MultipleMoviesModal'
import { MoviesProvider } from '@/contexts/MoviesContext'
import { useMoviesApi } from '@/hooks/use-movies-api'
import { useMovies } from '@/contexts/MoviesContext'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'

function MoviesPageContent() {
  const { state } = useMovies()
  const { fetchMovies, deleteMovie, loading } = useMoviesApi()
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isMultipleModalOpen, setIsMultipleModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null)

  // Sayfa yüklendiğinde filmleri getir
  useEffect(() => {
    fetchMovies({ page: 1, limit: 20 })
  }, [fetchMovies])

  // Tek film ekleme
  const handleAddSingle = () => {
    setSelectedMovie(null)
    setIsFormModalOpen(true)
  }

  // Çoklu film ekleme
  const handleAddMultiple = () => {
    setIsMultipleModalOpen(true)
  }

  // Film düzenleme
  const handleEdit = (movie: Movie) => {
    setSelectedMovie(movie)
    setIsFormModalOpen(true)
  }

  // Film silme
  const handleDelete = (movieId: number) => {
    const movie = state.movies.find((m: Movie) => m.id === movieId)
    if (movie) {
      setMovieToDelete(movie)
      setIsDeleteModalOpen(true)
    }
  }

  // Film görüntüleme
  const handleView = (movie: Movie) => {
    setSelectedMovie(movie)
    setIsViewModalOpen(true)
  }

  // Silme işlemini onayla
  const confirmDelete = async () => {
    if (movieToDelete) {
      try {
        await deleteMovie(movieToDelete.id)
        setIsDeleteModalOpen(false)
        setMovieToDelete(null)
      } catch (error) {
        console.error('Film silinirken hata:', error)
      }
    }
  }

  // Form başarılı olduğunda
  const handleFormSuccess = () => {
    fetchMovies({ page: 1, limit: 20 })
  }

  return (
    <div className="space-y-6">
      <MoviesTable
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onAddSingle={handleAddSingle}
        onAddMultiple={handleAddMultiple}
      />

      {/* Tek Film Ekleme/Düzenleme Modal */}
      <MovieFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        movie={selectedMovie}
        onSuccess={handleFormSuccess}
      />

      {/* Çoklu Film Ekleme Modal */}
      <MultipleMoviesModal
        isOpen={isMultipleModalOpen}
        onClose={() => setIsMultipleModalOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Silme Onay Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Film Sil
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {movieToDelete && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {movieToDelete.primaryimage ? (
                    <img 
                      src={movieToDelete.primaryimage} 
                      alt={movieToDelete.originaltitle}
                      className="w-16 h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-muted rounded flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Resim Yok</span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium">{movieToDelete.originaltitle}</h4>
                    <p className="text-sm text-muted-foreground">
                      IMDB ID: {movieToDelete.imdb_id}
                    </p>
                    {movieToDelete.startyear && (
                      <p className="text-sm text-muted-foreground">
                        Yıl: {movieToDelete.startyear}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <p className="text-sm text-destructive">
                    <strong>Dikkat:</strong> Bu film ve tüm çevirileri kalıcı olarak silinecektir. 
                    Bu işlem geri alınamaz.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
            >
              İptal
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? 'Siliniyor...' : 'Evet, Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Film Görüntüleme Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Film Detayları</DialogTitle>
          </DialogHeader>
          
          {selectedMovie && (
            <div className="space-y-6">
              {/* Film Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Poster */}
                <div className="md:col-span-1">
                  {selectedMovie.primaryimage ? (
                    <img 
                      src={selectedMovie.primaryimage} 
                      alt={selectedMovie.originaltitle}
                      className="w-full rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground">Resim Yok</span>
                    </div>
                  )}
                </div>

                {/* Detaylar */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedMovie.originaltitle}</h3>
                    {selectedMovie.startyear && (
                      <p className="text-lg text-muted-foreground">
                        {selectedMovie.startyear}
                        {selectedMovie.endyear && selectedMovie.endyear !== selectedMovie.startyear && 
                          ` - ${selectedMovie.endyear}`
                        }
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">IMDB ID:</span>
                      <p className="text-muted-foreground">{selectedMovie.imdb_id}</p>
                    </div>
                    <div>
                      <span className="font-medium">Tür:</span>
                      <p className="text-muted-foreground">{selectedMovie.type || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Süre:</span>
                      <p className="text-muted-foreground">
                        {selectedMovie.runtimeminutes ? `${selectedMovie.runtimeminutes} dakika` : 'Belirtilmemiş'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Puan:</span>
                      <p className="text-muted-foreground">
                        {selectedMovie.averagerating ? `${selectedMovie.averagerating}/10` : 'Belirtilmemiş'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Yaş Sınırı:</span>
                      <p className="text-muted-foreground">{selectedMovie.contentrating || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Oy Sayısı:</span>
                      <p className="text-muted-foreground">
                        {selectedMovie.numvotes ? selectedMovie.numvotes.toLocaleString('tr-TR') : 'Belirtilmemiş'}
                      </p>
                    </div>
                  </div>

                  {/* URL'ler */}
                  {(selectedMovie.url || selectedMovie.trailer) && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Bağlantılar</h4>
                      <div className="flex gap-2">
                        {selectedMovie.url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedMovie.url} target="_blank" rel="noopener noreferrer">
                              IMDB Sayfası
                            </a>
                          </Button>
                        )}
                        {selectedMovie.trailer && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedMovie.trailer} target="_blank" rel="noopener noreferrer">
                              Fragman
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* İstatistikler */}
              {(selectedMovie.budget || selectedMovie.grossworldwide || selectedMovie.metascore) && (
                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">İstatistikler</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedMovie.budget && (
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ${(selectedMovie.budget / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-sm text-muted-foreground">Bütçe</div>
                      </div>
                    )}
                    {selectedMovie.grossworldwide && (
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          ${(selectedMovie.grossworldwide / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-sm text-muted-foreground">Dünya Hasılatı</div>
                      </div>
                    )}
                    {selectedMovie.metascore && (
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedMovie.metascore}
                        </div>
                        <div className="text-sm text-muted-foreground">Metascore</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Kapat
            </Button>
            {selectedMovie && (
              <Button onClick={() => {
                setIsViewModalOpen(false)
                handleEdit(selectedMovie)
              }}>
                Düzenle
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function MoviesPage() {
  return (
    <MoviesProvider>
      <MoviesPageContent />
    </MoviesProvider>
  )
}
