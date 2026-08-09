import React, { useState, useEffect } from 'react';
import { User, Phone, Lock, CheckCircle, AlertCircle, Loader2, Camera, MapPin, ShieldCheck } from 'lucide-react';

interface UserProfile {
  id?: string | number;
  userId?: string | number;
  fullName?: string;
  name?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  role?: string;
  avatarUrl?: string;
  hasPassword?: boolean;
  authProvider?: string;
}

interface FeedbackMessage {
  type: 'success' | 'error';
  text: string;
}

const API_BASE_URL = 'http://localhost:5000';

export default function AccountSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Profile details state
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Status states
  const [loading, setLoading] = useState<boolean>(true);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [savingPassword, setSavingPassword] = useState<boolean>(false);
  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const populateUserData = (data: UserProfile) => {
    setProfile(data);
    setFullName(data.fullName || data.name || '');
    // Ensure phone string is set cleanly even if backend returns null
    setPhone(data.phone ?? '');
    setAddress(data.address || '');
    setCity(data.city || '');
    setCountry(data.country || '');
    setAvatarPreview(data.avatarUrl || null);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: UserProfile = await response.json();
        populateUserData(data);

        // Update local cache so phone number persists on refresh
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          localStorage.setItem('user', JSON.stringify({ ...parsed, phone: data.phone }));
        }
        return;
      }

      // LocalStorage fallback
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        populateUserData(JSON.parse(storedUser));
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (err) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        populateUserData(JSON.parse(storedUser));
      } else {
        setMessage({ type: 'error', text: 'Could not load account details.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setMessage(null);
      const token = localStorage.getItem('token');

      const payload = {
        fullName,
        phone,
        address,
        city,
        country,
        avatarUrl: avatarPreview,
      };

      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const responseData = await response.json();
      const updatedUser: UserProfile = responseData.user || responseData;
      setProfile((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));

      // Sync local storage cache
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const updatedCache = { ...parsed, ...payload };
        localStorage.setItem('user', JSON.stringify(updatedCache));
      }

      setMessage({ type: 'success', text: 'Profile details updated successfully!' });
    } catch (err) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const updatedCache = { ...parsed, fullName, phone, address, city, country, avatarUrl: avatarPreview };
        localStorage.setItem('user', JSON.stringify(updatedCache));
        setProfile(updatedCache);
        setMessage({ type: 'success', text: 'Profile details updated successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile details.' });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const userHasPassword = Boolean(
    profile?.hasPassword || (profile as any)?.password_hash || (profile as any)?.passwordHash
  );

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userHasPassword && !currentPassword) {
      setMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    try {
      setSavingPassword(true);
      setMessage(null);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/users/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(userHasPassword && { currentPassword }),
          newPassword,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update password');
      }

      setProfile((prev) => (prev ? { ...prev, hasPassword: true } : prev));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({
        type: 'success',
        text: userHasPassword ? 'Password updated successfully!' : 'Password set successfully!',
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password. Please try again.' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Loading user account...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-poppins">Account Settings</h2>
        <p className="text-xs text-slate-500 mt-1">Manage your profile information, location details, and security.</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Profile & Personal Details */}
      <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" /> Personal Details
          </h3>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            {profile?.role?.toUpperCase() || 'USER ACCOUNT'}
          </span>
        </div>

        {/* Profile Avatar Upload */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden text-slate-400 font-bold text-xl">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (fullName || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition-all shadow-sm">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Profile Picture</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, or GIF up to 2MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Read-only)</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="+1 234 567 890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="pt-2 border-t border-slate-100 space-y-4">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" /> Location Details (Optional)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
              <input
                type="text"
                placeholder="123 Main St, Suite 100"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Country / Region</label>
              <input
                type="text"
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Save Profile Changes
        </button>
      </form>

      {/* Password & Security Credentials */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" /> Security Credentials
          </h3>
          {!userHasPassword && (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              Signed in with Google
            </span>
          )}
        </div>

        <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
          {userHasPassword && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {userHasPassword ? 'New Password' : 'Create Account Password'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {savingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {userHasPassword ? 'Update Password' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
}