
"use client"

import { useState, useEffect } from 'react';
import { useForm, useForm as useEmptyRaidForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Team } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardPlus, Star, Shield, Swords, Award, PlusSquare, UserMinus, Ban, Replace } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface ScoringControlsProps {
  teams: [Team, Team];
  raidingTeamId: number;
  onAddScore: (data: { teamId: number; playerId?: number; pointType: string; points: number, eliminatedPlayerIds?: number[] }) => void;
  onEmptyRaid: (teamId: number, playerId: number) => void;
  onSwitchRaidingTeam: () => void;
  isTimerRunning: boolean;
}

const formSchema = z.object({
  teamId: z.string().min(1, { message: 'Please select a team.' }),
  pointType: z.enum(['raid', 'tackle', 'bonus', 'raid-bonus', 'line-out']),
  points: z.coerce.number().min(0, { message: 'Points must be positive.' }).max(10, { message: 'Points cannot exceed 10.' }),
  playerId: z.string().optional(),
  eliminatedPlayerIds: z.array(z.number()).optional(),
}).refine(data => {
  if (!['bonus', 'line-out'].includes(data.pointType)) {
    return data.playerId && data.playerId.length > 0;
  }
  return true;
}, {
  message: "Player selection is required for this point type.",
  path: ["playerId"],
}).refine(data => {
    if (['raid', 'raid-bonus'].includes(data.pointType)) {
        return data.points === data.eliminatedPlayerIds?.length;
    }
    return true;
}, {
    message: "Number of points must match the number of eliminated players.",
    path: ["points"],
});


const emptyRaidSchema = z.object({
    playerId: z.string().min(1, { message: "Please select the raider." }),
});


