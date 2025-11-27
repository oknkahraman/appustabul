import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import axios from 'axios';
import { Calendar, DollarSign, ArrowLeft, Briefcase, User, Star } from 'lucide-react';
import Navbar from '../components/Navbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const JobDetailPage = ({ user, onLogout }) => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch job
      const jobRes = await axios.get(`${API}/jobs/${jobId}`, { headers });
      setJob(jobRes.data);

      // Fetch employer details
      const employerRes = await axios.get(`${API}/employers/${jobRes.data.employer_id}`, { headers });
      setEmployer(employerRes.data);

      // If user is employer, fetch applications
      if (user && user.role === 'employer' && user.id === jobRes.data.employer_id) {
        const appsRes = await axios.get(`${API}/jobs/${jobId}/applications`, { headers });
        setApplications(appsRes.data);

        // Fetch applicant details
        const applicantPromises = appsRes.data.map(app =>
          axios.get(`${API}/workers/${app.worker_id}`, { headers })
        );
        const applicantResults = await Promise.all(applicantPromises);
        setApplicants(applicantResults.map(res => res.data));
      }

      // Check if user has applied
      if (user && user.role === 'worker') {
        const appsRes = await axios.get(`${API}/jobs/${jobId}/applications`, { headers });
        const userApp = appsRes.data.find(app => app.worker_id === user.id);
        setHasApplied(!!userApp);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('İş detayları yüklenemedi');
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      toast.error('Başvurmak için giriş yapmalısınız');
      navigate('/auth');
      return;
    }

    if (user.role !== 'worker') {
      toast.error('Sadece ustalar iş başvurusu yapabilir');
      return;
    }

    setApplying(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/jobs/apply?worker_id=${user.id}`,
        { job_id: jobId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Başvurunuz başarıyla gönderildi!');
      setHasApplied(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Başvuru gönderilemedi');
    } finally {
      setApplying(false);
    }
  };

  const handleAcceptApplication = async (applicationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/applications/${applicationId}/accept?employer_id=${user.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Başvuru kabul edildi!');
      fetchJobDetails();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Başvuru kabul edilemedi');
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

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">İş ilanı bulunamadı</p>
          <Button onClick={() => navigate('/jobs')}>Tüm İlanlara Dön</Button>
        </div>
      </div>
    );
  }

  const isOwner = user && user.role === 'employer' && user.id === job.employer_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          data-testid="back-btn"
          variant="ghost"
          onClick={() => navigate('/jobs')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tüm İlanlara Dön
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                <CardDescription className="text-base">
                  {employer?.company_name}
                </CardDescription>
              </div>
              <Badge
                variant={job.job_status === 'open' ? 'default' : 'secondary'}
                className="text-base px-4 py-2"
              >
                {job.job_status === 'open' && 'Açık'}
                {job.job_status === 'matched' && 'Eşleşti'}
                {job.job_status === 'in_progress' && 'Devam Ediyor'}
                {job.job_status === 'completed' && 'Tamamlandı'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">İş Açıklaması</h3>
              <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Başlangıç Tarihi</p>
                  <p className="font-semibold">
                    {new Date(job.start_date).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Bitiş Tarihi</p>
                  <p className="font-semibold">
                    {new Date(job.end_date).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {job.budget_info && (
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Üret Bilgisi</p>
                    <p className="font-semibold">{job.budget_info}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Briefcase className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Görüntüleme</p>
                  <p className="font-semibold">{job.view_count} kez</p>
                </div>
              </div>
            </div>

            {!isOwner && user && user.role === 'worker' && (
              <>
                <Separator />
                <div className="flex justify-center">
                  <Button
                    data-testid="apply-job-btn"
                    onClick={handleApply}
                    disabled={applying || hasApplied || job.job_status !== 'open'}
                    className="bg-orange-600 hover:bg-orange-700 px-8 py-6 text-lg"
                  >
                    {hasApplied ? 'Başvuruldu ✓' : applying ? 'Başvuruluyor...' : 'Başvur'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Employer Section */}
        {employer && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>İşveren Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Şirket Adı</p>
                  <p className="font-semibold text-lg">{employer.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sektör</p>
                  <p className="font-semibold">{employer.sector}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Konum</p>
                  <p className="font-semibold">{employer.district}, {employer.city}</p>
                </div>
                <div className="flex items-center space-x-6 pt-3">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                    <span className="font-semibold">{employer.average_rating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Ödeme Güvenilirliği: </span>
                    <span className="font-semibold text-green-600">
                      {employer.payment_reliability_score?.toFixed(1)}/5.0
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications (Only for employer) */}
        {isOwner && applications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Başvurular ({applications.length})</CardTitle>
              <CardDescription>İlana yapılan başvurular</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.map((app, index) => {
                  const applicant = applicants[index];
                  return (
                    <div
                      key={app.id}
                      className="p-4 border rounded-lg hover:border-orange-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          {applicant ? (
                            <>
                              <h3 className="font-semibold text-lg">
                                {applicant.first_name} {applicant.last_name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {applicant.city}, {applicant.district}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-sm">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                                  <span>{applicant.average_rating?.toFixed(1) || '0.0'}</span>
                                </div>
                                <span className="text-gray-500">
                                  {applicant.total_jobs_completed} iş tamamladı
                                </span>
                              </div>
                            </>
                          ) : (
                            <p>Yükleniyor...</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={app.status === 'applied' ? 'default' : 'secondary'}
                          >
                            {app.status === 'applied' && 'Bekliyor'}
                            {app.status === 'accepted' && 'Kabul Edildi'}
                            {app.status === 'rejected' && 'Reddedildi'}
                          </Badge>
                          {app.status === 'applied' && (
                            <Button
                              data-testid={`accept-app-${app.id}`}
                              onClick={() => handleAcceptApplication(app.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Kabul Et
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default JobDetailPage;
