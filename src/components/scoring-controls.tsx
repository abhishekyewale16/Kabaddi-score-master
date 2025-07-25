
"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { ClipboardPlus, Star, Shield, Swords, PlusSquare, UserMinus, Ban, Replace, Award } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from './ui/checkbox';

interface ScoringControlsProps {
  teams: [Team, Team];
  raidingTeamId: number;
  onAddScore: (data: { teamId?: number; playerId?: number; pointType: string; points: number, eliminatedPlayerIds?: number[] }) => void;
  onEmptyRaid: (teamId: number, playerId: number) => void;
  onSwitchRaidingTeam: () => void;
  isTimerRunning: boolean;
}

const formSchema = z.object({
  teamId: z.string().optional(),
  pointType: z.enum(['raid', 'tackle', 'bonus', 'raid-bonus', 'line-out', 'technical_point']),
  points: z.coerce.number().min(0, { message: 'Points must be positive.' }).max(10, { message: 'Points cannot exceed 10.' }),
  playerId: z.string().optional(),
  eliminatedPlayerIds: z.array(z.number()).optional(),
}).refine(data => {
  if (['raid', 'tackle', 'raid-bonus'].includes(data.pointType)) {
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
}).refine(data => {
    if (data.pointType === 'tackle') {
        return data.eliminatedPlayerIds?.length === 1;
    }
    return true;
}, {
    message: "You must select exactly one raider who was tackled.",
    path: ["eliminatedPlayerIds"],
}).refine(data => {
    if (data.pointType === 'line-out') {
        return (data.eliminatedPlayerIds?.length ?? 0) > 0;
    }
    return true;
}, {
    message: "You must select at least one player for a line out.",
    path: ["eliminatedPlayerIds"],
}).refine(data => {
    if (data.pointType === 'technical_point') {
        return data.teamId && data.teamId.length > 0;
    }
    return true;
}, {
    message: "Please select a team for the technical point.",
    path: ["teamId"],
});


const emptyRaidSchema = z.object({
    playerId: z.string().min(1, { message: "Please select the raider." }),
});


export function ScoringControls({ teams, raidingTeamId, onAddScore, onEmptyRaid, onSwitchRaidingTeam, isTimerRunning }: ScoringControlsProps) {
  const [open, setOpen] = useState(false);
  const [emptyRaidDialogOpen, setEmptyRaidDialogOpen] = useState(false);
  const [isBonusAvailable, setIsBonusAvailable] = useState(false);
  const [isSuperTacklePossible, setIsSuperTacklePossible] = useState(false);
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
  
  const raidingTeam = useMemo(() => teams.find(t => t.id === raidingTeamId)!, [teams, raidingTeamId]);
  const defendingTeam = useMemo(() => teams.find(t => t.id !== raidingTeamId)!, [teams, raidingTeamId]);
  
  const activeRaidingPlayers = useMemo(() => 
    raidingTeam.players.filter(p => p.isPlaying && !p.isOut && !p.isRedCarded && p.suspensionTimer === 0) ?? [],
    [raidingTeam]
  );
  
  const activeDefendingPlayers = useMemo(() =>
    defendingTeam.players.filter(p => p.isPlaying && !p.isOut && !p.isRedCarded && p.suspensionTimer === 0) ?? [],
    [defendingTeam]
  );

  useEffect(() => {
    const activeDefenders = activeDefendingPlayers.length ?? 0;
    setIsBonusAvailable(activeDefenders >= 6);
    setIsSuperTacklePossible(activeDefenders <= 3 && activeDefenders > 0);
  }, [activeDefendingPlayers]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
        const defaultPointType = 'raid';
        const isTackle = defaultPointType === 'tackle';
        const teamId = isTackle ? String(defendingTeam.id) : String(raidingTeam.id);
        const defaultPoints = isTackle ? (isSuperTacklePossible ? 2 : 1) : 0;
        
        form.reset({
            teamId: teamId,
            pointType: defaultPointType,
            points: defaultPoints,
            playerId: '',
            eliminatedPlayerIds: [],
        });
    }
  };

  const handlePointTypeChange = useCallback((newPointType: z.infer<typeof formSchema>['pointType']) => {
    const isTackle = newPointType === 'tackle';
    const isLineOut = newPointType === 'line-out';
    const isTechnicalPoint = newPointType === 'technical_point';
    
    let newTeamId: string | undefined = isTackle ? String(defendingTeam.id) : String(raidingTeam.id);
    if (isLineOut || isTechnicalPoint) {
      newTeamId = undefined;
    }

    let defaultPoints = 0;
    if (newPointType === 'tackle') {
      defaultPoints = isSuperTacklePossible ? 2 : 1;
    } else if (newPointType === 'bonus') {
        defaultPoints = 1;
    } else if (isTechnicalPoint) {
        defaultPoints = 1;
    }


    form.reset({
        pointType: newPointType,
        teamId: newTeamId,
        playerId: '',
        points: defaultPoints,
        eliminatedPlayerIds: [],
    });
  }, [raidingTeam, defendingTeam, form, isSuperTacklePossible]);


  useEffect(() => {
    if (!emptyRaidDialogOpen) {
        emptyRaidForm.reset({ playerId: '' });
    }
  }, [emptyRaidDialogOpen, emptyRaidForm]);

  
  function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
        teamId: values.teamId ? Number(values.teamId) : undefined,
        playerId: values.playerId ? Number(values.playerId) : undefined,
        pointType: values.pointType,
        points: values.points,
        eliminatedPlayerIds: values.eliminatedPlayerIds,
    };
    onAddScore(data);
    
    let toastDescription = `Added points for ${values.pointType.replace('-', ' ')}.`;
     if (values.pointType === 'line-out') {
        const opposingTeam = teams.find(t => t.id !== raidingTeamId);
        toastDescription = `${values.points} point(s) awarded to ${opposingTeam?.name} for line out.`;
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
  const isLineOutEvent = selectedPointType === 'line-out';
  const isTechnicalPointEvent = selectedPointType === 'technical_point';

  const playerSelectionList = useMemo(() => {
      if (isTackleEvent) return activeDefendingPlayers;
      return activeRaidingPlayers;
  }, [isTackleEvent, activeDefendingPlayers, activeRaidingPlayers]);

  const playerSelectTeam = useMemo(() => {
    if (isTackleEvent) return defendingTeam;
    return raidingTeam;
  }, [isTackleEvent, defendingTeam, raidingTeam]);
  
  const eliminatedPlayerList = useMemo(() => {
    if (isTackleEvent) return activeRaidingPlayers;
    if (isLineOutEvent) return activeRaidingPlayers;
    return activeDefendingPlayers;
  }, [isTackleEvent, isLineOutEvent, activeRaidingPlayers, activeDefendingPlayers]);

  const eliminatedPlayerTeam = useMemo(() => {
    if (isTackleEvent) return raidingTeam;
    if (isLineOutEvent) return raidingTeam;
    return defendingTeam;
  }, [isTackleEvent, isLineOutEvent, raidingTeam, defendingTeam]);
  
  const showEliminatedPlayerSelection = ['raid', 'tackle', 'raid-bonus', 'line-out'].includes(selectedPointType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <ClipboardPlus className="text-primary" />
          Update Score
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Dialog open={open} onOpenChange={handleOpenChange}>
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
                           {isBonusAvailable && (
                            <>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="raid-bonus" /></FormControl>
                                <FormLabel className="font-normal flex items-center gap-2"><PlusSquare className="w-4 h-4" /> Raid + Bonus</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="bonus" /></FormControl>
                                <FormLabel className="font-normal flex items-center gap-2"><Star className="w-4 h-4" /> Bonus Only</FormLabel>
                              </FormItem>
                            </>
                           )}
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="line-out" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><UserMinus className="w-4 h-4" /> Line Out</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="technical_point" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Award className="w-4 h-4" /> Technical Point</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isTechnicalPointEvent && (
                  <FormField
                    control={form.control}
                    name="teamId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team to Award Point</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                )}

                {!isLineOutEvent && !isTechnicalPointEvent &&
                  <FormField
                    control={form.control}
                    name="playerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{selectedPointType === 'bonus' ? 'Raider' : isTackleEvent ? 'Tackler' : 'Raider'} ({playerSelectTeam?.name})</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!playerSelectTeam}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an active player" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {playerSelectionList.map(player => (
                              <SelectItem key={player.id} value={String(player.id)}>{player.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                }


                {showEliminatedPlayerSelection && !isTackleEvent && (
                    <FormField
                        control={form.control}
                        name="eliminatedPlayerIds"
                        render={() => (
                            <FormItem>
                                <div className="flex justify-between items-center">
                                  <FormLabel>{isLineOutEvent ? `Players Out (${eliminatedPlayerTeam?.name})` : `Eliminated Players (${eliminatedPlayerTeam?.name})` }</FormLabel>
                                </div>
                                <div className="space-y-2 rounded-md border p-2 max-h-40 overflow-y-auto">
                                    {eliminatedPlayerList.map((player) => (
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
                                                                    const newSelectedIds = checked
                                                                        ? [...(field.value ?? []), player.id]
                                                                        : field.value?.filter((value) => value !== player.id);
                                                                    field.onChange(newSelectedIds);
                                                                    if (selectedPointType.includes('raid') || selectedPointType === 'line-out') {
                                                                      form.setValue('points', newSelectedIds?.length ?? 0);
                                                                    }
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">{player.name}</FormLabel>
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                    ))}
                                    {eliminatedPlayerList.length === 0 && <p className="text-xs text-muted-foreground p-2 text-center">No active players to select.</p>}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {isTackleEvent && (
                    <FormField
                        control={form.control}
                        name="eliminatedPlayerIds"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Eliminated Raider ({eliminatedPlayerTeam?.name})</FormLabel>
                                <Select 
                                    onValueChange={(value) => field.onChange(value ? [Number(value)] : [])} 
                                    value={String(field.value?.[0] ?? '')} 
                                    disabled={!eliminatedPlayerTeam}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select the raider" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {eliminatedPlayerList.map(player => (
                                            <SelectItem key={player.id} value={String(player.id)}>{player.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                
                 {(!isTackleEvent) && (
                  <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {selectedPointType.includes('raid') ? 'Raid Points' : selectedPointType === 'bonus' ? 'Bonus Points' : 'Points'}
                        </FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 1" {...field} disabled={selectedPointType.includes('raid') || selectedPointType === 'line-out' || selectedPointType === 'bonus'} />
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
                                    <FormControl><RadioGroupItem value="1" disabled={isSuperTacklePossible} /></FormControl>
                                    <FormLabel className="font-normal">1 Point</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="2" disabled={!isSuperTacklePossible} /></FormControl>
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
                   <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
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
                                            {activeRaidingPlayers?.map(player => (
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
