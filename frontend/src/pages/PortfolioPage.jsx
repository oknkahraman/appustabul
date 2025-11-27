import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import { ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react';
import Navbar from '../components/Navbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PortfolioPage = ({ user, onLogout }) => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState([]);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [uploadData, setUploadData] = useState({
    description: '',
    material_tag: '',
    technique_tag: '',
    file: null
  });

  const isOwner = user && user.id === workerId;

  useEffect(() => {
    fetchPortfolio();
  }, [workerId]);

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch portfolio
      const portfolioRes = await axios.get(`${API}/portfolio/${workerId}`, { headers });
      setPortfolio(portfolioRes.data);

      // Fetch worker details
      const workerRes = await axios.get(`${API}/workers/${workerId}`, { headers });
      setWorker(workerRes.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error('Portfolyo yüklenemedi');
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData({ ...uploadData, file: e.target.files[0] });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadData.file) {
      toast.error('Lütfen bir fotoğraf seçin');
      return;
    }

    if (uploadData.description.length < 20) {
      toast.error('Açıklama en az 20 karakter olmalı');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('worker_id', workerId);
      formData.append('description', uploadData.description);
      formData.append('material_tag', uploadData.material_tag);
      formData.append('technique_tag', uploadData.technique_tag);
      formData.append('verification_source', 'gallery');
      formData.append('file', uploadData.file);

      await axios.post(`${API}/portfolio/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Fotoğraf başarıyla yüklendi!');
      setUploadOpen(false);
      setUploadData({ description: '', material_tag: '', technique_tag: '', file: null });
      fetchPortfolio();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fotoğraf yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <Button
              data-testid="back-btn"
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri Dön
            </Button>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {worker ? `${worker.first_name} ${worker.last_name}` : 'Portfolyo'}
            </h1>
            <p className="text-gray-600">Görsel portfolyo ve iş örnekleri</p>
          </div>

          {isOwner && (
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button data-testid="upload-photo-btn" className="bg-orange-600 hover:bg-orange-700">
                  <Upload className="mr-2 h-4 w-4" />
                  Fotoğraf Yükle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Portfolyo Fotoğrafı Yükle</DialogTitle>
                  <DialogDescription>
                    İşinizin fotoğrafını ve detaylarını ekleyin
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="photo-file">Fotoğraf</Label>
                    <Input
                      id="photo-file"
                      data-testid="photo-file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                    />
                    <p className="text-xs text-gray-500">Maksimum dosya boyutu: 5MB</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Açıklama (En az 20 karakter)</Label>
                    <Textarea
                      id="description"
                      data-testid="description"
                      placeholder="İşinizin detaylarını anlatın..."
                      rows={4}
                      value={uploadData.description}
                      onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="material">Malzeme Etiketi</Label>
                      <Input
                        id="material"
                        data-testid="material"
                        placeholder="Örn: Paslanmaz Çelik"
                        value={uploadData.material_tag}
                        onChange={(e) => setUploadData({ ...uploadData, material_tag: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="technique">Teknik Etiket</Label>
                      <Input
                        id="technique"
                        data-testid="technique"
                        placeholder="Örn: TIG Kaynağı"
                        value={uploadData.technique_tag}
                        onChange={(e) => setUploadData({ ...uploadData, technique_tag: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUploadOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button
                      data-testid="submit-photo-btn"
                      type="submit"
                      className="bg-orange-600 hover:bg-orange-700"
                      disabled={uploading}
                    >
                      {uploading ? 'Yükleniyor...' : 'Yükle'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {portfolio.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map((item) => (
              <Card key={item.id} className="portfolio-item overflow-hidden">
                <div className="aspect-square relative bg-gray-200">
                  <img
                    src={`${BACKEND_URL}${item.photo_url}`}
                    alt={item.description}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/400x400?text=G%C3%B6rsel+Y%C3%BCklenemedi';
                    }}
                  />
                  {item.is_verified_shot && (
                    <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                      ✅ Onaylanmış
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-sm font-medium line-clamp-2">
                    {item.description}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                      {item.material_tag}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {item.technique_tag}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    {new Date(item.upload_date).toLocaleDateString('tr-TR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">Henüz portfolyo fotoğrafı yok</p>
              {isOwner && (
                <>
                  <p className="text-gray-500 text-sm mb-4">
                    İşlerinizin fotoğraflarını ekleyerek portföyünüzü güçlendirin
                  </p>
                  <Button
                    onClick={() => setUploadOpen(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    İlk Fotoğrafı Yükle
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;
