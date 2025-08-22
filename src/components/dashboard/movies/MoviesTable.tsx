import { useState } from 'react'
import type { Movie } from '@/api/types'
import { formatMovieData } from '@/lib/movies-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload
} from 'lucide-react'
import { useMovies } from '@/contexts/MoviesContext'
import { useMoviesApi } from '@/hooks/use-movies-api'

interface MoviesTableProps {
  onEdit: (movie: Movie) => void
  onDelete: (movieId: number) => void
  onView: (movie: Movie) => void
  onAddSingle: () => void
  onAddMultiple: () => void
}

export function MoviesTable({ 
  onEdit, 
  onDelete, 
  onView, 
  onAddSingle, 
  onAddMultiple 
}: MoviesTableProps) {
  const { state, dispatch } = useMovies()
  const { fetchMovies } = useMoviesApi()
  const [searchTerm, setSearchTerm] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')

  // Filtreleri uygula
  const applyFilters = () => {
    const filters = {
      search: searchTerm,
      year: yearFilter,
      rating: ratingFilter
    }
    
    dispatch({ type: 'SET_FILTERS', payload: filters })
    fetchMovies(state.pagination, filters)
  }

  // Filtreleri sıfırla
  const resetFilters = () => {
    setSearchTerm('')
    setYearFilter('')
    setRatingFilter('')
    dispatch({ type: 'RESET_FILTERS' })
    fetchMovies(state.pagination)
  }

  // Sayfa değiştir
  const changePage = (newPage: number) => {
    const newPagination = { ...state.pagination, page: newPage }
    fetchMovies(newPagination, state.filters)
  }

  // Limit değiştir
  const changeLimit = (newLimit: number) => {
    const newPagination = { page: 1, limit: newLimit }
    fetchMovies(newPagination, state.filters)
  }

  return (
    <div className="space-y-4">
      {/* Header ve Filtreler */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Filmler</h2>
          <p className="text-muted-foreground">
            Toplam {state.totalCount} film bulundu
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={onAddSingle} size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Tek Film Ekle
          </Button>
          <Button onClick={onAddMultiple} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Çoklu Film Ekle
          </Button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Film adı veya IMDB ID ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder="Yıl"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-20"
          />
          <Input
            placeholder="Min Puan"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-24"
          />
          <Button onClick={applyFilters} size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrele
          </Button>
          <Button onClick={resetFilters} variant="outline" size="sm">
            Sıfırla
          </Button>
        </div>
      </div>

      {/* Tablo */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Resim</TableHead>
              <TableHead>Başlık</TableHead>
              <TableHead className="w-20">Yıl</TableHead>
              <TableHead className="w-24">Süre</TableHead>
              <TableHead className="w-20">Puan</TableHead>
              <TableHead className="w-24">IMDB ID</TableHead>
              <TableHead className="w-20">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Yükleniyor...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : state.movies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Film bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              state.movies.map((movie) => {
                const formatted = formatMovieData(movie)
                return (
                  <TableRow key={movie.id}>
                    <TableCell>
                      {formatted.image ? (
                        <img 
                          src={formatted.image} 
                          alt={formatted.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">Resim Yok</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatted.title}</div>
                        {movie.contentrating && (
                          <Badge variant="secondary" className="text-xs">
                            {movie.contentrating}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatted.year}</Badge>
                    </TableCell>
                    <TableCell>{formatted.duration}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{formatted.rating}</span>
                        {movie.numvotes && (
                          <span className="text-xs text-muted-foreground">
                            ({movie.numvotes.toLocaleString('tr-TR')} oy)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {formatted.imdbId}
                      </code>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(movie)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Görüntüle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(movie)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(movie.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sayfalama */}
      {state.totalCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Sayfa {state.pagination.page} / {Math.ceil(state.totalCount / state.pagination.limit)}
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={state.pagination.limit}
              onChange={(e) => changeLimit(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(1)}
                disabled={state.pagination.page === 1}
              >
                İlk
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(state.pagination.page - 1)}
                disabled={state.pagination.page === 1}
              >
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(state.pagination.page + 1)}
                disabled={state.pagination.page >= Math.ceil(state.totalCount / state.pagination.limit)}
              >
                Sonraki
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(Math.ceil(state.totalCount / state.pagination.limit))}
                disabled={state.pagination.page >= Math.ceil(state.totalCount / state.pagination.limit)}
              >
                Son
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
