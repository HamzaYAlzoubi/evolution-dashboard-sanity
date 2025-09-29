import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfileForm } from "@/components/auth/UserProfileForm";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0"> {/* Adjusted padding */}
        <DialogHeader className="p-6 pb-0"> {/* Adjusted padding */}
          <DialogTitle className="text-2xl font-bold">Settings</DialogTitle>
          <DialogDescription>Manage your application settings.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-1 rounded-none border-b p-0 px-6"> {/* Adjusted styling */}
            <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Profile
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="p-6 pt-4"> {/* Adjusted padding */}
            <UserProfileForm onClose={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
