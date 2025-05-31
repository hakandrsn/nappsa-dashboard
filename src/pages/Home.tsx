// src/pages/Home.tsx
import React from 'react';
import { useCategories } from '../hooks/useCategories';
import { useItems } from '../hooks/useItems';
import { useRecommendations } from '../hooks/useRecommendations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton'; // Yükleme durumu için
import { Package, LayoutGrid, ListChecks, FileText, Bell } from 'lucide-react'; // İkonlar

const StatCard: React.FC<{
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  loading?: boolean;
}> = ({ title, value, description, icon: Icon, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-6 rounded-sm" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-4 w-32 mt-1" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

const Home: React.FC = () => {
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { items, loading: itemsLoading, error: itemsError } = useItems();
  const { recommendations, loading: recommendationsLoading, error: recommendationsError } = useRecommendations();

  const isLoading = categoriesLoading || itemsLoading || recommendationsLoading;
  const hasError = categoriesError || itemsError || recommendationsError;

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Bir Hata Oluştu</CardTitle>
            <CardDescription>
              Veriler yüklenirken bir sorunla karşılaşıldı. Lütfen daha sonra tekrar deneyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {categoriesError || itemsError || recommendationsError}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recentItems = items.slice(0, 5);
  const recentRecommendations = recommendations.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Toplam Kategori"
          value={categories.length}
          description="Sistemdeki kategori sayısı"
          icon={LayoutGrid}
          loading={categoriesLoading}
        />
        <StatCard
          title="Toplam İçerik"
          value={items.length}
          description="Sistemdeki içerik sayısı"
          icon={Package}
          loading={itemsLoading}
        />
        <StatCard
          title="Toplam Öneri"
          value={recommendations.length}
          description="Oluşturulan günlük öneri sayısı"
          icon={Bell}
          loading={recommendationsLoading}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Son Eklenen İçerikler
            </CardTitle>
            <CardDescription>En son eklenen 5 içerik.</CardDescription>
          </CardHeader>
          <CardContent>
            {itemsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Puan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {item.icon || <Package size={16} className="text-muted-foreground" />}
                        {item.title}
                      </TableCell>
                      <TableCell>
                        {item.category ? (
                          <Badge variant="outline">{item.category}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.score !== null ? (
                          <Badge variant="secondary">{item.score}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henüz içerik eklenmemiş.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Son Öneriler
            </CardTitle>
            <CardDescription>En son oluşturulan 3 günlük öneri.</CardDescription>
          </CardHeader>
          <CardContent>
            {recommendationsLoading ? (
               <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentRecommendations.length > 0 ? (
              <div className="space-y-3">
                {recentRecommendations.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <p className="text-sm font-medium">
                        {rec.date ? new Date(rec.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric'}) : 'Tarih Belirtilmemiş'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rec.menu ? Object.keys(rec.menu).length : 0} öğün içeriyor
                      </p>
                    </div>
                    <Badge variant="outline">
                        ID: {rec.id}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henüz öneri oluşturulmamış.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
