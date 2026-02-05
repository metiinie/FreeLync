import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Eye,
  Edit,
  Camera,
  CheckCircle,
  XCircle,
  TrendingUp,
  Award,
  MessageCircle,
  Share2,
  Upload,
  X,
  Trash2,
  MoreVertical,
  Settings,
  Bell,
  Lock,
  Shield,
  CreditCard,
  LogOut,
  ChevronRight,
  Globe,
  BellRing,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { ListingsService } from '../services/listings';
import { UploadService } from '../services/upload';
import { UsersService } from '../services/users';
import { Listing } from '../types';

interface UserProfileProps {
  userId?: string;
  isOwnProfile?: boolean;
  showEditButton?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  isOwnProfile = false,
  showEditButton = true
}) => {
  const { user, isAuthenticated, refreshUser, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'overview';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [profileUser, setProfileUser] = useState(user);
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    averageRating: 0,
    totalSales: 0
  });
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState({
    full_name: '',
    phone: '',
    address: ''
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab') || 'overview';
    setActiveTab(tab);
  }, [location.search]);

  useEffect(() => {
    if (userId && userId !== user?.id) {
      loadUserProfile(userId);
    } else {
      if (user) {
        setProfileUser(user);
        setEditData({
          full_name: user.full_name || '',
          phone: user.phone || '',
          address: typeof user.address === 'string' ? user.address : ''
        });
      }
      loadUserStats();
    }
  }, [userId, user]);

  const loadUserProfile = async (targetUserId: string) => {
    try {
      setLoading(true);
      // Implementation for other users profile loading
    } catch (error) {
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      if (!user?.id) return;
      const response = await ListingsService.getUserListings(user.id);
      if (response.success) {
        const userListings = response.data;
        setListings(userListings);
        setStats({
          totalListings: userListings.length,
          activeListings: userListings.filter(l => l.status === 'approved').length,
          totalViews: userListings.reduce((sum, l) => sum + (l.views || 0), 0),
          averageRating: 4.8,
          totalSales: userListings.filter(l => l.status === 'sold').length
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!user?.id) return;
      const result = await UsersService.updateUser(user.id, {
        full_name: editData.full_name,
        phone: editData.phone,
        address: editData.address
      });
      if (result.success) {
        toast.success('Settings updated successfully');
        if (refreshUser) await refreshUser();
      }
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handlePhotoClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    try {
      setUploadingPhoto(true);
      const compressedFile = await UploadService.compressImage(file, 800, 0.8);
      const { url } = await UploadService.uploadUserAvatar(compressedFile, user.id);
      const updateResult = await UsersService.updateUser(user.id, { avatar_url: url });
      if (updateResult.success) {
        setProfileUser(updateResult.data);
        if (refreshUser) await refreshUser();
        toast.success('Profile photo updated');
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploadingPhoto(false);
      setShowAvatarMenu(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.id) return;
    try {
      const updateResult = await UsersService.updateUser(user.id, { avatar_url: null });
      if (updateResult.success) {
        setProfileUser(updateResult.data);
        if (refreshUser) await refreshUser();
        toast.success('Photo removed');
      }
    } catch (error) {
      toast.error('Removal failed');
    } finally {
      setShowAvatarMenu(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`?tab=${tab}`);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
  if (!profileUser) return <div className="text-center py-20"><User className="w-16 h-16 mx-auto text-gray-200 mb-4" /><h3 className="text-xl font-bold">User Not Found</h3></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      {/* Premium Profile Header */}
      <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] shadow-soft dark:shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden text-gray-900 dark:text-white">
        <div className="h-48 bg-brand-gradient"></div>
        <div className="px-10 pb-10">
          <div className="flex flex-col md:flex-row md:items-end -mt-16 space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative group" ref={avatarMenuRef}>
              <div
                onClick={isOwnProfile ? () => setShowAvatarMenu(!showAvatarMenu) : undefined}
                className="w-40 h-40 rounded-[2.5rem] border-8 border-white dark:border-slate-900 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden cursor-pointer relative"
              >
                {profileUser.avatar_url && !avatarError ? (
                  <img src={profileUser.avatar_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" onError={() => setAvatarError(true)} />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-5xl font-black">
                    {profileUser.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Camera className="text-white w-10 h-10" />
                  </div>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {showAvatarMenu && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 mt-4 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-slate-700 z-50 py-3">
                    <button onClick={handlePhotoClick} className="w-full flex items-center px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm text-gray-700 dark:text-gray-300 transition-colors"><Camera className="w-4 h-4 mr-3 text-blue-500" /> Change Photo</button>
                    {profileUser.avatar_url && <button onClick={handleRemovePhoto} className="w-full flex items-center px-5 py-3 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm text-red-600 font-bold transition-colors"><Trash2 className="w-4 h-4 mr-3" /> Remove Photo</button>}
                  </motion.div>
                )}
              </AnimatePresence>
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center flex-wrap gap-3">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{profileUser.full_name}</h1>
                <div className="flex gap-2">
                  {profileUser.verified && <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 border-none px-3 py-1 rounded-full text-xs font-black shadow-sm"><ShieldCheck className="w-3 h-3 mr-1" /> VERIFIED</Badge>}
                  <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 border-none px-3 py-1 rounded-full text-xs font-black capitalize">{profileUser.role}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                <span className="flex items-center"><Mail className="w-4 h-4 mr-2 text-blue-400" /> {profileUser.email}</span>
                {profileUser.phone && <span className="flex items-center"><Phone className="w-4 h-4 mr-2 text-blue-400" /> {profileUser.phone}</span>}
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-blue-400" /> Joined {new Date(profileUser.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex md:self-center gap-3">
              {isOwnProfile ? (
                <Button onClick={() => handleTabChange('settings')} variant="outline" className="rounded-2xl h-14 px-8 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 font-bold shadow-sm">
                  <Settings className="w-5 h-5 mr-2 text-gray-400" /> Profile Settings
                </Button>
              ) : (
                <Button className="btn-gradient rounded-2xl h-14 px-10 font-black shadow-xl shadow-blue-200">
                  <MessageCircle className="w-5 h-5 mr-3" /> CHAT NOW
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Tabs */}
        <div className="flex gap-10 px-10 border-t border-gray-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'listings', label: 'My Listings', icon: Home },
            { id: 'settings', label: 'Settings', icon: Settings, hidden: !isOwnProfile }
          ].filter(t => !t.hidden).map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center whitespace-nowrap space-x-2 px-2 py-6 border-b-4 transition-all font-black text-sm uppercase tracking-widest ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-300 dark:text-gray-600'}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side: Stats & Details */}
              <div className="lg:col-span-1 space-y-8">
                <Card className="rounded-3xl shadow-soft border-none bg-blue-50/50">
                  <CardHeader><CardTitle className="text-xl font-black text-blue-900">Performance</CardTitle></CardHeader>
                  <CardContent className="space-y-8">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-blue-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Trust Score</p>
                        <p className="text-3xl font-black text-blue-600">9.8<span className="text-sm text-gray-400">/10</span></p>
                      </div>
                      <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                        <ShieldCheck className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 text-center shadow-sm">
                        <p className="text-2xl font-black text-gray-900">{stats.totalSales}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transactions</p>
                      </div>
                      <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 text-center shadow-sm">
                        <p className="text-2xl font-black text-gray-900">{stats.activeListings}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Ads</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-soft border-none bg-indigo-50/50">
                  <CardHeader><CardTitle className="text-xl font-black text-indigo-900">Verifications</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-indigo-100">
                      <div className="flex items-center"><Mail className="w-4 h-4 mr-3 text-indigo-500" /><span className="text-sm font-bold">Email Verified</span></div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-indigo-100">
                      <div className="flex items-center"><Smartphone className="w-4 h-4 mr-3 text-indigo-500" /><span className="text-sm font-bold">Phone Verified</span></div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side: Description & Recent */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="rounded-[2.5rem] shadow-soft border-gray-50 border p-2">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-2xl font-black text-gray-900">About {profileUser.full_name?.split(' ')[0]}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-6">
                    <p className="text-gray-600 text-lg leading-relaxed">
                      Professional {profileUser.role} on FreeLync. Committed to safe and transparent trading.
                      I specialize in verifying digital assets and ensuring smooth escrow transitions for both buyers and sellers.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Badge className="bg-gray-100 text-gray-600 border-none px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">REAL ESTATE</Badge>
                      <Badge className="bg-gray-100 text-gray-600 border-none px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">VEHICLES</Badge>
                      <Badge className="bg-gray-100 text-gray-600 border-none px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">ESCROW PRO</Badge>
                    </div>
                  </CardContent>
                </Card>

                {listings.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                      <h3 className="text-2xl font-black text-gray-900">Featured Listings</h3>
                      <button onClick={() => handleTabChange('listings')} className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">View All</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {listings.slice(0, 4).map(listing => (
                        <Card key={listing.id} className="overflow-hidden rounded-3xl border-gray-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer" onClick={() => navigate(`/listing/${listing.id}`)}>
                          <div className="relative h-48 overflow-hidden">
                            <img src={listing.images[0]?.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-blue-600 uppercase shadow-lg">NEW</div>
                          </div>
                          <div className="p-6">
                            <h4 className="font-black text-lg text-gray-900 truncate mb-1">{listing.title}</h4>
                            <div className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-widest mb-4"><MapPin className="w-3 h-3 mr-1 text-blue-500" /> {listing.location.city}</div>
                            <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                              <span className="text-xl font-black text-blue-600">{listing.currency} {listing.price?.toLocaleString()}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Active Listings <span className="text-blue-600">({listings.length})</span></h2>
                {isOwnProfile && <Button onClick={() => navigate('/sell')} className="btn-gradient rounded-2xl h-14 px-8 font-black shadow-xl shadow-blue-200"><Plus className="w-5 h-5 mr-2" /> CREATE NEW LISTING</Button>}
              </div>

              {listings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {listings.map(l => (
                    <Card key={l.id} className="rounded-[2.5rem] overflow-hidden shadow-soft border-gray-50 group hover:shadow-2xl transition-all duration-300">
                      <div className="relative h-56">
                        <img src={l.images[0]?.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                        <div className="absolute top-6 left-6 flex gap-2">
                          <Badge className={`${l.status === 'approved' ? 'bg-green-500' : 'bg-amber-500'} text-white border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg`}>{l.status}</Badge>
                        </div>
                        <div className="absolute bottom-6 right-6 p-3 bg-white/80 backdrop-blur rounded-full text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"><Edit className="w-5 h-5" /></div>
                      </div>
                      <CardContent className="p-8">
                        <h3 className="font-black text-xl text-gray-900 truncate tracking-tight">{l.title}</h3>
                        <div className="flex gap-4 mt-2 mb-6">
                          <span className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest"><MapPin className="w-3 h-3 mr-1.5 text-blue-500" /> {l.location.city}</span>
                          <span className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest"><Eye className="w-3 h-3 mr-1.5 text-blue-500" /> {l.views || 0}</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Asking Price</p>
                            <span className="text-2xl font-black text-blue-600">{l.currency} {l.price?.toLocaleString()}</span>
                          </div>
                          <Button variant="ghost" className="rounded-xl px-5 h-12 text-blue-600 font-black text-xs uppercase hover:bg-blue-50" onClick={() => navigate(`/listing/${l.id}`)}>VIEW DETAILS</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 bg-gray-50/50 rounded-[3rem] border-4 border-dashed border-gray-200">
                  <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl text-gray-300"><Home className="w-12 h-12" /></div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase">Empty Inventory</h3>
                  <p className="text-gray-500 mb-10 font-medium text-lg">You haven't posted any listings for sale or rent yet.</p>
                  <Button onClick={() => navigate('/sell')} className="btn-gradient rounded-2xl h-16 px-12 font-black shadow-2xl">START SELLING NOW</Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && isOwnProfile && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              {/* Modern Settings Nav */}
              <div className="lg:col-span-1 space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-4 mb-4">Account Config</p>
                {[
                  { id: 'profile', label: 'General info', icon: User, active: true },
                  { id: 'notifications', label: 'Push & Alerts', icon: BellRing },
                  { id: 'security', label: 'Safety & Auth', icon: Lock },
                  { id: 'payments', label: 'Payout Details', icon: CreditCard },
                  { id: 'help', label: 'Help & FAQs', icon: HelpCircle },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => item.id === 'help' ? navigate('/faq') : null}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all group ${item.active ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'hover:bg-gray-50 text-gray-500 hover:text-gray-900'}`}
                  >
                    <div className="flex items-center font-bold text-sm">
                      <item.icon className="w-5 h-5 mr-4" /> {item.label}
                    </div>
                    <ChevronRight className={`w-4 h-4 ${item.active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />
                  </button>
                ))}
                <div className="pt-6 border-t border-gray-100 mt-6">
                  <button onClick={() => signOut()} className="w-full flex items-center px-5 py-4 text-red-600 rounded-2xl hover:bg-red-50 transition-all font-black text-sm uppercase tracking-widest">
                    <LogOut className="w-5 h-5 mr-4" /> Terminate Session
                  </button>
                </div>
              </div>

              {/* Content Panels */}
              <div className="lg:col-span-3 space-y-10">
                <Card className="rounded-[2.5rem] border-gray-100 shadow-soft overflow-hidden">
                  <div className="p-10 space-y-10">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-gray-900">Personal Information</h3>
                      <p className="text-gray-500 font-medium">This information will be displayed on your public profile for buyers.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Legal Full Name</label>
                        <Input value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} placeholder="e.g. Kerim Mohammed" className="h-14 rounded-2xl bg-gray-50/50 border-gray-200 focus:bg-white transition-all font-bold px-5" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Public Phone (Contact)</label>
                        <Input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} placeholder="+251..." className="h-14 rounded-2xl bg-gray-50/50 border-gray-200 focus:bg-white transition-all font-bold px-5" />
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Current Base Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
                          <Input value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} placeholder="e.g. Addis Ababa, Bole" className="h-14 rounded-2xl bg-gray-50/50 border-gray-200 focus:bg-white transition-all font-bold pl-14 pr-5" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                      <Button onClick={handleSaveProfile} className="btn-gradient rounded-2xl h-16 px-12 font-black shadow-2xl">UPDATE PROFILE</Button>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-[2.5rem] border-gray-100 shadow-soft overflow-hidden">
                  <div className="p-10 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-gray-900">Communication</h3>
                        <p className="text-gray-500 font-medium">Manage how FreeLync contacts you.</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl text-blue-500"><BellRing className="w-8 h-8" /></div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                        <div>
                          <p className="font-black text-gray-900">Email Notifications</p>
                          <p className="text-sm text-gray-500 font-medium">Daily summary of listing activities and leads.</p>
                        </div>
                        <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
                      </div>
                      <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                        <div>
                          <p className="font-black text-gray-900">Push Notifications</p>
                          <p className="text-sm text-gray-500 font-medium">Instant alerts for new messages and escrow updates.</p>
                        </div>
                        <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-[2.5rem] border-red-50 bg-red-50/20 shadow-none overflow-hidden">
                  <div className="p-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="p-5 bg-red-100 rounded-3xl text-red-600"><AlertTriangle className="w-10 h-10" /></div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-black text-red-900">Danger Zone</h3>
                      <p className="text-red-700 font-medium">Deleting your account is permanent and cannot be undone. All listings and history will be cleared.</p>
                    </div>
                    <Button variant="outline" className="rounded-2xl border-red-200 text-red-600 font-black h-14 px-8 hover:bg-red-100/50 hover:border-red-300">DELETE ACCOUNT</Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default UserProfile;
