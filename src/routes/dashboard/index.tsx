import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChefHat, 
  Utensils, 
  Tags, 
  Globe, 
  Film, 
  Users, 
  Clock,
  Star
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndexComponent,
})

function DashboardIndexComponent() {
  // Mock data - gerçek uygulamada API'den gelecek
  const stats = {
    totalRecipes: 1247,
    totalIngredients: 856,
    totalCategories: 23,
    totalCuisines: 15,
    totalTags: 89,
    totalMovies: 3421,
    totalUsers: 1234,
    recentActivity: 45
  }

  const recentRecipes = [
    { id: 1, title: 'Mercimek Çorbası', difficulty: 'Easy', prepTime: 15, rating: 4.8 },
    { id: 2, title: 'İskender Kebap', difficulty: 'Medium', prepTime: 45, rating: 4.9 },
    { id: 3, title: 'Baklava', difficulty: 'Hard', prepTime: 120, rating: 4.7 },
  ]

  const recentMovies = [
    { id: 1, title: 'Inception', year: 2010, rating: 8.8, genre: 'Bilim Kurgu' },
    { id: 2, title: 'The Dark Knight', year: 2008, rating: 9.0, genre: 'Aksiyon' },
    { id: 3, title: 'Pulp Fiction', year: 1994, rating: 8.9, genre: 'Suç' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Nappsa platformunun genel durumu ve istatistikleri
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tarif</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecipes.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">
              +12% geçen aydan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Malzeme</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIngredients.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">
              +8% geçen aydan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Film</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMovies.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">
              +15% geçen aydan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">
              +20% geçen aydan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Content */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Recipes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Son Eklenen Tarifler
            </CardTitle>
            <CardDescription>
              Platforma son eklenen tarifler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRecipes.map((recipe) => (
              <div key={recipe.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-1">
                  <p className="font-medium">{recipe.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">{recipe.difficulty}</Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {recipe.prepTime} dk
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {recipe.rating}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Görüntüle
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Movies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Son Eklenen Filmler
            </CardTitle>
            <CardDescription>
              Platforma son eklenen filmler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentMovies.map((movie) => (
              <div key={movie.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-1">
                  <p className="font-medium">{movie.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{movie.year}</Badge>
                    <Badge variant="secondary">{movie.genre}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {movie.rating}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Görüntüle
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hızlı İşlemler</CardTitle>
          <CardDescription>
            Sık kullanılan işlemler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button>
              <ChefHat className="h-4 w-4 mr-2" />
              Yeni Tarif Ekle
            </Button>
            <Button variant="outline" asChild>
              <a href="/dashboard/movies">
                <Film className="h-4 w-4 mr-2" />
                Film Yönetimi
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/dashboard/foods">
                <ChefHat className="h-4 w-4 mr-2" />
                Yiyecek Yönetimi
              </a>
            </Button>
            <Button variant="outline">
              <Utensils className="h-4 w-4 mr-2" />
              Malzeme Yönetimi
            </Button>
            <Button variant="outline">
              <Tags className="h-4 w-4 mr-2" />
              Etiket Yönetimi
            </Button>
            <Button variant="outline">
              <Globe className="h-4 w-4 mr-2" />
              Mutfak Yönetimi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
