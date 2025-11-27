"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";

interface Course {
  id: number;
  name: string;
  code: string;
  color: string;
}

interface AddCourseDialogProps {
  onCourseAdded: (course: Course) => void;
}

export function AddCourseDialog({ onCourseAdded }: AddCourseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    color: "#6B7280",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/courses", formData);
      toast.success("Course added successfully!");
      onCourseAdded(response.data);
      setIsOpen(false);
      setFormData({ name: "", code: "", color: "#6B7280" });
    } catch (error: any) {
      console.error("Error adding course:", error);
      toast.error(error.response?.data?.error || "Failed to add course");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Course
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>
              Create a new course to organize your assignments and projects.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="course-name">
                  Course Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="course-name"
                  placeholder="e.g., Introduction to Computer Science"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="course-code">
                  Course Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="course-code"
                  placeholder="e.g., CS101"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="course-color">Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="course-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <span className="text-sm text-muted-foreground">
                    Choose a color to identify this course
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Course"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
