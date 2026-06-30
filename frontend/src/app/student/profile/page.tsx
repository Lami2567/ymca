'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Save, Edit2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { toast } from 'sonner';
import { StudentLayout } from '@/components/StudentLayout';

interface StudentProfile {
  id: number;
  student_number: string;
  admission_date: string;
  current_year_of_study: number;
  expected_graduation_date: string | null;
  status: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    address: string | null;
  };
  program: {
    name: string;
    department: {
      name: string;
    } | null;
  } | null;
}

export default function StudentProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const meRes = await api.get('/auth/me');
      const userData = meRes.data.data;
      if (userData.student) {
        setProfile({
          ...userData.student,
          user: {
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || '',
          }
        });
      }
      updateUser(userData);
      
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile', error);
      toast.error('Failed to load your profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/auth/profile', formData);
      toast.success('Profile updated successfully');
      setEditing(false);
      await fetchProfile();
    } catch (error) {
      console.error('Failed to update profile', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.user.first_name || '',
        last_name: profile.user.last_name || '',
        email: profile.user.email || '',
        phone: profile.user.phone || '',
        address: profile.user.address || '',
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground animate-pulse">Loading profile...</div>
        </div>
      </StudentLayout>
    );
  }

  if (!profile) {
    return (
      <StudentLayout>
        <div className="p-8 text-red-600">Failed to load profile data.</div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-primary">My Profile</h1>
            <p className="text-muted-foreground mt-1">View and manage your personal information</p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Personal Information Card */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter your address"
                  />
                </div>
                <div className="flex gap-2 md:col-span-2 pt-4">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-semibold text-gray-900">
                    {profile.user.first_name} {profile.user.last_name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {profile.user.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {profile.user.phone || 'Not provided'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {profile.user.address || 'Not provided'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academic Information Card */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Academic Information
            </CardTitle>
            <CardDescription>Your academic program and enrollment details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Student Number</p>
                <p className="font-semibold text-gray-900">{profile.student_number}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Program</p>
                <p className="font-semibold text-gray-900">{profile.program?.name || 'Not assigned'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-semibold text-gray-900">
                  {profile.program?.department?.name || 'Not assigned'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current Year of Study</p>
                <p className="font-semibold text-gray-900">Year {profile.current_year_of_study}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Admission Date
                </p>
                <p className="font-semibold text-gray-900">{profile.admission_date}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Expected Graduation</p>
                <p className="font-semibold text-gray-900">
                  {profile.expected_graduation_date || 'Not set'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  {profile.status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
