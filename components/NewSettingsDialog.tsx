'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Palette, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserProfileForm } from '@/components/auth/UserProfileForm';

type SettingsSection = 'profile' | 'appearance' | 'account' | 'control-panel';

interface NewSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: any;
}

const NewSettingsDialog = ({ open, onOpenChange, currentUser }: NewSettingsDialogProps) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  const navItems = [
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'appearance', label: 'المظهر', icon: Palette },
    { id: 'account', label: 'الحساب', icon: Shield },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 max-h-[90vh] flex flex-col">
        {/* Shared Header */}
        <div className="p-4 md:p-6 border-b text-right">
          <DialogTitle className="text-2xl">الإعدادات</DialogTitle>
          <DialogDescription>قم بإدارة تفضيلات حسابك.</DialogDescription>
        </div>

        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          {/* Navigation Section */}
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

          {/* Content Section */}
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
                <p className="text-right">محتوى لوحة التحكم سيكون هنا.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewSettingsDialog;
