
"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Team } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Label } from '@/components/ui/label';

interface FoulPlayProps {
  teams: [Team, Team];
  onIssueCard: (data: { teamId: number; playerId: number; cardType: 'green' | 'yellow' | 'red' }) => void;
  isTimerRunning: boolean;
}

const formSchema = z.object({
  cardType: z.enum(['green', 'yellow', 'red'], { required_error: "You must select a card type." }),
  teamId: z.string().min(1, { message: 'Please select a team.' }),
  playerId: z.string().min(1, { message: "Player selection is required." }),
});

export function FoulPlay({ teams, onIssueCard, isTimerRunning }: FoulPlayProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamId: '',
      playerId: '',
      cardType: undefined,
    },
  });

  const selectedTeamId = form.watch('teamId');
  const selectedTeam = teams.find(t => t.id === Number(selectedTeamId));
  const availablePlayers = selectedTeam?.players.filter(p => !p.isRedCarded) ?? [];

  function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
        teamId: Number(values.teamId),
        playerId: Number(values.playerId),
        cardType: values.cardType,
    };
    onIssueCard(data);
    
    toast({
      title: "Card Issued!",
      description: `A ${values.cardType} card has been issued.`,
    })
    setOpen(false);
    form.reset({
        teamId: '',
        playerId: '',
        cardType: undefined
    });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full" disabled={!isTimerRunning}>Issue Card</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Issue a Disciplinary Card</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="cardType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Card Type</FormLabel>
                      <FormControl>
                        <RadioGroup 
                          onValueChange={field.onChange}
                          value={field.value} 
                          className="grid grid-cols-3 gap-2"
                        >
                          <FormItem>
                             <RadioGroupItem value="green" id="green" className="peer sr-only" />
                             <Label htmlFor="green" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <div className="w-8 h-12 bg-green-500 rounded-sm mb-2"></div>
                                Green
                             </Label>
                          </FormItem>
                          <FormItem>
                             <RadioGroupItem value="yellow" id="yellow" className="peer sr-only" />
                             <Label htmlFor="yellow" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <div className="w-8 h-12 bg-yellow-400 rounded-sm mb-2"></div>
                                Yellow
                             </Label>
                          </FormItem>
                          <FormItem>
                             <RadioGroupItem value="red" id="red" className="peer sr-only" />
                             <Label htmlFor="red" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <div className="w-8 h-12 bg-red-600 rounded-sm mb-2"></div>
                                Red
                             </Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team</FormLabel>
                       <Select onValueChange={(value) => {
                           field.onChange(value);
                           form.setValue('playerId', ''); // Reset player when team changes
                       }} value={field.value}>
                        <FormControl>
                           <SelectTrigger>
                                <SelectValue placeholder="Select a team" />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {teams.map(team => (
                                <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                            ))}
                        </SelectContent>
                       </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="playerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Player ({selectedTeam?.name ?? 'No team selected'})</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedTeamId}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a player" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availablePlayers.map(player => (
                            <SelectItem key={player.id} value={String(player.id)}>{player.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="destructive">Issue Card</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
