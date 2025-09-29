'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UserProfileForm() {
  const { data: session, update } = useSession();
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
    console.log('--- [SUBMIT] Starting profile update process ---');

    if (!session?.user?.id) {
      console.error('[SUBMIT] CRITICAL: No session.user.id found.', session);
      return;
    }
    console.log('[SUBMIT] Session object:', session);
    console.log(`[SUBMIT] User ID: ${session.user.id}`);

    setIsSaving(true);

    let assetRefPayload: { _ref: string; _type: 'reference' } | undefined = undefined;
    let newImageUrl: string | undefined = session.user.image || undefined;

    const nameHasChanged = userName !== session.user.name;
    const avatarHasChanged = avatarFile !== null;
    console.log(`[SUBMIT] Name changed: ${nameHasChanged}, Avatar changed: ${avatarHasChanged}`);

    // 1. Handle Avatar Upload
    if (avatarHasChanged) {
      console.log('[AVATAR] Avatar has changed, starting upload...');
      const formData = new FormData();
      formData.append('avatar', avatarFile as File);
      formData.append('userId', session.user.id);

      try {
        const uploadResponse = await fetch('/api/user/upload-avatar', {
          method: 'POST',
          body: formData,
        });

        console.log('[AVATAR] Raw upload response:', uploadResponse);
        const responseBody = await uploadResponse.json();

        if (!uploadResponse.ok) {
          console.error('[AVATAR] Upload API returned an error:', responseBody);
          throw new Error(responseBody.message || `Server error: ${uploadResponse.statusText}`);
        }

        console.log('[AVATAR] Upload successful. API response body:', responseBody);
        newImageUrl = responseBody.imageUrl;
        assetRefPayload = { _ref: responseBody.assetRef, _type: 'reference' };

      } catch (error) {
        console.error('[AVATAR] FATAL: Caught exception during avatar upload fetch:', error);
        alert(`فشل تحميل الصورة الرمزية. تحقق من الكونسول لمزيد من التفاصيل.`);
        setIsSaving(false);
        return;
      }
    }

    // 2. Handle Profile Update in Sanity
    if (nameHasChanged || assetRefPayload) {
      console.log('[PROFILE] Name or avatar has changed, starting profile update...');
      const payload = {
        userId: session.user.id,
        name: userName,
        ...(assetRefPayload && { image: assetRefPayload }),
      };
      console.log('[PROFILE] Payload for update-profile API:', payload);

      try {
        const updateProfileResponse = await fetch('/api/user/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        console.log('[PROFILE] Raw update response:', updateProfileResponse);
        const responseBody = await updateProfileResponse.json();

        if (!updateProfileResponse.ok) {
          console.error('[PROFILE] Update API returned an error:', responseBody);
          throw new Error(responseBody.message || `Server error: ${updateProfileResponse.statusText}`);
        }

        console.log('[PROFILE] Update successful. API response body:', responseBody);

      } catch (error) {
        console.error('[PROFILE] FATAL: Caught exception during profile update fetch:', error);
        alert(`فشل تحديث الملف الشخصي. تحقق من الكونسول لمزيد من التفاصيل.`);
        setIsSaving(false);
        return;
      }
    }

    // 3. Update Next-Auth session
    console.log('[SESSION] All server operations successful. Attempting to update Next-Auth session...');
    try {
      const sessionUpdatePayload = { name: userName, image: newImageUrl };
      console.log('[SESSION] Payload for Next-Auth update():', sessionUpdatePayload);
      await update(sessionUpdatePayload);
      console.log('[SESSION] Next-Auth session updated successfully.');
      alert('تم تحديث الملف الشخصي بنجاح!');
    } catch (error) {
      console.error('[SESSION] FATAL: Failed to update Next-Auth session:', error);
      alert('فشل تحديث جلسة المستخدم. الرجاء تسجيل الخروج والدخول مرة أخرى لرؤية التغييرات.');
    } finally {
      setIsSaving(false);
      console.log('--- [SUBMIT] End of profile update process ---');
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
