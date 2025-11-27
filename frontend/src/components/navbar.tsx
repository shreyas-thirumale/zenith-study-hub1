"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/authStore";
import { GraduationCap, LogOut, User } from "lucide-react";

interface NavbarProps {
  title?: string;
}

export function Navbar({ title }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <header className="bg-card/50 backdrop-blur-sm shadow-sm border-b border-border/50 sticky top-0 z-50 animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Logo and Title */}
          <div className="flex items-center space-x-4 animate-slide-right">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity group"
            >
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                Zenith Study Hub
              </span>
            </button>
            
            {title && (
              <>
                <div className="h-6 w-px bg-border hidden sm:block" />
                <h1 className="text-xl font-semibold text-foreground">
                  {title}
                </h1>
              </>
            )}
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-3 animate-slide-left">
            {user && (
              <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-muted rounded-lg">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{user.name}</span>
              </div>
            )}
            
            <ThemeToggle />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hover-lift"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
