import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import { Building2, BriefcaseIcon, Star, Plus, Users } from 'lucide-react';
import Navbar from '../components/Navbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployerDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [employerDetails, setEmployerDetails] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createJobOpen, setCreateJobOpen] = useState(false);

  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    budget_info: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'employer') {
      navigate('/auth');
      return;
    }
    fetchEmployerData();
  }, [user, navigate]);

  const fetchEmployerData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch employer details
      try {
        const detailsRes = await axios.get(`${API}/employers/${user.id}`, { headers });
        setEmployerDetails(detailsRes.data);
      } catch (error) {
        if (error.response?.status === 404) {
          setEmployerDetails(null);
        }
      }

      // Fetch employer's jobs
      const jobsRes = await axios.get(`${API}/jobs`, { headers });
      const myJobs = jobsRes.data.filter(job => job.employer_id === user.id);
      setJobs(myJobs);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching employer data:', error);
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/jobs?employer_id=${user.id}`,
        {
          ...newJob,
          start_date: new Date(newJob.start_date).toISOString(),
          end_date: new Date(newJob.end_date).toISOString(),
          required_skills: []
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('İş ilanı başarıyla oluşturuldu!');
      setCreateJobOpen(false);
      setNewJob({ title: '', description: '', start_date: '', end_date: '', budget_info: '' });
      fetchEmployerData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İş ilanı oluşturulamadı');
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
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {employerDetails?.company_name || user.username}
            </h1>
            <p className="text-gray-600">İşveren kontrol paneli</p>
          </div>
          <Dialog open={createJobOpen} onOpenChange={setCreateJobOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-job-btn" className="bg-orange-600 hover:bg-orange-700">
                <Plus className="mr-2 h-4 w-4" />
                Yeni İlan Oluştur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni İş İlanı Oluştur</DialogTitle>
                <DialogDescription>
                  İş ilanınızın detaylarını girin
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateJob} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="job-title">İlan Başlığı</Label>
                  <Input
                    id="job-title"
                    data-testid="job-title"
                    placeholder="Örn: CNC Torna Ustası Aranıyor"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-description">İş Açıklaması</Label>
                  <Textarea
                    id="job-description"
                    data-testid="job-description"
                    placeholder="İşin detaylarını açıklayın..."
                    rows={4}
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Başlangıç Tarihi</Label>
                    <Input
                      id="start-date"
                      data-testid="start-date"
                      type="datetime-local"
                      value={newJob.start_date}
                      onChange={(e) => setNewJob({ ...newJob, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Bitiş Tarihi</Label>
                    <Input
                      id="end-date"
                      data-testid="end-date"
                      type="datetime-local"
                      value={newJob.end_date}
                      onChange={(e) => setNewJob({ ...newJob, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-info">Ü(ret Bilgisi (Opsiyonel)</Label>
                  <Input
                    id="budget-info"
                    data-testid="budget-info"
                    placeholder="Örn: 2.800 TL/gün"
                    value={newJob.budget_info}
                    onChange={(e) => setNewJob({ ...newJob, budget_info: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateJobOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    data-testid="submit-job-btn"
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    İlanı Yayınla
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam İlanlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {employerDetails?.total_jobs_posted || jobs.length}
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
                  {employerDetails?.average_rating?.toFixed(1) || '0.0'}
                </div>
                <Star className="h-6 w-6 text-yellow-600 fill-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Ödeme Güvenilirliği</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {employerDetails?.payment_reliability_score?.toFixed(1) || '5.0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle>İlanlarım</CardTitle>
            <CardDescription>Oluşturduğunuz iş ilanları</CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 border rounded-lg hover:border-orange-300 transition-colors cursor-pointer"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{job.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>📅 {new Date(job.start_date).toLocaleDateString('tr-TR')}</span>
                          {job.budget_info && <span>💵 {job.budget_info}</span>}
                          <span>👁 {job.view_count} görüntüleme</span>
                        </div>
                      </div>
                      <Badge
                        variant={job.job_status === 'open' ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {job.job_status === 'open' && 'Açık'}
                        {job.job_status === 'matched' && 'Eşleşti'}
                        {job.job_status === 'in_progress' && 'Devam Ediyor'}
                        {job.job_status === 'completed' && 'Tamamlandı'}
                        {job.job_status === 'cancelled' && 'İptal Edildi'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BriefcaseIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Henüz iş ilanı oluşturmadınız</p>
                <Button
                  onClick={() => setCreateJobOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  İlk İlanınızı Oluşturun
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployerDashboard;
