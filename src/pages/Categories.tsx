// src/pages/Categories.tsx
import React, { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import type { Category } from '../types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import toast from 'react-hot-toast';

const CategoryForm: React.FC<{
  category?: Category | null;
  onSave: (data: Partial<Category>) => void;
  onClose: () => void;
}> = ({ category, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    category_name: category?.category_name || '',
    description: category?.description || '',
    thumbnail: category?.thumbnail || '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="category_name">Kategori Adı</Label>
        <Input
          id="category_name"
          name="category_name"
          value={formData.category_name}
          onChange={handleChange}
          required
          disabled={!!category}
        />
      </div>
      <div>
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="thumbnail">Görsel URL</Label>
        <Input
          id="thumbnail"
          name="thumbnail"
          value={formData.thumbnail}
          onChange={handleChange}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          İptal
        </Button>
        <Button type="submit">Kaydet</Button>
      </DialogFooter>
    </form>
  );
};

const Categories: React.FC = () => {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [isAddOpen, setAddOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const handleAdd = async (data: Partial<Category>) => {
    const result = await addCategory(data as any);
    if (result.success) {
      toast.success('Kategori başarıyla eklendi!');
      setAddOpen(false);
    } else {
      toast.error('Kategori eklenirken bir hata oluştu.');
    }
  };

  const handleUpdate = async (data: Partial<Category>) => {
    if (!selectedCategory) return;
    const result = await updateCategory(selectedCategory.category_name, data);
    if (result.success) {
      toast.success('Kategori başarıyla güncellendi!');
      setEditOpen(false);
    } else {
      toast.error('Kategori güncellenirken bir hata oluştu.');
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    const result = await deleteCategory(selectedCategory.category_name);
    if (result.success) {
      toast.success('Kategori başarıyla silindi!');
      setDeleteOpen(false);
    } else {
      toast.error('Kategori silinirken bir hata oluştu.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Kategoriler</h2>
        <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Yeni Kategori Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Kategori Ekle</DialogTitle>
            </DialogHeader>
            <CategoryForm
              onSave={handleAdd}
              onClose={() => setAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Görsel</TableHead>
              <TableHead>Kategori Adı</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <TableRow key={category.category_name}>
                  <TableCell>
                    {category.thumbnail ? (
                      <img
                        src={category.thumbnail}
                        alt={category.category_name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {category.category_name}
                  </TableCell>
                  <TableCell>{category.description || '-'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCategory(category);
                            setEditOpen(true);
                          }}
                        >
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedCategory(category);
                            setDeleteOpen(true);
                          }}
                        >
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Henüz kategori bulunmuyor.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategoriyi Düzenle</DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={selectedCategory}
            onSave={handleUpdate}
            onClose={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategoriyi Sil</DialogTitle>
            <DialogDescription>
              "{selectedCategory?.category_name}" kategorisini silmek
              istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;