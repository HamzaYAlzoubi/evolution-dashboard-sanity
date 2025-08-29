'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircleIcon, CheckCircle2Icon, Star } from "lucide-react";
import { FaSpinner, FaStar } from "react-icons/fa";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";

import { sanityClient } from "@/sanity/lib/client";
import { USER_QUERY } from "@/sanity/lib/queries";

import LinkStudio from "@/app/link";
import { HiChevronLeft } from "react-icons/hi2";

export default function HomeSessionsForm() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    project: "",
    date: "",
    hours: "",
    minutes: "",
    notes: "",
  });

  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTargetAchieved, setIsTargetAchieved] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: new Date().toISOString().split("T")[0],
    }));
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      sanityClient.fetch(USER_QUERY, { userId: session.user.id }).then((data) => {
        setUserData(data);
        if (data?.sessions) {
          const today = new Date().toISOString().split("T")[0];
          const todaySessions = data.sessions.filter((s: any) => s.date === today);
          const totalMinutesToday = todaySessions.reduce((acc: number, s: any) => acc + (Number(s.hours) * 60) + Number(s.minutes), 0);
          if (totalMinutesToday >= data.dailyTarget) {
            setIsTargetAchieved(true);
          }
        }
        setIsLoading(false);
      });
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status, session?.user?.id]);

  const [Alertsuccess, setsuccess] = useState(false);
  const [AlertError, setAlertError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [dailyTarget, setDailyTarget] = useState(240);
  const [targetInputHours, setTargetInputHours] = useState(4);
  const [targetInputMinutes, setTargetInputMinutes] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingTarget, setIsUpdatingTarget] = useState(false);

  useEffect(() => {
    if (userData?.dailyTarget) {
      const targetInMinutes = userData.dailyTarget;
      setDailyTarget(targetInMinutes);
      setTargetInputHours(Math.floor(targetInMinutes / 60));
      setTargetInputMinutes(targetInMinutes % 60);
    }
  }, [userData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleProjectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, project: value }));
  };

  const handleDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, date: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.project) {
      setErrorMessage("الرجاء اختيار مشروع أولاً.");
      setAlertError(true);
      setTimeout(() => setAlertError(false), 3000);
      return;
    }

    if (
      (!formData.hours || Number(formData.hours) === 0) &&
      (!formData.minutes || Number(formData.minutes) === 0)
    ) {
      setErrorMessage("انت لم تضع ساعات ودقائق للجلسة.");
      setAlertError(true);
      setTimeout(() => setAlertError(false), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: session?.user?.id,
          projectId: formData.project,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setsuccess(true);
        setTimeout(() => setsuccess(false), 3000);
        setFormData({
          project: "",
          date: new Date().toISOString().split("T")[0],
          hours: "",
          minutes: "",
          notes: "",
        });
      } else {
        setErrorMessage("فشل في تسجيل الجلسة.");
        setAlertError(true);
        setTimeout(() => setAlertError(false), 3000);
      }
    } catch (error) {
      setErrorMessage("فشل في تسجيل الجلسة.");
      setAlertError(true);
      setTimeout(() => setAlertError(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDailyTarget = async () => {
    if (!session?.user?.id) return;
    setIsUpdatingTarget(true);
    const totalMinutes = (Number(targetInputHours) * 60) + Number(targetInputMinutes);
    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyTarget: totalMinutes }),
      });
      const data = await res.json();
      if (data.success) {
        setDailyTarget(totalMinutes);
        setTargetDialogOpen(false);
      } else {
        console.error("Failed to update daily target");
      }
    } catch (error) {
      console.error("Error updating daily target:", error);
    }
    setIsUpdatingTarget(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin h-8 w-8" />
      </div>
    );
  }

  const dailyTargetHours = Math.floor(dailyTarget / 60);
  const dailyTargetMinutes = dailyTarget % 60;

  return (
    <div className="flex relative pt-5 flex-col items-center justify-center min-h-screen bg-white dark:bg-[#0F172B]">

      <h1 className="text-2xl font-bold mb-6 dark:text-white">
        إضافة جلسة عمل
      </h1>
      {Alertsuccess && (
        <Alert className="absolute top-20 w-[90%] text-green-600">
          <CheckCircle2Icon />
          <AlertTitle>نجح! وفقك الله تعالى لكل خير</AlertTitle>
          <AlertDescription>تم حفظ الجلسة بنجاح.</AlertDescription>
        </Alert>
      )}
      {AlertError && (
        <Alert className="absolute top-20 w-[90%]" variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>فشل! لم يتم تسجيل الجلسة.</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-none border-none dark:bg-[#0F172B]">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 ">
            <div className="space-y-2">
              <Label htmlFor="project">المشروع</Label>

              <Select
                value={formData.project}
                onValueChange={handleProjectChange}
              >
                <SelectTrigger
                  id="project"
                  className="w-full dark:border-white"
                >
                  <SelectValue placeholder="اختر المشروع" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {userData?.projects?.map((p: any) => {
                    const activeSubProjects = p.subProjects?.filter((sp: any) => sp.status === 'نشط') || [];
                    const isProjectActive = p.status === 'نشط';

                    if (isProjectActive || activeSubProjects.length > 0) {
                      return (
                        <SelectGroup key={p._id}>
                          <SelectLabel className="text-red-600" dir="auto">{p.name}</SelectLabel>
                          {isProjectActive && <SelectItem className="font-bold" value={p._id} dir="auto">{p.name}</SelectItem>}
                          {activeSubProjects.map((sp: any) => (
                            <SelectItem key={sp._id} value={sp._id} dir="rtl">
                              <div className="flex items-center justify-between w-full">
                                {formData.project !== sp._id && <HiChevronLeft/>}
                                <span>{sp.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      );
                    }
                    return null;
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>مدة الجلسة</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  name="hours"
                  placeholder="ساعة"
                  className="w-1/2 dark:border-white"
                  min="0"
                  value={formData.hours}
                  onChange={handleChange}
                />
                <Input
                  type="number"
                  name="minutes"
                  placeholder="دقيقة"
                  className="w-1/2 dark:border-white"
                  min="0"
                  value={formData.minutes}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">تاريخ الجلسة</Label>
              <Input
                type="date"
                id="date"
                name="date"
                className="w-full dark:border-white"
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="(إختياري)"
                value={formData.notes}
                onChange={handleChange}
                className="dark:border-white"
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              className="w-full dark:bg-[#6866F1] bg-[#0f172b] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? <FaSpinner className="animate-spin mx-auto" /> : "إضافة الجلسة"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-none border-none dark:bg-[#0F172B]">
        <CardTitle className="text-center text-lg font-semibold flex items-center justify-center gap-2">
          <span>الهدف اليومي</span>
        </CardTitle>
        <CardContent className="flex flex-col items-center">
          <div className="flex items-center mr-[-10px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTargetDialogOpen(true)}
            >
              {isTargetAchieved ? <FaStar className="text-yellow-500" /> : <Star className="text-yellow-500" />}
            </Button>
            <span className="text-lg font-semibold">
              {dailyTargetHours > 0 && `${dailyTargetHours}h`}
              {dailyTargetHours > 0 && dailyTargetMinutes > 0 && " "}
              {dailyTargetMinutes > 0 && `${dailyTargetMinutes}m`}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            أكمل هدفك اليومي لتحقيق الإنجاز.
          </p>
        </CardContent>
      </Card>

      <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديد الهدف اليومي</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>الوقت المطلوب يوميًا</Label>
            <div className="flex gap-2">
              <Input
                id="targetHours"
                type="number"
                min={0}
                max={18}
                placeholder="ساعات"
                value={targetInputHours}
                onChange={(e) => setTargetInputHours(Number(e.target.value))}
                className="mt-2 w-1/2"
              />
              <Input
                id="targetMinutes"
                type="number"
                min={0}
                max={59}
                placeholder="دقائق"
                value={targetInputMinutes}
                onChange={(e) => setTargetInputMinutes(Number(e.target.value))}
                className="mt-2 w-1/2"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={() => setTargetDialogOpen(false)} disabled={isUpdatingTarget}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateDailyTarget} disabled={isUpdatingTarget}>
              {isUpdatingTarget ? <FaSpinner className="animate-spin" /> : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
