"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  Users,
  Focus,
  BookOpen,
  ArrowRight,
  Star,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const features = [
    {
      icon: Calendar,
      title: "Smart Calendar",
      description:
        "Upload syllabi and automatically populate your calendar with assignments and exams",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      delay: "delay-100",
    },
    {
      icon: Users,
      title: "Project Management",
      description:
        "Collaborate with classmates on group projects with task management and file sharing",
      color: "text-green-600",
      bgColor: "bg-green-50",
      delay: "delay-200",
    },
    {
      icon: Focus,
      title: "Focus Mode",
      description:
        "Block distracting websites and track study time for better productivity",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      delay: "delay-300",
    },
    {
      icon: BookOpen,
      title: "Course Management",
      description:
        "Organize all your courses, assignments, and study materials in one place",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      delay: "delay-400",
    },
  ];

  const benefits = [
    "Lock in like you've never before",
    "Never miss an assignment deadline",
    "Collaborate with classmates all one on platform",
    "Track your study progress",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-accent/10 overflow-hidden">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6 animate-fade-in animate-stagger-1">
            <Star className="h-4 w-4 mr-2" />
            Your all-in-one productivity zone
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-purple-600 dark:from-primary dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent animate-swipe-up animate-stagger-2">
            Zenith Study Hub
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed animate-swipe-up animate-stagger-3">
            Transform your academic journey with the ultimate student
            productivity suite. Organize, collaborate, and excel like never
            before.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-swipe-up animate-stagger-4">
            <Button
              size="lg"
              className="text-lg px-8 py-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 hover-lift shadow-lg group"
              onClick={() => router.push("/auth/register")}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-4 border-2 hover-lift"
              onClick={() => router.push("/auth/login")}
            >
              Sign In
            </Button>
          </div>

          {/* Benefits */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center justify-center text-sm text-muted-foreground animate-fade-in"
                style={{ animationDelay: `${0.75 + index * 0.1}s` }}
              >
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card
                key={index}
                className="group modern-card hover-lift border-0 animate-scale-in"
                style={{ animationDelay: `${1.15 + index * 0.1}s` }}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/10 to-purple-600/10 dark:from-primary/20 dark:to-purple-600/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-200">
                    <IconComponent className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-200">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div
          className="text-center glass dark:glass-dark rounded-3xl p-12 shadow-xl animate-swipe-up"
          style={{ animationDelay: "1.55s" }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Ready to Transform Your Studies?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join students with the drive to boost their education like never
            before. <b>It's lock in season.</b>
          </p>
          <Button
            size="lg"
            className="text-lg px-12 py-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 hover-lift shadow-lg group"
            onClick={() => router.push("/dashboard")}
          >
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </div>
      </div>
    </div>
  );
}
