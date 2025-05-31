import React, { useState } from 'react';
import { useRecommendations } from '../hooks/useRecommendations';
import type { DailyRecommendation } from '../types';

const Recommendations: React.FC = () => {
  const { recommendations, loading, error, addRecommendation, updateRecommendation, deleteRecommendation } = useRecommendations();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState<DailyRecommendation | null>(null);
  
  const [formData, setFormData] = useState<{
    date: string;
    menu: string;
    metadata: string;
  }>({
    date: '',
    menu: '{}',
    metadata: '{}',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const menuJson = JSON.parse(formData.menu);
      const metadataJson = formData.metadata ? JSON.parse(formData.metadata) : {};
      
      const recommendationData = {
        date: formData.date,
        menu: menuJson,
        metadata: metadataJson,
      };
      
      const result = await addRecommendation(recommendationData);
      if (result.success) {
        setIsAddModalOpen(false);
        resetForm();
      }
    } catch (err) {
      alert('JSON formatı hatalı. Lütfen kontrol ediniz.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecommendation) return;
    
    try {
      const menuJson = JSON.parse(formData.menu);
      const metadataJson = formData.metadata ? JSON.parse(formData.metadata) : {};
      
      const recommendationData = {
        date: formData.date,
        menu: menuJson,
        metadata: metadataJson,
      };
      
      const result = await updateRecommendation(currentRecommendation.id, recommendationData);
      if (result.success) {
        setIsEditModalOpen(false);
      }
    } catch (err) {
      alert('JSON formatı hatalı. Lütfen kontrol ediniz.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentRecommendation) return;
    
    const result = await deleteRecommendation(currentRecommendation.id);
    if (result.success) {
      setIsDeleteModalOpen(false);
    }
  };

  const openEditModal = (recommendation: DailyRecommendation) => {
    setCurrentRecommendation(recommendation);
    setFormData({
      date: recommendation.date || '',
      menu: JSON.stringify(recommendation.menu || {}, null, 2),
      metadata: JSON.stringify(recommendation.metadata || {}, null, 2),
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (recommendation: DailyRecommendation) => {
    setCurrentRecommendation(recommendation);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (recommendation: DailyRecommendation) => {
    setCurrentRecommendation(recommendation);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      date: '',
      menu: '{}',
      metadata: '{}',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Hata</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Günlük Öneriler</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
        >
          <span className="mr-2">+</span> Yeni Öneri
        </button>
      </div>

      {/* Öneriler Listesi */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarih
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Menü Öğe Sayısı
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Oluşturulma Tarihi
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recommendations.length > 0 ? (
              recommendations.map((recommendation) => (
                <tr key={recommendation.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {recommendation.date ? new Date(recommendation.date).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {recommendation.menu ? Object.keys(recommendation.menu).length : 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(recommendation.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openViewModal(recommendation)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Görüntüle
                    </button>
                    <button
                      onClick={() => openEditModal(recommendation)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => openDeleteModal(recommendation)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  Henüz öneri bulunmuyor. Yeni bir öneri ekleyin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Öneri Ekleme Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Yeni Öneri Ekle</h3>
            <form onSubmit={handleAddSubmit}>
              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="menu" className="block text-sm font-medium text-gray-700 mb-1">
                  Menü (JSON formatında)
                </label>
                <textarea
                  id="menu"
                  name="menu"
                  value={formData.menu}
                  onChange={handleInputChange}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Örnek: {"{"}"breakfast": ["item1", "item2"], "lunch": ["item3", "item4"]{"}"}
                </p>
              </div>
              <div className="mb-4">
                <label htmlFor="metadata" className="block text-sm font-medium text-gray-700 mb-1">
                  Metadata (JSON formatında, opsiyonel)
                </label>
                <textarea
                  id="metadata"
                  name="metadata"
                  value={formData.metadata}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Öneri Düzenleme Modal */}
      {isEditModalOpen && currentRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Öneri Düzenle</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="menu" className="block text-sm font-medium text-gray-700 mb-1">
                  Menü (JSON formatında)
                </label>
                <textarea
                  id="menu"
                  name="menu"
                  value={formData.menu}
                  onChange={handleInputChange}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="metadata" className="block text-sm font-medium text-gray-700 mb-1">
                  Metadata (JSON formatında, opsiyonel)
                </label>
                <textarea
                  id="metadata"
                  name="metadata"
                  value={formData.metadata}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Öneri Görüntüleme Modal */}
      {isViewModalOpen && currentRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Öneri Detayı: {currentRecommendation.date ? new Date(currentRecommendation.date).toLocaleDateString() : 'Tarih belirtilmemiş'}
              </h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-2">Menü</h4>
              <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(currentRecommendation.menu || {}, null, 2)}
              </pre>
            </div>
            
            {currentRecommendation.metadata && Object.keys(currentRecommendation.metadata).length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-2">Metadata</h4>
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
                  {JSON.stringify(currentRecommendation.metadata, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="mt-6 text-right">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Öneri Silme Modal */}
      {isDeleteModalOpen && currentRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Öneri Sil</h3>
            <p className="mb-4 text-gray-600">
              {currentRecommendation.date ? new Date(currentRecommendation.date).toLocaleDateString() : 'Belirtilmemiş'} tarihli öneriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recommendations;
