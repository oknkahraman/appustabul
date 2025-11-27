import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import axios from 'axios';
import { Wrench, BriefcaseIcon, Star, Bell, ArrowLeft, Upload } from 'lucide-react';
import Navbar from '../components/Navbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WorkerDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [workerDetails, setWorkerDetails] = useState(null);
  const [skills, setSkills] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'worker') {
      navigate('/auth');
      return;
    }
    fetchWorkerData();
  }, [user, navigate]);

  const fetchWorkerData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch worker details
      try {
        const detailsRes = await axios.get(`${API}/workers/${user.id}`, { headers });
        setWorkerDetails(detailsRes.data);
      } catch (error) {
        if (error.response?.status === 404) {
          // Worker details not created yet
          setWorkerDetails(null);
        }
      }

      // Fetch skills
      const skillsRes = await axios.get(`${API}/workers/${user.id}/skills`, { headers });
      setSkills(skillsRes.data);

      // Fetch portfolio
      const portfolioRes = await axios.get(`${API}/portfolio/${user.id}`, { headers });
      setPortfolio(portfolioRes.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching worker data:', error);
      setLoading(false);
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Hoş geldin, {workerDetails?.first_name || user.username}!
          </h1>
          <p className="text-gray-600">Usta kontrol panelinize hoş geldiniz</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Tamamlanan İşler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {workerDetails?.total_jobs_completed || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Ortalama Puan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-3xl font-bold text-yellow-600">
                  {workerDetails?.average_rating?.toFixed(1) || '0.0'}
                </div>
                <Star className="h-6 w-6 text-yellow-600 fill-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Portfolyo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {portfolio.length}
              </div>
              <p className="text-sm text-gray-500 mt-1">fotoğraf</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
              <CardDescription>Kişisel bilgileriniz ve sertifika durumu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workerDetails ? (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Ad Soyad</p>
                    <p className="font-semibold text-gray-900">
                      {workerDetails.first_name} {workerDetails.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Konum</p>
                    <p className="font-semibold text-gray-900">
                      {workerDetails.district}, {workerDetails.city}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Doğum Yılı</p>
                    <p className="font-semibold text-gray-900">{workerDetails.birth_year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sertifika Durumu</p>
                    <Badge
                      variant={workerDetails.certificate_status === 'verified' ? 'default' : 'secondary'}
                    >
                      {workerDetails.certificate_status === 'verified' && '✅ Doğrulanmış'}
                      {workerDetails.certificate_status === 'pending' && '⏳ Beklemede'}
                      {workerDetails.certificate_status === 'none' && 'Sertifika Yok'}
                      {workerDetails.certificate_status === 'rejected' && '❌ Reddedildi'}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Profil bilgilerinizi henüz tamamlamadınız</p>
                  <Button
                    data-testid="complete-profile-btn"
                    onClick={() => toast.info('Profil tamamlama özelliği yakında eklenecek')}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Profili Tamamla
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills Section */}
          <Card>
            <CardHeader>
              <CardTitle>Yeteneklerim</CardTitle>
              <CardDescription>Uzmanlık alanlarınız</CardDescription>
            </CardHeader>
            <CardContent>
              {skills.length > 0 ? (
                <div className="space-y-3">
                  {skills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">Yetenek #{index + 1}</p>
                        <p className="text-sm text-gray-600">{skill.years_of_experience} yıl deneyim</p>
                      </div>
                      {skill.is_primary && (
                        <Badge className="bg-orange-600">Ana Uzmanlık</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Henüz yetenek eklemediniz</p>
                  <Button
                    data-testid="add-skills-btn"
                    onClick={() => toast.info('Yetenek ekleme özelliği yakında eklenecek')}
                    variant="outline"
                  >
                    Yetenek Ekle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                data-testid="browse-jobs-btn"
                onClick={() => navigate('/jobs')}
                className="bg-orange-600 hover:bg-orange-700 h-20"
              >
                <BriefcaseIcon className="mr-2 h-5 w-5" />
                İş İlanlarına Göz At
              </Button>
              <Button
                data-testid="view-portfolio-btn"
                onClick={() => navigate(`/portfolio/${user.id}`)}
                variant="outline"
                className="h-20"
              >
                <Upload className="mr-2 h-5 w-5" />
                Portfolyo Yönet
              </Button>
              <Button
                data-testid="view-notifications-btn"
                onClick={() => navigate('/notifications')}
                variant="outline"
                className="h-20"
              >
                <Bell className="mr-2 h-5 w-5" />
                Bildirimler
              </Button>
              <Button
                data-testid="view-ratings-btn"
                onClick={() => toast.info('Değerlendirme geçmişi yakında eklenecek')}
                variant="outline"
                className="h-20"
              >
                <Star className="mr-2 h-5 w-5" />
                Değerlendirmelerim
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkerDashboard;
