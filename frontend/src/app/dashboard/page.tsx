"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Focus, BookOpen } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const { user, initializeSession } = useAuthStore();
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    activeProjects: 0,
    focusHours: 0,
    courses: 0,
  });

  useEffect(() => {
    // Initialize session and load stats
    const init = async () => {
      await initializeSession();
      loadDashboardStats();
    };
    init();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Fetch real data from API
      const [eventsRes, projectsRes, sessionsRes, coursesRes] = await Promise.all([
        api.get('/calendar').catch(() => ({ data: [] })),
        api.get('/projects').catch(() => ({ data: [] })),
        api.get('/focus/sessions').catch(() => ({ data: [] })),
        api.get('/courses').catch(() => ({ data: [] })),
      ]);

      const events = eventsRes.data;
      const projects = projectsRes.data;
      const sessions = sessionsRes.data;
      const courses = coursesRes.data;

      // Calculate upcoming events (next 7 days)
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingEvents = Array.isArray(events) 
        ? events.filter((e: any) => {
            const eventDate = new Date(e.date);
            return eventDate >= today && eventDate <= nextWeek;
          }).length 
        : 0;

      // Count active projects
      const activeProjects = Array.isArray(projects)
        ? projects.filter((p: any) => p.status === 'active').length
        : 0;

      // Calculate focus hours this week
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const focusHours = Array.isArray(sessions)
        ? sessions
            .filter((s: any) => new Date(s.started_at) >= weekStart)
            .reduce((total: number, s: any) => total + (s.duration || 0), 0) / 3600
        : 0;

      setStats({
        upcomingEvents,
        activeProjects,
        focusHours: Math.round(focusHours),
        courses: Array.isArray(courses) ? courses.length : 0,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Keep stats at 0 if there's an error
      setStats({
        upcomingEvents: 0,
        activeProjects: 0,
        focusHours: 0,
        courses: 0,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Dashboard" />

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Welcome back, {user?.name || "Beta Tester"}!
          </h2>
          <p className="text-muted-foreground">
            Here's what's happening with your studies today
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="modern-card hover-lift animate-scale-in animate-stagger-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Events
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.upcomingEvents}
              </div>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </CardContent>
          </Card>

          <Card className="modern-card hover-lift animate-scale-in animate-stagger-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Projects
              </CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats.activeProjects}
              </div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card className="modern-card hover-lift animate-scale-in animate-stagger-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Focus Hours</CardTitle>
              <Focus className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">
                {stats.focusHours}
              </div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card className="modern-card hover-lift animate-scale-in animate-stagger-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {stats.courses}
              </div>
              <p className="text-xs text-muted-foreground">This semester</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="modern-card animate-slide-up animate-stagger-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                Quick Actions
              </CardTitle>
              <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start hover-lift group"
                onClick={() => router.push("/calendar")}
              >
                <Calendar className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                View Calendar
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start hover-lift group"
                onClick={() => router.push("/projects")}
              >
                <Users className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                View Projects
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start hover-lift group"
                onClick={() => router.push("/focus")}
              >
                <Focus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                Start Focus Session
              </Button>
            </CardContent>
          </Card>

          <Card className="modern-card animate-slide-up animate-stagger-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Getting Started
              </CardTitle>
              <CardDescription>Tips to maximize your productivity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200 animate-fade-in animate-stagger-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Add your courses to organize assignments
                    </p>
                    <p className="text-xs text-muted-foreground">Start by creating courses</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200 animate-fade-in animate-stagger-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Track deadlines in the calendar
                    </p>
                    <p className="text-xs text-muted-foreground">Never miss an assignment</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200 animate-fade-in animate-stagger-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Use focus sessions to stay productive
                    </p>
                    <p className="text-xs text-muted-foreground">Track your study time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
