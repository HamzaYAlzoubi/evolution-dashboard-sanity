'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Palette, Shield, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserProfileForm } from '@/components/auth/UserProfileForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sanityClient } from '@/sanity/lib/client';

type SettingsSection = 'profile' | 'appearance' | 'account' | 'control-panel';

interface NewSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: any;
}

import { useToast } from '@/hooks/use-toast';

const NewSettingsDialog = ({ open, onOpenChange, currentUser }: NewSettingsDialogProps) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [archiveStatus, setArchiveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [archiveMessage, setArchiveMessage] = useState('');

  // Loading states for each action
  const [isCreating, setIsCreating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  
  const [allSeasons, setAllSeasons] = useState<{ _id: string; name: string }[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('');

  // State for the new season form
  const [seasonName, setSeasonName] = useState(`معسكر ${new Date().toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}`);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });

  useEffect(() => {
    const allSeasonsQuery = `*[_type == "season"]{_id, name} | order(_createdAt desc)`;
    if (open && currentUser?.isAdmin) {
      setArchiveStatus('idle');
      setArchiveMessage('');
      sanityClient.fetch(allSeasonsQuery).then(data => {
        setAllSeasons(data || []);
      });
    }
  }, [open, currentUser?.isAdmin]);

  const handleCreateSeason = async () => {
    setIsCreating(true);
    setArchiveStatus('idle');
    try {
      const response = await fetch('/api/seasons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: seasonName, startDate, endDate }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create season');
      }
      setArchiveStatus('success');
      setArchiveMessage(`تم إنشاء الموسم "${seasonName}" بنجاح.`);
      setAllSeasons(prev => [result.data, ...prev]);
    } catch (error: any) {
      setArchiveStatus('error');
      setArchiveMessage(error.message || 'An unknown error occurred.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleArchiveSeasons = async () => {
    setIsArchiving(true);
    setArchiveStatus('idle');
    try {
      const response = await fetch('/api/seasons/archive', {
        method: 'POST',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to archive seasons');
      }
      setArchiveStatus('success');
      setArchiveMessage(result.message || 'Operation completed successfully.');
    } catch (error: any) {
      setArchiveStatus('error');
      setArchiveMessage(error.message || 'An unknown error occurred.');
    } finally {
      setIsArchiving(false);
      setConfirmArchiveOpen(false);
    }
  };

  const handleDeleteSeason = async () => {
    if (!selectedSeason) return;
    setIsDeleting(true);
    setArchiveStatus('idle');
    try {
      const response = await fetch(`/api/seasons/${selectedSeason}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete season');
      }
      setArchiveStatus('success');
      setArchiveMessage(result.message || 'Season deleted successfully.');
      setAllSeasons(prev => prev.filter(s => s._id !== selectedSeason));
      setSelectedSeason('');
    } catch (error: any) {
      setArchiveStatus('error');
      setArchiveMessage(error.message || 'An unknown error occurred.');
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  const navItems = [
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'appearance', label: 'المظهر', icon: Palette },
    { id: 'account', label: 'الحساب', icon: Shield },
  ];

  const anyLoading = isCreating || isArchiving || isDeleting;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl p-0 max-h-[90vh] flex flex-col">
          <div className="p-4 md:p-6 border-b text-right">
            <DialogTitle className="text-2xl">الإعدادات</DialogTitle>
            <DialogDescription>قم بإدارة تفضيلات حسابك.</DialogDescription>
          </div>

          <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
            <nav
              className="
              flex flex-row md:flex-col
              p-2 md:p-4
              border-b md:border-b-0 md:border-l
              bg-muted/50
              md:w-1/3 lg:w-1/4
            "
            >
              {navItems.map(item => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    'w-full flex-1 md:flex-initial flex flex-col md:flex-row items-center justify-center md:justify-start text-center md:text-right gap-2 px-2 md:px-3 h-auto min-h-[50px] md:min-h-[40px]',
                    activeSection === item.id && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => setActiveSection(item.id as SettingsSection)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs md:text-sm whitespace-normal md:whitespace-nowrap">
                    {item.label}
                  </span>
                </Button>
              ))}
              {currentUser?.isAdmin && (
                <Button
                  key="control-panel"
                  variant="ghost"
                  className={cn(
                    'w-full flex-1 md:flex-initial flex flex-col md:flex-row items-center justify-center md:justify-start text-center md:text-right gap-2 px-2 md:px-3 h-auto min-h-[50px] md:min-h-[40px]',
                    activeSection === 'control-panel' && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => setActiveSection('control-panel')}
                >
                  <Shield className="h-5 w-5 text-red-500" />
                  <span className="text-xs md:text-sm whitespace-normal md:whitespace-nowrap">
                    لوحة التحكم
                  </span>
                </Button>
              )}
            </nav>

            <div className="flex-grow p-8 md:p-12 overflow-y-auto">
              {activeSection === 'profile' && (
                <div>
                  <h2 className="hidden md:block text-2xl font-bold mb-4 text-right">
                    الملف الشخصي
                  </h2>
                  <UserProfileForm onClose={() => onOpenChange(false)} />
                </div>
              )}
              {activeSection === 'appearance' && (
                <div>
                  <h2 className="hidden md:block text-2xl font-bold mb-4 text-right">
                    المظهر
                  </h2>
                  <p className="text-right">محتوى قسم المظهر سيكون هنا.</p>
                </div>
              )}
              {activeSection === 'account' && (
                <div>
                  <h2 className="hidden md:block text-2xl font-bold mb-4 text-right">
                    الحساب
                  </h2>
                  <p className="text-right">محتوى قسم الحساب سيكون هنا.</p>
                </div>
              )}
              {activeSection === 'control-panel' && currentUser?.isAdmin && (
                <div>
                  <h2 className="hidden md:block text-2xl font-bold mb-4 text-right">
                    لوحة تحكم الأدمن
                  </h2>
                  <div className="space-y-8 relative">
                    <div className="absolute top-0 left-0 w-full">
                      {archiveStatus === 'success' && (
                        <Alert variant="default" className="border-green-500 text-green-600 dark:border-green-500 [&>svg]:text-green-500">
                          <CheckCircle className="h-4 w-4" />
                          <AlertTitle>نجاح</AlertTitle>
                          <AlertDescription>{archiveMessage}</AlertDescription>
                        </Alert>
                      )}
                      {archiveStatus === 'error' && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>خطأ</AlertTitle>
                          <AlertDescription>{archiveMessage}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-4 rounded-lg border p-4 pt-16">
                      <h3 className="font-semibold">إنشاء موسم جديد</h3>
                      <div className="space-y-2">
                        <Label htmlFor="seasonName">اسم الموسم</Label>
                        <Input id="seasonName" value={seasonName} onChange={(e) => setSeasonName(e.target.value)} disabled={anyLoading} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">تاريخ البدء</Label>
                          <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={anyLoading} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">تاريخ الانتهاء</Label>
                          <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={anyLoading} />
                        </div>
                      </div>
                      <Button onClick={handleCreateSeason} disabled={anyLoading}>
                        {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "إنشاء الموسم"}
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-4 rounded-lg border p-4">
                      <h3 className="font-semibold">حذف موسم</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex-grow">
                          <Label>اختر الموسم لحذفه</Label>
                          <Select value={selectedSeason} onValueChange={setSelectedSeason} disabled={anyLoading}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر موسمًا..." />
                            </SelectTrigger>
                            <SelectContent>
                              {allSeasons.map(season => (
                                <SelectItem key={season._id} value={season._id}>{season.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="destructive" disabled={!selectedSeason || anyLoading} className="self-end" onClick={() => setConfirmDeleteOpen(true)}>
                          حذف
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                      <h3 className="font-semibold text-destructive">أرشفة المواسم المنتهية</h3>
                      <p className="text-sm text-muted-foreground">
                        يقوم هذا الإجراء بالبحث عن أي مواسم انتهت ولم يتم توثيق نتائجها، ثم يقوم بحساب البطل والناجين وتحديث سجل الموسم. استخدم هذا الإجراء بحذر.
                      </p>
                      <Button variant="destructive" onClick={() => setConfirmArchiveOpen(true)} disabled={anyLoading}>
                        {isArchiving ? <Loader2 className="h-4 w-4 animate-spin" /> : "بحث وأرشفة المواسم المنتهية"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmArchiveOpen} onOpenChange={setConfirmArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الأرشفة</DialogTitle>
            <DialogDescription>
              هل أنت متأكد أنك تريد بدء عملية أرشفة المواسم المنتهية؟ هذه العملية لا يمكن التراجع عنها.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmArchiveOpen(false)} disabled={isArchiving}>إلغاء</Button>
            <Button variant="destructive" onClick={handleArchiveSeasons} disabled={isArchiving}>
              {isArchiving ? <Loader2 className="h-4 w-4 animate-spin" /> : "نعم، قم بالأرشفة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد أنك تريد حذف هذا الموسم؟ هذا الإجراء لا يمكن التراجع عنه وسيحذف السجل نهائيًا.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)} disabled={isDeleting}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDeleteSeason} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "نعم، قم بالحذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewSettingsDialog;
