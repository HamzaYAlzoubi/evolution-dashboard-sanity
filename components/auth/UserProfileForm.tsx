'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UserProfileForm({ onClose }: { onClose: () => void }) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [userName, setUserName] = useState(session?.user?.name || '');
  const [userEmail, setUserEmail] = useState(session?.user?.email || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAvatarFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!session?.user?.id) {
      return;
    }

    setIsSaving(true);

    let assetRefPayload: { _ref: string; _type: 'reference' } | undefined = undefined;
    let newImageUrl: string | undefined = session.user.image || undefined;

    const nameHasChanged = userName !== session.user.name;
    const avatarHasChanged = avatarFile !== null;

    // 1. Handle Avatar Upload
    if (avatarHasChanged) {
      const formData = new FormData();
      formData.append('avatar', avatarFile as File);
      formData.append('userId', session.user.id);

      try {
        const uploadResponse = await fetch('/api/user/upload-avatar', {
          method: 'POST',
          body: formData,
        });

        const responseBody = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(responseBody.message || `Server error: ${uploadResponse.statusText}`);
        }

        newImageUrl = responseBody.imageUrl;
        assetRefPayload = { _ref: responseBody.assetRef, _type: 'reference' };

      } catch (error) {
        console.error('Avatar upload failed:', error);
        alert(`فشل تحميل الصورة الرمزية. تحقق من الكونسول لمزيد من التفاصيل.`);
        setIsSaving(false);
        return;
      }
    }

    // 2. Handle Profile Update in Sanity
    if (nameHasChanged || assetRefPayload) {
      const payload = {
        userId: session.user.id,
        name: userName,
        ...(assetRefPayload && { image: assetRefPayload }),
      };

      try {
        const updateProfileResponse = await fetch('/api/user/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const responseBody = await updateProfileResponse.json();

        if (!updateProfileResponse.ok) {
          throw new Error(responseBody.message || `Server error: ${updateProfileResponse.statusText}`);
        }

      } catch (error) {
        console.error('Profile update failed:', error);
        alert(`فشل تحديث الملف الشخصي. تحقق من الكونسول لمزيد من التفاصيل.`);
        setIsSaving(false);
        return;
      }
    }

    // 3. Update Next-Auth session
    try {
      const sessionUpdatePayload = { name: userName, image: newImageUrl };
      await update(sessionUpdatePayload);
      await update(); // Force a full session re-fetch from the server
      alert('تم تحديث الملف الشخصي بنجاح!');
      onClose();
    } catch (error) {
      console.error('Failed to update Next-Auth session:', error);
      alert('فشل تحديث جلسة المستخدم. الرجاء تسجيل الخروج والدخول مرة أخرى لرؤية التغييرات.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!session || !session.user || !session.user.id) {
    return <p>Loading user data or user not authenticated...</p>;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>تعديل الملف الشخصي</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || 'User Avatar'} />
              <AvatarFallback>{session.user?.name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <Label htmlFor="avatar-upload" className="cursor-pointer text-blue-600 hover:underline">
              تغيير الصورة الرمزية
            </Label>
            <Input
              id="avatar-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">الاسم</Label>
            <Input
              id="name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              disabled
              className="bg-gray-100 dark:bg-gray-800"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
