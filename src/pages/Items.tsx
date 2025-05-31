// src/pages/Items.tsx
import React, { useState } from 'react';
import { useItems } from '../hooks/useItems';
import { useCategories } from '../hooks/useCategories';
import type { Item } from '../types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import toast from 'react-hot-toast';

// ... (ItemForm component - Kendi form bileşeninizi oluşturabilirsiniz)

const Items: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const { items, loading, addItem, updateItem, deleteItem } = useItems(selectedCategory);
    const { categories } = useCategories();

    // ... (State ve handler fonksiyonları - Categories.tsx'e benzer şekilde)
    
    // Örnek bir Item ekleme fonksiyonu
    const handleAddItem = async (formData: any) => {
        const itemData = {
            ...formData,
            score: formData.score ? parseInt(formData.score, 10) : null,
            tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : [],
        };
        const result = await addItem(itemData);
        if (result.success) {
            toast.success('Ürün başarıyla eklendi!');
            // ... (close modal)
        } else {
            toast.error('Ürün eklenirken bir hata oluştu.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Ürünler</h2>
                <div className="flex items-center gap-4">
                    <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Kategori Filtrele" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Kategoriler</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat.category_name} value={cat.category_name}>
                                    {cat.category_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Dialog>
                         <DialogTrigger asChild>
                             <Button size="sm" className="gap-1">
                                <PlusCircle className="h-4 w-4" />
                                Yeni Ürün Ekle
                             </Button>
                         </DialogTrigger>
                         <DialogContent>
                             {/* Buraya ItemForm bileşeni gelecek */}
                         </DialogContent>
                     </Dialog>
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Başlık</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Puan</TableHead>
                            <TableHead>İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow><TableCell colSpan={4} className="text-center">Yükleniyor...</TableCell></TableRow>
                        ) : items.length > 0 ? (
                            items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.icon} {item.title}</TableCell>
                                    <TableCell>{item.category || '-'}</TableCell>
                                    <TableCell>{item.score ?? '-'}</TableCell>
                                    <TableCell>
                                        {/* DropdownMenu ile Düzenle/Sil işlemleri */}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow><TableCell colSpan={4} className="text-center">Ürün bulunmuyor.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
             {/* Edit ve Delete Dialog'ları buraya eklenecek */}
        </div>
    );
};

export default Items;