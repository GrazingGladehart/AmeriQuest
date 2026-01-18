import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Flame, Trophy, Target, Snowflake, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { LeafBackground } from "@/components/layout/LeafBackground";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import type { UserStats } from "@shared/schema";

export default function Stats() {
  const statsQuery = useQuery<UserStats>({
    queryKey: ["/api/stats"],
  });

  const stats = statsQuery.data;
  const activityDates = stats?.activityDates?.map((d) => new Date(d)) || [];
  
  const chartData = stats?.pointsHistory?.slice(-14).map((h) => ({
    date: new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    points: h.points,
  })) || [];

  const chartConfig = {
    points: {
      label: "Points",
      color: "hsl(var(--primary))",
    },
  };

  if (statsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
        <div className="animate-pulse text-green-600 font-bold">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-4 relative overflow-hidden">
      <LeafBackground />
      <div className="max-w-md mx-auto space-y-6 relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold font-display text-green-900">Your Progress</h1>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Current Streak</span>
            </div>
            <p className="text-4xl font-black text-orange-700" data-testid="text-current-streak">{stats?.currentStreak ?? 0}</p>
            <p className="text-xs text-orange-500 mt-1">days in a row</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Best Streak</span>
            </div>
            <p className="text-4xl font-black text-yellow-700" data-testid="text-longest-streak">{stats?.longestStreak ?? 0}</p>
            <p className="text-xs text-yellow-600 mt-1">personal best</p>
          </Card>
        </div>

        <Card className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Snowflake className="w-5 h-5 text-cyan-500" />
              <span className="text-sm font-bold text-cyan-700">Streak Freezes Available</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(stats?.streakFreezes ?? 0, 5) }).map((_, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                  <Snowflake className="w-4 h-4 text-white" />
                </div>
              ))}
              {(stats?.streakFreezes ?? 0) > 5 && (
                <span className="text-cyan-700 font-bold ml-1">+{(stats?.streakFreezes ?? 0) - 5}</span>
              )}
              {(stats?.streakFreezes ?? 0) === 0 && (
                <span className="text-cyan-600 text-sm">None available</span>
              )}
            </div>
          </div>
          <p className="text-xs text-cyan-600 mt-2">Complete quests to earn streak freezes. They protect your streak if you miss a day!</p>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold text-gray-500 uppercase">Total Points</span>
            </div>
            <p className="text-2xl font-black text-green-700" data-testid="text-total-points">{stats?.totalPoints ?? 0}</p>
          </Card>

          <Card className="p-4 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-gray-500 uppercase">Hunts Done</span>
            </div>
            <p className="text-2xl font-black text-purple-700" data-testid="text-hunts-completed">{stats?.huntsCompleted ?? 0}</p>
          </Card>
        </div>

        {chartData.length > 0 && (
          <Card className="p-4 bg-white/90 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Points Over Time
            </h3>
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis tickLine={false} axisLine={false} fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="points"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorPoints)"
                />
              </AreaChart>
            </ChartContainer>
          </Card>
        )}

        <Card className="p-4 bg-white/90 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            Activity Calendar
          </h3>
          <div className="flex justify-center">
            <Calendar
              mode="multiple"
              selected={activityDates}
              className="rounded-md"
              modifiers={{
                activity: activityDates,
              }}
              modifiersClassNames={{
                activity: "bg-green-500 text-white hover:bg-green-600",
              }}
              disabled
            />
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Green days show when you completed quests
          </p>
        </Card>
      </div>
    </div>
  );
}
