import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wrench, Building2, Shield, Users, Star, Clock } from 'lucide-react';

const HomePage = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      if (user.role === 'worker') {
        navigate('/worker');
      } else if (user.role === 'employer') {
        navigate('/employer');
      }
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Wrench className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">UstaBul</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">Hoş geldin, {user.username}</span>
                <Button
                  data-testid="dashboard-btn"
                  onClick={handleGetStarted}
                  variant="outline"
                >
                  Dashboard
                </Button>
                <Button
                  data-testid="logout-btn"
                  onClick={onLogout}
                  variant="ghost"
                >
                  Çıkış
                </Button>
              </>
            ) : (
              <Button
                data-testid="login-btn"
                onClick={() => navigate('/auth')}
              >
                Giriş Yap
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
              Nitelikli Ustaları
              <br />
              <span className="text-orange-600">Atölyelerle Buluşturan</span>
              <br />
              Platform
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Sanayi sektöründe doğru ustaları bulmak artık çok kolay. Görsel portfolyo tabanlı,
              güvenilir eşleştirme sistemiyle hemen başlayın.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
              <Button
                data-testid="get-started-btn"
                onClick={handleGetStarted}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg"
              >
                Hemen Başla
              </Button>
              <Button
                data-testid="jobs-btn"
                onClick={() => navigate('/jobs')}
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg"
              >
                İş İlanlarını Gör
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 text-gray-900">
            Neden UstaBul?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Wrench className="h-12 w-12 text-orange-600" />}
              title="Görsel Portfolyo"
              description="Ustaların gerçek işlerini görerek karar verin. Her işin detayını inceleyin."
            />
            <FeatureCard
              icon={<Shield className="h-12 w-12 text-blue-600" />}
              title="Güvenilir Sistem"
              description="Çift yönlü puanlama ve doğrulanmış sertifikalarla güvenli işe alım."
            />
            <FeatureCard
              icon={<Users className="h-12 w-12 text-green-600" />}
              title="Kolay Eşleşme"
              description="Yetenek bazlı algoritma ile doğru ustayı hızlıca bulun."
            />
            <FeatureCard
              icon={<Star className="h-12 w-12 text-yellow-600" />}
              title="Puanlama Sistemi"
              description="Usta ve işverenlerin güvenilirliğini şeffaf şekilde görün."
            />
            <FeatureCard
              icon={<Clock className="h-12 w-12 text-purple-600" />}
              title="48 Saat Garantisi"
              description="İş tamamlama sürecinde otomatik onay mekanizması."
            />
            <FeatureCard
              icon={<Building2 className="h-12 w-12 text-red-600" />}
              title="Sanayi Odaklı"
              description="Metal işleri, CNC, kaynak ve daha fazlası için özel kategoriler."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-orange-600 text-white">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            Hemen Katıl, İşe Başla
          </h2>
          <p className="text-lg sm:text-xl text-orange-100">
            Usta mısın? İşveren mi? UstaBul'da yeriniz hazır.
          </p>
          <Button
            data-testid="cta-get-started-btn"
            onClick={handleGetStarted}
            size="lg"
            className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-6 text-lg"
          >
            Ücretsiz Kayıt Ol
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Wrench className="h-6 w-6 text-orange-600" />
            <span className="text-xl font-bold text-white">UstaBul</span>
          </div>
          <p className="text-sm">
            © 2024 UstaBul. Tüm hakları saklıdır.
          </p>
          <p className="text-xs mt-2">
            Sanayi sektörü için güvenilir usta-atölye eşleştirme platformu
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-orange-300 transition-all">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default HomePage;
