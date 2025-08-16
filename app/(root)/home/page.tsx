"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
import { Star } from "lucide-react";


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
    <div className=" flex flex-col items-center justify-center min-h-screen bg-white  dark:bg-[#0F172B]">
        <Card className="shadow-none border-none dark:bg-[#0F172B]">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 ">
              {/* المشروع - الآن سيلكت من شادسن */}
              <div className="space-y-2">
                <Label htmlFor="project">المشروع</Label>

                <Select
                  value={formData.project}
                  onValueChange={handleProjectChange}
                >
                  <SelectTrigger  id="project" className="w-full dark:border-white">
                    <SelectValue placeholder="اختر المشروع" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem  key={p.id} value={p.id}>
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

              {/* حقل تاريخ الجلسة */}
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

              {/* ملاحظات */}
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

              {/* زر الإضافة */}
              <Button
                type="submit"
                variant="outline"
                className="w-full dark:bg-[#6866F1] bg-[#0f172b] text-white"
              >
                إضافة الجلسة
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="shadow-none border-none dark:bg-[#0F172B]">
          <CardTitle className="text-center text-lg font-semibold">الهدف اليومي</CardTitle>
          <CardContent className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <Star className="text-yellow-500" />
              <span className="text-lg font-semibold">4 نجوم</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              أكمل 4 ساعات من العمل اليوم لتحقيق الهدف.
            </p>
          </CardContent>
        </Card>
      </div>
  );
}
