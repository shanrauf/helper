"use client";

import { Crown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";

const dayOptions = [
  { value: 1, label: "Today" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

export default function StatsPage() {
  const [selectedDays, setSelectedDays] = useState(7);

  const { data: openCounts } = api.mailbox.openCount.useQuery();
  const { data: leaderboardData } = api.mailbox.leaderboard.useQuery({ days: selectedDays });

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">Ticket Dashboard</h1>
        <div className="flex justify-center gap-2">
          {dayOptions.map((option) => (
            <Button
              key={option.value}
              variant={selectedDays === option.value ? "default" : "outlined"}
              onClick={() => setSelectedDays(option.value)}
              className="text-lg px-6 py-3"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-muted-foreground">All Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-8xl font-bold text-blue-600">{openCounts?.all ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-muted-foreground">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-8xl font-bold text-green-600">{openCounts?.assigned ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-muted-foreground">Unassigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-8xl font-bold text-orange-600">{openCounts?.unassigned ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-muted-foreground">Mine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-8xl font-bold text-purple-600">{openCounts?.mine ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-4xl text-center">Team Leaderboard - Last {selectedDays} days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboardData?.leaderboard.map((member, index) => (
              <div
                key={member.userId}
                data-testid="leaderboard-entry"
                className="flex items-center justify-between p-6 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-16">
                    {index === 0 && <Crown className="h-8 w-8 text-yellow-500 fill-yellow-500" />}
                    <div className="text-4xl font-bold text-muted-foreground">#{index + 1}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{member.displayName}</div>
                    <div className="text-lg text-muted-foreground">{member.email}</div>
                  </div>
                </div>
                <div className="text-5xl font-bold text-primary">{member.replyCount}</div>
              </div>
            ))}
            {!leaderboardData?.leaderboard.length && (
              <div className="text-center text-2xl text-muted-foreground py-12">
                No activity in the selected time period
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