export function ScoringControls({ teams, raidingTeamId, onAddScore, onEmptyRaid, onSwitchRaidingTeam, isTimerRunning }: ScoringControlsProps) {
  const [open, setOpen] = useState(false);
  const [emptyRaidDialogOpen, setEmptyRaidDialogOpen] = useState(false);
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamId: String(raidingTeamId),
      pointType: 'raid',
      points: 0,
      playerId: '',
      eliminatedPlayerIds: [],
    },
  });

  const emptyRaidForm = useEmptyRaidForm<z.infer<typeof emptyRaidSchema>>({
    resolver: zodResolver(emptyRaidSchema),
    defaultValues: {
        playerId: ''
    }
  });

  const selectedPointType = form.watch('pointType');
  const raidingTeam = teams.find(t => t.id === raidingTeamId);
  const eligibleRaidingPlayers = raidingTeam?.players.filter(p => p.isPlaying && !p.isOut && !p.isRedCarded && p.suspensionTimer === 0);

  const handlePointTypeChange = (newPointType: z.infer<typeof formSchema>['pointType']) => {
    form.setValue('pointType', newPointType);
    const isTackle = newPointType === 'tackle';
    const newTeamId = isTackle ? (raidingTeamId === 1 ? '2' : '1') : String(raidingTeamId);
    
    let defaultPoints = 0;
    if (newPointType === 'tackle') defaultPoints = 1;
    if (newPointType === 'bonus') defaultPoints = 1;

    form.reset({
        pointType: newPointType,
        teamId: newTeamId,
        playerId: '',
        points: defaultPoints,
        eliminatedPlayerIds: [],
    });
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
        if (name === 'eliminatedPlayerIds') {
            const pointTypesToUpdate = ['raid', 'raid-bonus'];
            if (pointTypesToUpdate.includes(value.pointType as string)) {
                form.setValue('points', value.eliminatedPlayerIds?.length ?? 0);
            }
        }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  useEffect(() => {
    if(open) {
      handlePointTypeChange(form.getValues('pointType'));
    }
  }, [raidingTeamId, open]);

  useEffect(() => {
    if (!emptyRaidDialogOpen) {
        emptyRaidForm.reset({ playerId: '' });
    }
  }, [emptyRaidDialogOpen, emptyRaidForm]);
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
        teamId: Number(values.teamId),
        playerId: values.playerId ? Number(values.playerId) : undefined,
        pointType: values.pointType,
        points: values.points,
        eliminatedPlayerIds: values.eliminatedPlayerIds,
    };
    onAddScore(data);
    
    let toastDescription = `Added points for ${values.pointType.replace('-', ' ')}.`;
     if (values.pointType === 'line-out') {
        const lineOutTeam = teams.find(t => t.id === raidingTeamId)
        const opposingTeam = teams.find(t => t.id !== raidingTeamId);
        toastDescription = `${values.points} point(s) awarded to ${opposingTeam?.name} for ${lineOutTeam?.name}'s line out.`;
    }

    toast({
      title: "Score Updated!",
      description: toastDescription,
    })
    setOpen(false);
  }

  function onEmptyRaidSubmit(values: z.infer<typeof emptyRaidSchema>) {
    onEmptyRaid(raidingTeamId, Number(values.playerId));
    setEmptyRaidDialogOpen(false);
  }
  
  const isTackleEvent = selectedPointType === 'tackle';
  const scoringTeamId = Number(form.watch('teamId'));
  const defendingTeamId = isTackleEvent ? scoringTeamId : (scoringTeamId === 1 ? 2 : 1);
  const playerSelectTeam = teams.find(t => t.id === scoringTeamId);
  const eliminatedPlayerTeam = teams.find(t => t.id === defendingTeamId);
  const activePlayers = playerSelectTeam?.players.filter(p => p.isPlaying && !p.isOut && !p.isRedCarded && p.suspensionTimer === 0);
  const availableToEliminatePlayers = eliminatedPlayerTeam?.players.filter(p => p.isPlaying && !p.isOut && !p.isRedCarded && p.suspensionTimer === 0);
  const showEliminatedPlayerSelection = ['raid', 'tackle', 'raid-bonus'].includes(selectedPointType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <ClipboardPlus className="text-primary" />
          Update Score
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={!isTimerRunning}>Add Score Event</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Register a Scoring Event</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                  control={form.control}
                  name="pointType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Point Type</FormLabel>
                      <FormControl>
                        <RadioGroup 
                          onValueChange={(value) => handlePointTypeChange(value as any)}
                          value={field.value} 
                          className="grid grid-cols-2 gap-2"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="raid" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Swords className="w-4 h-4" /> Raid</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="tackle" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Shield className="w-4 h-4" /> Tackle</FormLabel>
                          </FormItem>
                           <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="raid-bonus" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><PlusSquare className="w-4 h-4" /> Raid + Bonus</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="bonus" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Star className="w-4 h-4" /> Bonus Only</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="line-out" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><UserMinus className="w-4 h-4" /> Line Out</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="playerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isTackleEvent ? 'Tackler' : 'Raider'} ({playerSelectTeam?.name})</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!playerSelectTeam}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an active player" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activePlayers?.map(player => (
                            <SelectItem key={player.id} value={String(player.id)}>{player.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showEliminatedPlayerSelection && (
                    <FormField
                        control={form.control}
                        name="eliminatedPlayerIds"
                        render={() => (
                            <FormItem>
                                <FormLabel>Eliminated Players ({eliminatedPlayerTeam?.name})</FormLabel>
                                <div className="space-y-2 rounded-md border p-2 h-32 overflow-y-auto">
                                    {availableToEliminatePlayers?.map((player) => (
                                        <FormField
                                            key={player.id}
                                            control={form.control}
                                            name="eliminatedPlayerIds"
                                            render={({ field }) => {
                                                return (
                                                    <FormItem key={player.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(player.id)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...(field.value ?? []), player.id])
                                                                        : field.onChange(field.value?.filter((value) => value !== player.id));
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">{player.name}</FormLabel>
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                
                 {(selectedPointType === 'raid' || selectedPointType === 'raid-bonus' || selectedPointType === 'line-out') && (
                  <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {selectedPointType.includes('raid') ? 'Raid Points' : 'Number of Players'}
                        </FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 1" {...field} disabled={!selectedPointType.includes('line-out')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {isTackleEvent && (
                  <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Tackle Points</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={(value) => field.onChange(Number(value))}
                                value={String(field.value)}
                                className="flex gap-4"
                            >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="1" /></FormControl>
                                    <FormLabel className="font-normal">1 Point</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="2" /></FormControl>
                                    <FormLabel className="font-normal">2 Points (Super Tackle)</FormLabel>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}


                <DialogFooter>
                  <Button type="submit">Add Points</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={emptyRaidDialogOpen} onOpenChange={setEmptyRaidDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full" disabled={!isTimerRunning}>
                    <Ban className="mr-2 h-4 w-4" />
                    Empty Raid
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Declare Empty Raid</DialogTitle>
                </DialogHeader>
                <Form {...emptyRaidForm}>
                    <form onSubmit={emptyRaidForm.handleSubmit(onEmptyRaidSubmit)} className="space-y-4">
                        <FormField
                            control={emptyRaidForm.control}
                            name="playerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Raiding Player</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!raidingTeam}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an active player" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {eligibleRaidingPlayers?.map(player => (
                                                <SelectItem key={player.id} value={String(player.id)}>{player.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setEmptyRaidDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Confirm Empty Raid</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

        <Button variant="ghost" className="w-full" onClick={onSwitchRaidingTeam} disabled={!isTimerRunning}>
          <Replace className="mr-2 h-4 w-4" />
          Switch Raiding Team
        </Button>

      </CardContent>
    </Card>
  );
}
