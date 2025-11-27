import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import axios from 'axios';
import { Wrench, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  // Register state
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'worker'
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        username: loginData.username,
        password: loginData.password
      });

      toast.success('Giriş başarılı!');
      onLogin(response.data.access_token, response.data.user);

      // Navigate based on role
      if (response.data.user.role === 'worker') {
        navigate('/worker');
      } else if (response.data.user.role === 'employer') {
        navigate('/employer');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    if (registerData.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, {
        username: registerData.username,
        password: registerData.password,
        role: registerData.role
      });

      toast.success('Kayıt başarılı! Yönlendiriliyorsunuz...');
      onLogin(response.data.access_token, response.data.user);

      // Navigate to profile setup
      if (response.data.user.role === 'worker') {
        navigate('/worker');
      } else if (response.data.user.role === 'employer') {
        navigate('/employer');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 py-12 px-4">
      <div className="container mx-auto max-w-lg">
        <div className="mb-8">
          <Button
            data-testid="back-home-btn"
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ana Sayfa
          </Button>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Wrench className="h-10 w-10 text-orange-600" />
            <span className="text-3xl font-bold text-gray-900">UstaBul</span>
          </div>
          <p className="text-center text-gray-600">Hesabınıza giriş yapın veya yeni hesap oluşturun</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger data-testid="login-tab" value="login">Giriş Yap</TabsTrigger>
            <TabsTrigger data-testid="register-tab" value="register">Kayıt Ol</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Giriş Yap</CardTitle>
                <CardDescription>Hesabınıza giriş yapmak için bilgilerinizi girin</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Kullanıcı Adı</Label>
                    <Input
                      id="login-username"
                      data-testid="login-username"
                      type="text"
                      placeholder="kullanici_adi"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Şifre</Label>
                    <Input
                      id="login-password"
                      data-testid="login-password"
                      type="password"
                      placeholder="******"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button
                    data-testid="login-submit-btn"
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={loading}
                  >
                    {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Kayıt Ol</CardTitle>
                <CardDescription>Yeni hesap oluşturmak için bilgilerinizi girin</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Kullanıcı Adı</Label>
                    <Input
                      id="register-username"
                      data-testid="register-username"
                      type="text"
                      placeholder="kullanici_adi"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Şifre</Label>
                    <Input
                      id="register-password"
                      data-testid="register-password"
                      type="password"
                      placeholder="En az 6 karakter"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Şifre Tekrar</Label>
                    <Input
                      id="register-confirm-password"
                      data-testid="register-confirm-password"
                      type="password"
                      placeholder="Şifrenizi tekrar girin"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hesap Türü</Label>
                    <RadioGroup
                      value={registerData.role}
                      onValueChange={(value) => setRegisterData({ ...registerData, role: value })}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-orange-50">
                        <RadioGroupItem value="worker" id="worker" data-testid="role-worker" />
                        <Label htmlFor="worker" className="cursor-pointer flex-1">
                          <div className="font-semibold">Usta (Zanaatçı)</div>
                          <div className="text-sm text-gray-500">İş arayan nitelikli ustalar için</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-blue-50">
                        <RadioGroupItem value="employer" id="employer" data-testid="role-employer" />
                        <Label htmlFor="employer" className="cursor-pointer flex-1">
                          <div className="font-semibold">İşveren (Atölye)</div>
                          <div className="text-sm text-gray-500">Usta arayan işverenler için</div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button
                    data-testid="register-submit-btn"
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={loading}
                  >
                    {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Test kullanıcıları:</p>
          <p className="mt-2">Usta: mehmet_kaynakci / 123456</p>
          <p>İşveren: abc_makina / 123456</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
