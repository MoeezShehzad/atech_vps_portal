import React, { useState, useEffect } from 'react';
import { User, Phone, Lock, CheckCircle, AlertCircle, Loader2, Camera, MapPin, ShieldCheck, Key, Plus, Trash2, Copy, Check, Download, Terminal } from 'lucide-react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface SSHKeyItem {
  keyId: number;
  name: string;
  fingerprint: string;
  keyType: string;
  publicKey: string;
  createdAt: string;
}

interface UserProfile {
  id?: string | number;
  userId?: string | number;
  fullName?: string;
  name?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  postal_code?: string;
  zip?: string;
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

export default function AccountSettings() {
  const { isAuthenticated, user: authUser, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Profile details state
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // SSH Key management state
  const [sshKeys, setSshKeys] = useState<SSHKeyItem[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [showGenKeyModal, setShowGenKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newPublicKey, setNewPublicKey] = useState('');
  const [genKeyName, setGenKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<{ name: string; publicKey: string; privateKey: string; fingerprint: string } | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);
  const [copiedGenPriv, setCopiedGenPriv] = useState(false);
  const [sshActionLoading, setSshActionLoading] = useState(false);

  // Status states
  const [loading, setLoading] = useState<boolean>(true);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [savingPassword, setSavingPassword] = useState<boolean>(false);
  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  const populateUserData = (data: UserProfile) => {
    setProfile(data);
    setFullName(data.fullName || data.name || '');
    setPhone(data.phone ?? '');
    setAddress(data.address || '');
    setCity(data.city || '');
    setPostalCode(data.postalCode || (data as any).postal_code || (data as any).zip || '');
    setCountry(data.country || '');
    setAvatarPreview(data.avatarUrl || null);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Check endpoints in order of standard NestJS/Express route structure
      let data: UserProfile;
      try {
        data = await apiCall('/users/me');
      } catch {
        // Fallback endpoint check if apiCall doesn't strip global prefix
        data = await apiCall('/auth/me');
      }

      populateUserData(data);

      // Keep cache synced
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        localStorage.setItem('user', JSON.stringify({ ...parsed, ...data }));
      }
    } catch (err: any) {
      console.error("Profile fetch error:", err);
      // Fallback to AuthContext or localStorage if API endpoint fails
      if (authUser) {
        populateUserData(authUser as UserProfile);
      } else {
        const storedUser = localStorage.getItem('user');
        if (storedUser) populateUserData(JSON.parse(storedUser));
        else setMessage({ type: 'error', text: 'Could not load account details from backend.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSSHKeys = async () => {
    try {
      setLoadingKeys(true);
      const data = await apiCall('/ssh-keys');
      if (data && data.keys) {
        setSshKeys(data.keys);
      }
    } catch (err: any) {
      console.warn('Failed to load SSH keys:', err);
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSSHKeys();
  }, [isAuthenticated]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024) {
        setMessage({ type: 'error', text: 'Avatar image is too large. Please select an image under 50 KB.' });
        return;
      }
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

      // Send both postalCode and postal_code to ensure full compatibility with Express/Prisma
      const payload = {
        fullName,
        phone,
        address,
        city,
        postalCode,
        postal_code: postalCode,
        country,
        avatarUrl: avatarPreview,
      };

      // Try PATCH first, fallback to PUT if route demands full replacement
      let responseData;
      try {
        responseData = await apiCall('/users/me', {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } catch {
        responseData = await apiCall('/users/me', {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }

      const updatedUser: UserProfile = responseData.user || responseData;
      
      // Update local component state
      setProfile((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));

      // Update global AuthContext state so memory context stays synced
      if (updateUser) {
        updateUser(updatedUser as any);
      }

      // Update localStorage cache
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        localStorage.setItem('user', JSON.stringify({ ...parsed, ...payload }));
      }

      setMessage({ type: 'success', text: 'Profile details updated successfully!' });
    } catch (err: any) {
      console.error("Profile update error:", err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile details in database.' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Password detector: Check explicit flag or fallback to authProvider
  const userHasPassword = profile?.hasPassword !== undefined 
    ? profile.hasPassword 
    : profile?.authProvider !== 'google';

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

      await apiCall('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({
          ...(userHasPassword && { currentPassword }),
          newPassword,
        }),
      });

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

  const handleAddSSHKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !newPublicKey.trim()) return;
    try {
      setSshActionLoading(true);
      await apiCall('/ssh-keys', {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName.trim(), publicKey: newPublicKey.trim() }),
      });
      setNewKeyName('');
      setNewPublicKey('');
      setShowAddKeyModal(false);
      setMessage({ type: 'success', text: 'SSH public key registered successfully!' });
      await fetchSSHKeys();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to add SSH key.' });
    } finally {
      setSshActionLoading(false);
    }
  };

  const handleGenerateSSHKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genKeyName.trim()) return;
    try {
      setSshActionLoading(true);
      const data = await apiCall('/ssh-keys/generate', {
        method: 'POST',
        body: JSON.stringify({ name: genKeyName.trim() }),
      });
      setGeneratedKey({
        name: genKeyName.trim(),
        publicKey: data.key.publicKey,
        privateKey: data.privateKey,
        fingerprint: data.key.fingerprint,
      });
      setMessage({ type: 'success', text: 'Ed25519 SSH key pair generated! Download the private key now.' });
      await fetchSSHKeys();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to generate SSH key pair.' });
    } finally {
      setSshActionLoading(false);
    }
  };

