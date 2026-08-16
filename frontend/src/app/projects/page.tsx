"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Clock, Trash2, Edit } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { AddCourseDialog } from "@/components/add-course-dialog";
import { useProjects, useCourses, useCreateProject, useUpdateProject, useDeleteProject, type Project } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries";

const EMPTY_FORM = { name: "", description: "", course_id: "", due_date: "", status: "active", progress: 0 };

export default function ProjectsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const { data: projects = [], isLoading } = useProjects();
  const { data: courses = [] } = useCourses();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const qc = useQueryClient();

  const handleCreateProject = async () => {
    if (!formData.name.trim()) return;
    await createProject.mutateAsync({
      ...formData,
      course_id: formData.course_id && formData.course_id !== "none" ? formData.course_id : undefined,
      due_date: formData.due_date || undefined,
    });
    setIsCreateDialogOpen(false);
    setFormData(EMPTY_FORM);
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;
    await updateProject.mutateAsync({
      id: selectedProject.id,
      data: {
        ...formData,
        course_id: formData.course_id && formData.course_id !== "none" ? formData.course_id : undefined,
        due_date: formData.due_date || undefined,
      },
    });
    setIsEditDialogOpen(false);
    setSelectedProject(null);
    setFormData(EMPTY_FORM);
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      course_id: project.course_id?.toString() || "",
      due_date: project.due_date || "",
      status: project.status,
      progress: project.progress,
    });
    setIsEditDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":    return "bg-white/10 text-white border-white/20";
      case "completed": return "bg-white/20 text-white border-white/30";
      case "archived":  return "bg-white/5 text-white/60 border-white/10";
      default:          return "bg-white/10 text-white border-white/20";
    }
  };

  const getProgressColor = (p: number) => p >= 80 ? "bg-white" : p >= 50 ? "bg-white/70" : "bg-white/40";

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No due date";

  const CourseSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <>
      <Select value={value || "none"} onValueChange={v => onChange(v === "none" ? "" : v)}>
        <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No course</SelectItem>
          {courses.map(c => (
            <SelectItem key={c.id} value={c.id.toString()}>{c.name} ({c.code})</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <AddCourseDialog onCourseAdded={nc => {
        qc.setQueryData(queryKeys.courses, (old: any) => old ? [...old, nc] : [nc]);
        onChange(nc.id.toString());
      }} />
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Projects" />

      <div className="bg-card/30 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <p className="text-muted-foreground">Manage your group projects and assignments</p>
          <Button className="hover-lift" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />New Project
          </Button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first project to start tracking work</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />Create Your First Project
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              projects.map((project, i) => (
                <Card key={project.id} className="modern-card hover-lift animate-scale-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{project.name}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          {project.course_name && (
                            <span className="bg-muted px-2 py-1 rounded text-xs mr-2">{project.course_name}</span>
                          )}
                          <Clock className="h-4 w-4 mr-1" />{formatDate(project.due_date)}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.description && <CardDescription className="mb-4">{project.description}</CardDescription>}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.progress)}`}
                          style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1 hover-lift" onClick={() => openEditDialog(project)}>
                        <Edit className="h-4 w-4 mr-1" />Edit
                      </Button>
                      <Button variant="destructive" size="sm" className="hover-lift"
                        aria-label={`Delete ${project.name}`}
                        onClick={() => deleteProject.mutate(project.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>

      {/* Create dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Add a new project to track your work.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Project Name *</Label>
              <Input placeholder="e.g., Web Development Portfolio" value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe your project..." value={formData.description}
                onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Course</Label>
              <CourseSelect value={formData.course_id} onChange={v => setFormData(f => ({ ...f, course_id: v }))} />
            </div>
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Input type="date" value={formData.due_date} onChange={e => setFormData(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); setFormData(EMPTY_FORM); }}>Cancel</Button>
            <Button onClick={handleCreateProject} disabled={createProject.isPending}>
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update your project details and progress.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Project Name *</Label>
              <Input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Course</Label>
              <CourseSelect value={formData.course_id} onChange={v => setFormData(f => ({ ...f, course_id: v }))} />
            </div>
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Input type="date" value={formData.due_date} onChange={e => setFormData(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Progress: {formData.progress}%</Label>
              <Input type="range" min="0" max="100" value={formData.progress}
                onChange={e => setFormData(f => ({ ...f, progress: parseInt(e.target.value) }))} className="cursor-pointer" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedProject(null); setFormData(EMPTY_FORM); }}>Cancel</Button>
            <Button onClick={handleUpdateProject} disabled={updateProject.isPending}>
              {updateProject.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
