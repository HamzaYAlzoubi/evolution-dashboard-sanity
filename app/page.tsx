"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Home() {
  const [formData, setFormData] = useState({
    project: "",
    date: "",
    hours: 0,
    minutes: 0,
    notes: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: new Date().toISOString().split("T")[0],
    }));
  }, []);

  const [Alertsuccess, setsuccess] = useState(false);
  const [AlertError, setAlertError] = useState(false);

  const projects = [
    { id: "proj-1", name: "مشروع ألف" },
    { id: "proj-2", name: "مشروع باء" },
    { id: "proj-3", name: "مشروع جيم" },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProjectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, project: value }));
  };

  const handleDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, date: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      (!formData.hours || Number(formData.hours) === 0) &&
      (!formData.minutes || Number(formData.minutes) === 0)
    ) {
      setAlertError(true);
      setTimeout(() => {
        setAlertError(false);
      }, 3000);
      return;
    }

    console.log("بيانات الفورم:", formData);

    setsuccess(true);
    setTimeout(() => {
      setsuccess(false);
    }, 3000);
  };

  return (
    <div className=" relative flex justify-center items-center min-h-screen  md:mr-64 duration-300">
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
          <AlertDescription>انت لم تضع ساعات ودقائق للجلسة.</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-none border-none">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* المشروع - الآن سيلكت من شادسن */}
            <div className="space-y-2">
              <Label htmlFor="project">المشروع</Label>

              <Select
                value={formData.project}
                onValueChange={handleProjectChange}
              >
                <SelectTrigger id="project" className="w-full">
                  <SelectValue placeholder="اختر المشروع" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* مدة الجلسة */}
            <div className="space-y-2">
              <Label>مدة الجلسة</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  name="hours"
                  placeholder="ساعة"
                  className="w-1/2"
                  min="0"
                  value={formData.hours}
                  onChange={handleChange}
                />
                <Input
                  type="number"
                  name="minutes"
                  placeholder="دقيقة"
                  className="w-1/2"
                  min="0"
                  value={formData.minutes}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* حقل تاريخ الجلسة */}
            <div className="space-y-2">
              <Label htmlFor="date">تاريخ الجلسة</Label>
              <Input
                type="date"
                id="date"
                name="date"
                className="w-full"
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>

            {/* ملاحظات */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="(إختياري)"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            {/* زر الإضافة */}
            <Button
              type="submit"
              variant="outline"
              className="w-full bg-[#0f172b] text-white"
            >
              إضافة الجلسة
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
