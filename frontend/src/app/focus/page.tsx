"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Clock, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { useFocusSessions, useFocusStats, useStartFocusSession, useEndFocusSession, type FocusSession } from "@/lib/queries";

export default function FocusPage() {
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const { data: sessions = [], isLoading } = useFocusSessions();
  const { data: focusStats } = useFocusStats();
  const startMutation = useStartFocusSession();
  const endMutation = useEndFocusSession();

  // Countdown
  useEffect(() => {
    if (!isRunning) return;
    if (timer <= 0) {
      setIsRunning(false);
      if (activeSession) endSession(activeSession.id);
      return;
    }
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [isRunning, timer]);

  const startSession = async (duration: number) => {
    const session = await startMutation.mutateAsync({ duration });
    setActiveSession(session);
    setTimer(duration);
    setIsRunning(true);
  };

  const endSession = async (sessionId: string) => {
    await endMutation.mutateAsync(sessionId);
    setActiveSession(null);
    setTimer(0);
    setIsRunning(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Focus Mode" />

      <div className="bg-card/30 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-muted-foreground">Track your study time and stay focused</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="modern-card mb-6 animate-scale-in">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-foreground">
                  Focus Timer
                </CardTitle>
                <CardDescription>
                  {activeSession ? 'Session in progress' : 'Start a new focus session'}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-8">
                  <div className="text-6xl font-mono font-bold text-primary mb-4 animate-pulse">
                    {formatTime(timer)}
                  </div>
                  {activeSession && (
                    <p className="text-muted-foreground animate-fade-in">
                      {activeSession.course_name || 'General Study'}
                    </p>
                  )}
                </div>

                <div className="flex justify-center gap-4">
                  {!activeSession ? (
                    <>
                      {[
                        { label: '25 min', duration: 1500, className: 'bg-primary hover:bg-primary/90' },
                        { label: '30 min', duration: 1800, className: 'bg-primary hover:bg-primary/90' },
                        { label: '45 min', duration: 2700, className: 'bg-primary hover:bg-primary/90' },
                      ].map(({ label, duration, className }, i) => (
                        <Button key={label} size="lg" onClick={() => startSession(duration)}
                          className={`${className} hover-lift animate-slide-up animate-stagger-${i + 1}`}
                          disabled={startMutation.isPending}>
                          <Play className="h-5 w-5 mr-2" />{label}
                        </Button>
                      ))}
                    </>
                  ) : (
                    <>
                      {isRunning ? (
                        <Button size="lg" variant="outline" onClick={() => setIsRunning(false)} className="hover-lift">
                          <Pause className="h-5 w-5 mr-2" />Pause
                        </Button>
                      ) : (
                        <Button size="lg" onClick={() => setIsRunning(true)}
                          className="bg-primary hover:bg-primary/90 hover-lift">
                          <Play className="h-5 w-5 mr-2" />Resume
                        </Button>
                      )}
                      <Button size="lg" variant="destructive" className="hover-lift"
                        onClick={() => activeSession && endSession(activeSession.id)}
                        disabled={endMutation.isPending}>
                        <Square className="h-5 w-5 mr-2" />End Session
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Your latest focus sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No focus sessions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.slice(0, 5).map(session => (
                      <div key={session.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium">{session.course_name || 'General Study'}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(session.started_at)}</p>
                        </div>
                        <p className="font-medium text-primary">{formatDuration(session.duration)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="modern-card animate-slide-left">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary" />Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { value: formatDuration(focusStats?.weekSeconds ?? 0), label: 'This Week', color: 'text-primary text-3xl' },
                  { value: formatDuration(focusStats?.totalSeconds ?? 0), label: 'Total Focus Time', color: 'text-foreground text-3xl' },
                  { value: String(focusStats?.totalSessions ?? 0), label: 'Sessions Completed', color: 'text-foreground text-2xl' },
                  { value: `${focusStats?.averageSessionMinutes ?? 0}m`, label: 'Average Session', color: 'text-muted-foreground text-2xl' },
                ].map((stat, i) => (
                  <div key={i} className={`text-center animate-fade-in animate-stagger-${i + 1}`}>
                    <div className={`font-bold ${stat.color}`}>{stat.value}</div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Tips</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { color: 'bg-white', text: 'Use the Pomodoro technique: 25 minutes of focused work followed by a 5-minute break' },
                  { color: 'bg-white/60', text: 'Find a quiet environment free from distractions' },
                  { color: 'bg-white/30', text: 'Set specific goals for each focus session' },
                ].map((tip, i) => (
                  <div key={i} className="flex items-start">
                    <div className={`w-2 h-2 ${tip.color} rounded-full mt-2 mr-3 shrink-0`} />
                    <p>{tip.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
