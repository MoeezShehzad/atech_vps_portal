import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { User, Phone, Lock, CheckCircle, AlertCircle, Loader2, Camera, MapPin, ShieldCheck, Key, Plus, Trash2, Copy, Check, Download, Terminal, Mail, Eye, EyeOff, CreditCard, Power, Clock, AlertTriangle, Zap, Shield } from 'lucide-react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/dateFormatter';
import {
  ModernFloatingInput,
  ModernFloatingTextarea,
  ModernCountrySelect,
  ModernStateSelect,
  ModernCitySelect,
  type CountryOption,
  type GeoItem,
} from './ModernFormControls';

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
  state?: string;
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
  const [stateName, setStateName] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Geo SQL Tables State
  const [countriesList, setCountriesList] = useState<CountryOption[]>([]);
  const [loadingCountries, setLoadingCountries] = useState<boolean>(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('PK');
  const [provincesList, setProvincesList] = useState<GeoItem[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState<boolean>(false);
  const [citiesList, setCitiesList] = useState<GeoItem[]>([]);
  const [loadingCities, setLoadingCities] = useState<boolean>(false);

  // Password state & visibility toggles
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

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

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true);
      const res = await apiCall('/geo/countries');
      if (res && res.countries) {
        setCountriesList(res.countries);
      }
    } catch (err) {
      console.warn('Failed to load countries:', err);
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchProvinces = async (codeOrId: string | number) => {
    try {
      setLoadingProvinces(true);
      const param = typeof codeOrId === 'number' ? `countryId=${codeOrId}` : `countryCode=${codeOrId}`;
      const res = await apiCall(`/geo/provinces?${param}`);
      if (res && res.provinces) {
        setProvincesList(res.provinces);
      } else {
        setProvincesList([]);
      }
    } catch (err) {
      console.warn('Failed to load provinces:', err);
      setProvincesList([]);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchCities = async (provinceId: number | string, countryCode?: string, stateCode?: string) => {
    try {
      setLoadingCities(true);
      let url = `/geo/cities?provinceId=${encodeURIComponent(String(provinceId))}`;
      if (countryCode) url += `&countryCode=${encodeURIComponent(countryCode)}`;
      if (stateCode) url += `&stateCode=${encodeURIComponent(stateCode)}`;
      const res = await apiCall(url);
      if (res && res.cities) {
        setCitiesList(res.cities);
      } else {
        setCitiesList([]);
      }
    } catch (err) {
      console.warn('Failed to load cities:', err);
      setCitiesList([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const populateUserData = (data: UserProfile) => {
    setProfile(data);
    setFullName(data.fullName || data.name || '');
    setPhone(data.phone ?? '');
    setAddress(data.address || '');
    setCity(data.city || '');
    const userState = (data as any).state || '';
    setStateName(userState);
    setPostalCode(data.postalCode || (data as any).postal_code || (data as any).zip || '');
    const userCountry = data.country || 'Pakistan';
    setCountry(userCountry);
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


  // Subscription & Deactivation State
  interface SubscriptionInfo {
    subscriptionId: number;
    planName: string;
    monthlyPrice: number;
    currency: string;
    status: string;
    isSuspended: boolean;
    retentionDaysRemaining?: number | null;
    retentionExpiresAt?: string | null;
    startDate?: string;
    nextBillingDate?: string;
  }
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [loadingSub, setLoadingSub] = useState(false);
  const [subActionLoading, setSubActionLoading] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const fetchSubscriptionInfo = async () => {
    try {
      setLoadingSub(true);
      const res = await apiCall('/billing/overview');
      if (res && res.subscriptions && res.subscriptions.length > 0) {
        const primary = res.subscriptions.find((s: any) => ['ACTIVE', 'TRIAL', 'SUSPENDED'].includes(s.status?.toUpperCase())) || res.subscriptions[0];
        setSubInfo(primary);
      } else {
        setSubInfo(null);
      }
    } catch (err) {
      console.warn('Failed to load subscription info:', err);
    } finally {
      setLoadingSub(false);
    }
  };

  const handleDeactivateSubscription = async () => {
    if (!subInfo) return;
    try {
      setSubActionLoading(true);
      const res = await apiCall('/billing/deactivate-subscription', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId: subInfo.subscriptionId }),
      });
      setMessage({
        type: 'success',
        text: res.message || 'Subscription successfully deactivated. Recurring billing has been stopped.',
      });
      setShowDeactivateModal(false);
      await fetchSubscriptionInfo();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to deactivate subscription.' });
    } finally {
      setSubActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subInfo) return;
    try {
      setSubActionLoading(true);
      const res = await apiCall('/billing/reactivate-subscription', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId: subInfo.subscriptionId }),
      });
      setMessage({
        type: 'success',
        text: res.message || 'Subscription successfully reactivated! Your servers are ready to power on.',
      });
      await fetchSubscriptionInfo();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to reactivate subscription.' });
    } finally {
      setSubActionLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSSHKeys();
    fetchCountries();
    fetchSubscriptionInfo();
  }, [isAuthenticated]);

  // When country or countries list updates, find matching country code and load provinces
  useEffect(() => {
    if (countriesList.length > 0 && country) {
      const match = countriesList.find(
        (c) => c.name.toLowerCase() === country.toLowerCase() || c.code.toLowerCase() === country.toLowerCase()
      );
      if (match) {
        setSelectedCountryCode(match.code);
        fetchProvinces(match.code);
      } else {
        fetchProvinces(selectedCountryCode);
      }
    }
  }, [country, countriesList.length]);

  // When province list is loaded, if stateName exists, fetch its cities
  useEffect(() => {
    if (provincesList.length > 0 && stateName) {
      const match = provincesList.find(
        (p) => p.name.toLowerCase() === stateName.toLowerCase() || (p.code && p.code.toLowerCase() === stateName.toLowerCase())
      );
      if (match && match.id) {
        fetchCities(match.id, match.countryCode || selectedCountryCode, match.code);
      }
    }
  }, [stateName, provincesList.length]);

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
        state: stateName,
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
    if (!newPassword || newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
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
          <ModernFloatingInput
            label="Full Legal Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={<User className="w-4 h-4" />}
            placeholder="e.g. Alex Morgan"
          />

          <ModernFloatingInput
            label="Email Address (Read-only)"
            type="email"
            value={profile?.email || ''}
            disabled
            icon={<Mail className="w-4 h-4" />}
            placeholder="name@company.com"
          />

          <div className="sm:col-span-2">
            <ModernFloatingInput
              label="Phone Number (Optional)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone className="w-4 h-4" />}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        {/* Location Section */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Location Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Country / Region */}
            <ModernCountrySelect
              label="Country / Region"
              countries={countriesList}
              selectedCode={selectedCountryCode}
              loading={loadingCountries}
              onSelect={(c) => {
                setSelectedCountryCode(c.code);
                setCountry(c.name);
                setStateName('');
                setCity('');
                setCitiesList([]);
                fetchProvinces(c.code);
              }}
            />

            {/* State / Province */}
            <ModernStateSelect
              label="State / Province"
              states={provincesList}
              selectedState={stateName}
              loading={loadingProvinces}
              placeholder="Select State / Province..."
              onSelect={(name, obj) => {
                setStateName(name);
                setCity('');
                setCitiesList([]);
                if (obj?.id) {
                  fetchCities(obj.id, obj.countryCode || selectedCountryCode, obj.code);
                }
              }}
            />

            {/* City */}
            <ModernCitySelect
              label="City"
              cities={citiesList}
              selectedCity={city}
              loading={loadingCities}
              placeholder="Select or enter city..."
              onSelect={(name) => setCity(name)}
            />

            {/* Postal / ZIP Code */}
            <ModernFloatingInput
              label="Postal / ZIP Code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              icon={<MapPin className="w-4 h-4" />}
              placeholder="e.g. 10001 or 60490"
            />

            {/* Street Address (comes after City) */}
            <div className="sm:col-span-2">
              <ModernFloatingInput
                label="Street Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                icon={<MapPin className="w-4 h-4" />}
                placeholder="123 Cloud Avenue, Suite 400"
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
            <ModernFloatingInput
              label="Current Password"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              placeholder="••••••••••••"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          )}

          <ModernFloatingInput
            label={userHasPassword ? 'New Password' : 'Create Account Password'}
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            placeholder="••••••••••••"
            rightElement={
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <ModernFloatingInput
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            placeholder="••••••••••••"
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

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
                      Added {formatDate(k.createdAt)}
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

      {/* Subscription & Data Preservation Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Subscription & Plan Management
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your active compute plan, auto-renewal settings, and 90-day data preservation.
            </p>
          </div>
          {subInfo && (
            <div>
              {subInfo.status?.toUpperCase() === 'SUSPENDED' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <Clock className="w-3 h-3" /> Suspended
                </span>
              ) : subInfo.status?.toUpperCase() === 'TRIAL' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  <Zap className="w-3 h-3" /> 30-Day Free Trial
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-3 h-3" /> Active Plan
                </span>
              )}
            </div>
          )}
        </div>

        {loadingSub ? (
          <div className="py-6 flex items-center justify-center text-slate-400 gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading subscription status...</span>
          </div>
        ) : subInfo ? (
          <div className="space-y-4">
            {/* Plan Details Card */}
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{subInfo.planName}</span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    ${subInfo.monthlyPrice?.toFixed(2)} {subInfo.currency || 'USD'}/mo
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {subInfo.status?.toUpperCase() === 'SUSPENDED'
                    ? `Suspended. ${subInfo.retentionDaysRemaining ?? 90} days remaining.`
                    : `Renews on ${subInfo.nextBillingDate ? formatDate(subInfo.nextBillingDate) : 'End of Cycle'}`}
                </p>
              </div>

              {subInfo.status?.toUpperCase() === 'SUSPENDED' ? (
                <button
                  type="button"
                  onClick={handleReactivateSubscription}
                  disabled={subActionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {subActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Reactivate
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeactivateModal(true)}
                  disabled={subActionLoading}
                  className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Power className="w-3.5 h-3.5 text-rose-600" />
                  Deactivate
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
              Cancellation and retention terms are governed by our{' '}
              <Link to="/terms#atc-9" className="text-blue-600 dark:text-blue-400 underline underline-offset-2">
                Terms of Service
              </Link>.
            </p>
          </div>
        ) : (
          <div className="py-6 px-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <CreditCard className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Active Subscription</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              You do not currently have an active compute subscription. Deploy an instance from the dashboard to get started.
            </p>
          </div>
        )}
      </div>

      {/* Deactivate Subscription Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base mb-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3>Deactivate Subscription</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              Are you sure you want to deactivate your <strong>{subInfo?.planName || 'Cloud VPS'}</strong> subscription? Recurring billing will stop immediately.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                disabled={subActionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivateSubscription}
                disabled={subActionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {subActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add SSH Key Modal */}
      {showAddKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Add Public SSH Key</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Paste your OpenSSH public key (typically found in <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">~/.ssh/id_rsa.pub</code> or <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">~/.ssh/id_ed25519.pub</code>).
            </p>

            <form onSubmit={handleAddSSHKey} className="space-y-4 pt-1">
              <ModernFloatingInput
                label="Key Name / Identifier"
                required
                placeholder="e.g. Work MacBook Pro, Office Desktop"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                icon={<Key className="w-4 h-4" />}
              />

              <ModernFloatingTextarea
                label="Public Key Content"
                required
                rows={4}
                placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... user@example.com"
                value={newPublicKey}
                onChange={(e) => setNewPublicKey(e.target.value)}
                className="font-mono text-xs"
              />

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
              <form onSubmit={handleGenerateSSHKey} className="space-y-4 pt-1">
                <ModernFloatingInput
                  label="Key Label"
                  required
                  placeholder="e.g. My Laptop Key Pair"
                  value={genKeyName}
                  onChange={(e) => setGenKeyName(e.target.value)}
                  icon={<Key className="w-4 h-4" />}
                />

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