  const handleDeleteSSHKey = async (keyId: number) => {
    if (!confirm('Are you sure you want to delete this SSH key? Virtual machines configured with it will not be affected.')) return;
    try {
      await apiCall(`/ssh-keys/${keyId}`, { method: 'DELETE' });
      setSshKeys((prev) => prev.filter((k) => k.keyId !== keyId));
      setMessage({ type: 'success', text: 'SSH key deleted successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete SSH key.' });
    }
  };

  const handleDownloadPrivateKey = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'application/x-pem-file' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/\s+/g, '_').toLowerCase()}.pem`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyText = (text: string, id?: number) => {
    navigator.clipboard.writeText(text);
    if (id !== undefined) {
      setCopiedKeyId(id);
      setTimeout(() => setCopiedKeyId(null), 2000);
    } else {
      setCopiedGenPriv(true);
      setTimeout(() => setCopiedGenPriv(false), 2000);
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
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-poppins">Account Settings</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your profile information, location details, and security.</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
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
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Personal Details
          </h3>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            {profile?.role?.toUpperCase() || 'USER ACCOUNT'}
          </span>
        </div>

        {/* Profile Avatar Upload */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden text-slate-400 dark:text-slate-500 font-bold text-xl">
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
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Profile Picture</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">PNG, JPG, or GIF up to 2MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address (Read-only)</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number (Optional)</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="+1 234 567 890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Location Details (Optional)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
              <input
                type="text"
                placeholder="123 Main St, Suite 100"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Postal / ZIP Code</label>
              <input
                type="text"
                placeholder="60000"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Country / Region</label>
              <input
                type="text"
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Save Profile Changes
        </button>
      </form>

      {/* Password & Security Credentials */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Security Credentials
          </h3>
          {!userHasPassword && (
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60">
              Signed in with Google
            </span>
          )}
        </div>

        <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
          {userHasPassword && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {userHasPassword ? 'New Password' : 'Create Account Password'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {savingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {userHasPassword ? 'Update Password' : 'Set Password'}
          </button>
        </form>
      </div>

      {/* SSH Public Keys Management Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" /> SSH Public Keys
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Manage public SSH keys for secure, password-less terminal authentication to your virtual machines.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setGenKeyName(`key-${new Date().toISOString().slice(0, 10)}`);
                setGeneratedKey(null);
                setShowGenKeyModal(true);
              }}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Generate Key Pair</span>
            </button>
            <button
              onClick={() => setShowAddKeyModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add SSH Key</span>
            </button>
          </div>
        </div>

        {/* SSH Keys List */}
        {loadingKeys ? (
          <div className="py-8 flex items-center justify-center text-slate-400 dark:text-slate-500 gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading SSH keys...</span>
          </div>
        ) : sshKeys.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <Key className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">No SSH Keys Registered</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Add your existing public SSH key or generate a high-security key pair to deploy VPS instances with passwordless authentication.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sshKeys.map((k) => (
              <div key={k.keyId} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{k.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700">
                      {k.keyType}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      Added {new Date(k.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 select-all">
                      {k.fingerprint}
                    </code>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleCopyText(k.publicKey, k.keyId)}
                    title="Copy Public Key"
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all flex items-center gap-1 text-xs cursor-pointer"
                  >
                    {copiedKeyId === k.keyId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold text-[11px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteSSHKey(k.keyId)}
                    title="Delete SSH Key"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add SSH Key Modal */}
      {showAddKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Add Public SSH Key</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Paste your OpenSSH public key (typically found in <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">~/.ssh/id_rsa.pub</code> or <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">~/.ssh/id_ed25519.pub</code>).
            </p>

            <form onSubmit={handleAddSSHKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Key Name / Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Work MacBook Pro, Office Desktop"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Public Key Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... user@example.com"
                  value={newPublicKey}
                  onChange={(e) => setNewPublicKey(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddKeyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sshActionLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {sshActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Public Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate SSH Key Pair Modal */}
      {showGenKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Generate Ed25519 SSH Key Pair</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Create an elliptic-curve SSH key pair. The public key is saved to your account, and you receive the private key.
            </p>

            {!generatedKey ? (
              <form onSubmit={handleGenerateSSHKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Key Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My Laptop Key Pair"
                    value={genKeyName}
                    onChange={(e) => setGenKeyName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                  />
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" /> High Security Ed25519
                  </span>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400">
                    Modern Ed25519 keys provide the strongest security and fastest authentication speed available in OpenSSH.
                  </p>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowGenKeyModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sshActionLoading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {sshActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Generate Key Pair
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" /> Download Private Key Immediately
                  </span>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                    This private key will <strong>never be shown again</strong>. For strict security, private keys are never stored on our servers. Download it now to retain access.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Key Fingerprint</label>
                  <code className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    {generatedKey.fingerprint}
                  </code>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleDownloadPrivateKey(generatedKey.name, generatedKey.privateKey)}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download Private Key (.pem)
                  </button>
                  <button
                    onClick={() => handleCopyText(generatedKey.privateKey)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedGenPriv ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedGenPriv ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setShowGenKeyModal(false);
                      setGeneratedKey(null);
                    }}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
