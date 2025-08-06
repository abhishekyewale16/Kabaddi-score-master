
"use client"

import { BarChart, Star } from 'lucide-react';
import type { Team } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import type { ChartConfig } from '@/components/ui/chart';
import { useMemo } from 'react';

interface MatchAnalyticsProps {
  teams: [Team, Team];
}

const teamPointBreakdownConfig = {
    raidPoints: {
      label: "Raid Points",
      color: "hsl(var(--chart-1))",
    },
    tacklePoints: {
      label: "Tackle Points",
      color: "hsl(var(--chart-2))",
    },
    bonusPoints: {
        label: "Bonus Points",
        color: "hsl(var(--chart-3))",
    },
    lonaPoints: {
      label: "All-Out Points",
      color: "hsl(var(--chart-4))",
    },
    extraPoints: {
      label: "Extra Points",
      color: "hsl(var(--chart-5))",
    },
} satisfies ChartConfig;

const topScorersConfig = {
  raidPoints: {
    label: "Raid Points",
    color: "hsl(var(--chart-1))",
  },
  tacklePoints: {
    label: "Tackle Points",
    color: "hsl(var(--chart-2))",
  },
  bonusPoints: {
    label: "Bonus Points",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;


export function MatchAnalytics({ teams }: MatchAnalyticsProps) {

  const teamPointBreakdownData = useMemo(() => teams.map(team => {
    const totalRaidPoints = team.players.reduce((sum, p) => sum + p.raidPoints, 0);
    const totalTacklePoints = team.players.reduce((sum, p) => sum + p.tacklePoints, 0);
    const totalBonusPoints = team.players.reduce((sum, p) => sum + p.bonusPoints, 0);

    return {
        name: team.name,
        raidPoints: totalRaidPoints,
        tacklePoints: totalTacklePoints,
        bonusPoints: totalBonusPoints,
        lonaPoints: team.lonaPoints,
        extraPoints: team.extraPoints,
    };
  }), [teams]);

  const topScorersData = useMemo(() => {
    return teams.flatMap(team => team.players.map(player => ({...player, teamName: team.name})))
        .filter(player => player.totalPoints > 0)
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 3);
  }, [teams]);


  const isDataAvailable = teams.some(team => team.score > 0);

  if (!isDataAvailable) {
      return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-primary" />
                    Team Score Breakdown
                </CardTitle>
                <CardDescription>A comparison of how each team scored their points.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={teamPointBreakdownConfig} className="min-h-[250px] w-full">
                    <RechartsBarChart data={teamPointBreakdownData} layout="horizontal">
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" type="category" tickLine={false} axisLine={false} />
                        <YAxis type="number" hide />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend content={<ChartLegendContent />} />
                        <Bar dataKey="raidPoints" stackId="a" fill="var(--color-raidPoints)" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="tacklePoints" stackId="a" fill="var(--color-tacklePoints)" />
                        <Bar dataKey="bonusPoints" stackId="a" fill="var(--color-bonusPoints)" />
                        <Bar dataKey="lonaPoints" stackId="a" fill="var(--color-lonaPoints)" />
                        <Bar dataKey="extraPoints" stackId="a" fill="var(--color-extraPoints)" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Top Scorers
              </CardTitle>
              <CardDescription>Top 3 players by total points scored in the match.</CardDescription>
          </CardHeader>
          <CardContent>
            {topScorersData.length > 0 ? (
                <ChartContainer config={topScorersConfig} className="min-h-[250px] w-full">
                    <RechartsBarChart data={topScorersData} layout="vertical">
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        width={120}
                        className="capitalize"
                      />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend content={<ChartLegendContent />} />
                      <Bar dataKey="raidPoints" stackId="score" fill="var(--color-raidPoints)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="tacklePoints" stackId="score" fill="var(--color-tacklePoints)" />
                      <Bar dataKey="bonusPoints" stackId="score" fill="var(--color-bonusPoints)" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No points have been scored yet.
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
