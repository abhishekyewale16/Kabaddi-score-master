
"use client"

import { BarChart, PieChart } from 'lucide-react';
import type { Team } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartBar,
  ChartPie,
} from '@/components/ui/chart';
import { Bar, Pie, Cell } from 'recharts';

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

const raidSuccessConfig = {
    successful: {
        label: "Successful",
        color: "hsl(var(--chart-1))",
    },
    unsuccessful: {
        label: "Empty/Failed",
        color: "hsl(var(--chart-2))",
    }
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
  
  const totalRaidsData = useMemo(() => {
    const totalRaids = teams.flatMap(t => t.players).reduce((sum, p) => sum + p.totalRaids, 0);
    const successfulRaids = teams.flatMap(t => t.players).reduce((sum, p) => sum + p.successfulRaids, 0);
    const unsuccessfulRaids = totalRaids - successfulRaids;
    
    if (totalRaids === 0) return [];

    return [
        { name: 'successful', value: successfulRaids, fill: "var(--color-successful)" },
        { name: 'unsuccessful', value: unsuccessfulRaids, fill: "var(--color-unsuccessful)" },
    ];

  }, [teams]);

  const isDataAvailable = teams.some(team => team.score > 0);

  if (!isDataAvailable) {
      return null;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-primary" />
                    Team Score Breakdown
                </CardTitle>
                <CardDescription>A comparison of how each team scored their points.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={teamPointBreakdownConfig} className="min-h-[200px] w-full">
                    <BarChart accessibilityLayer data={teamPointBreakdownData} layout="vertical">
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="raidPoints" stackId="a" fill="var(--color-raidPoints)" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="tacklePoints" stackId="a" fill="var(--color-tacklePoints)" />
                        <Bar dataKey="bonusPoints" stackId="a" fill="var(--color-bonusPoints)" />
                        <Bar dataKey="lonaPoints" stackId="a" fill="var(--color-lonaPoints)" />
                        <Bar dataKey="extraPoints" stackId="a" fill="var(--color-extraPoints)" radius={[4, 0, 0, 4]} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    Overall Raid Success
                </CardTitle>
                <CardDescription>A look at the overall raid effectiveness in the match.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={raidSuccessConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={totalRaidsData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            strokeWidth={5}
                        >
                             {totalRaidsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                         <ChartLegend
                            content={<ChartLegendContent nameKey="name" />}
                            className="-translate-y-[20px] flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
