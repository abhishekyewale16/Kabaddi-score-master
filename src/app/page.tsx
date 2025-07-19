
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { initialTeams } from '@/lib/data';
import type { Team, Player } from '@/lib/types';
import { Scoreboard } from '@/components/scoreboard';
import { PlayerStatsTable } from '@/components/player-stats-table';
import { ScoringControls } from '@/components/scoring-controls';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { LiveCommentary } from '@/components/live-commentary';
import { generateCommentary } from '@/ai/flows/generate-commentary';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { FoulPlay } from '@/components/foul-play';


const INITIAL_MATCH_DURATION = 20;

export type RaidState = {
  team1: number;
  team2: number;
}

export type SubstitutionState = {
  team1: number;
  team2: number;
}

export default function Home() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<[Team, Team]>(initialTeams);
  const [raidState, setRaidState] = useState<RaidState>({ team1: 0, team2: 0 });
  const [raidingTeamId, setRaidingTeamId] = useState<number>(1);
  const [commentaryLog, setCommentaryLog] = useState<string[]>([]);
  const [isCommentaryLoading, setIsCommentaryLoading] = useState(false);
  const [matchDuration, setMatchDuration] = useState(INITIAL_MATCH_DURATION);
  const [substitutionsMadeThisBreak, setSubstitutionsMadeThisBreak] = useState<SubstitutionState>({ team1: 0, team2: 0 });
  const [timer, setTimer] = useState({
    minutes: INITIAL_MATCH_DURATION,
    seconds: 0,
    isRunning: false,
    half: 1 as 1 | 2,
    isTimeout: false,
  });
  const prevTeamsRef = useRef<[Team, Team]>(teams);

  const isSubstitutionPeriod = timer.isTimeout || (timer.half === 1 && timer.minutes === 0 && timer.seconds === 0);
  const isMatchPristine = timer.half === 1 && timer.minutes === matchDuration && timer.seconds === 0 && !timer.isRunning;

  const switchRaidingTeam = useCallback(() => {
    setRaidingTeamId(prev => (prev === 1 ? 2 : 1));
  }, []);

  const addCommentary = useCallback(async (eventData: any) => {
    setIsCommentaryLoading(true);
    try {
        const history = commentaryLog.slice(-3); // Keep last 3 for context
        
        const fullEventData = {
          ...eventData,
          commentaryHistory: history,
        }

        const result = await generateCommentary(fullEventData);
        if (result.commentary) {
            setCommentaryLog(prev => [result.commentary, ...prev]);
        }
    } catch (error) {
        console.error("Error generating commentary:", error);
        toast({
            title: "Commentary Error",
            description: "The AI commentator is busy. Please try again in a moment.",
            variant: "destructive",
        });
    } finally {
        setIsCommentaryLoading(false);
    }
  }, [commentaryLog, toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timer.isRunning && !timer.isTimeout) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 };
          }
          if (prev.minutes > 0) {
            return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          }
          // Timer ends for the half
          if (prev.half === 1) {
             setSubstitutionsMadeThisBreak({ team1: 0, team2: 0 });
          }
          return { ...prev, isRunning: false };
        });

        // Decrement suspension timers
        setTeams(currentTeams => {
            let suspensionInProgress = false;
            const newTeams = currentTeams.map(team => ({
                ...team,
                players: team.players.map(player => {
                    if (player.suspensionTimer > 0) {
                        suspensionInProgress = true;
                        const newTimer = player.suspensionTimer - 1;
                        if (newTimer === 0) {
                            // Suspension over, mark as playing if not red carded
                            return { ...player, suspensionTimer: newTimer, isPlaying: !player.isRedCarded };
                        }
                        return { ...player, suspensionTimer: newTimer };
                    }
                    return player;
                })
            })) as [Team, Team];
            
            // Only update state if a timer was actually decremented
            return suspensionInProgress ? newTeams : currentTeams;
        });

      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, timer.isTimeout]);

  // Effect for showing toast on suspension end
  useEffect(() => {
    const prevTeams = prevTeamsRef.current;

    teams.forEach((team, teamIndex) => {
        team.players.forEach((player, playerIndex) => {
            const prevPlayer = prevTeams[teamIndex].players[playerIndex];
            if (prevPlayer.suspensionTimer > 0 && player.suspensionTimer === 0) {
                toast({
                    title: "Suspension Over",
                    description: `${player.name} (${team.name}) is now eligible to play.`,
                });
            }
        });
    });

    prevTeamsRef.current = teams;
  }, [teams, toast]);
  
  const handleToggleTimer = useCallback(() => {
    const isFirstHalfOver = timer.half === 1 && timer.minutes === 0 && timer.seconds === 0;
    const isSecondHalfOver = timer.half === 2 && timer.minutes === 0 && timer.seconds === 0;

    if (isSecondHalfOver) return; // Match is fully over

    if (timer.isTimeout) {
      // Resume from timeout
      setTimer(prev => ({ ...prev, isRunning: true, isTimeout: false }));
      setSubstitutionsMadeThisBreak({ team1: 0, team2: 0 });
      toast({
          title: "Timeout Over",
          description: "The match has resumed.",
      });
      return;
    }

    if (isFirstHalfOver) {
      // Start the second half
      setTimer({
        minutes: matchDuration,
        seconds: 0,
        isRunning: true,
        half: 2,
        isTimeout: false,
      });
      // Reset timeouts for the second half and substitutions
      setTeams(prevTeams => prevTeams.map(t => ({...t, timeoutsRemaining: 2})) as [Team, Team]);
      setSubstitutionsMadeThisBreak({ team1: 0, team2: 0 });

    } else {
      // Toggle pause/play
      setTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
    }
  }, [timer, matchDuration, toast]);

  const handleResetTimer = useCallback(() => {
    setTimer({
      minutes: matchDuration,
      seconds: 0,
      isRunning: false,
      half: 1,
      isTimeout: false,
    });
    setRaidState({ team1: 0, team2: 0 });
    setRaidingTeamId(1);
    setCommentaryLog([]);
    setSubstitutionsMadeThisBreak({ team1: 0, team2: 0 });
    // A deep copy is needed to reset players and timeouts
    const newInitialTeams = JSON.parse(JSON.stringify(initialTeams));
    newInitialTeams.forEach((team: Team) => team.timeoutsRemaining = 2);
    setTeams(newInitialTeams);
  }, [matchDuration]);
  
  const handleTakeTimeout = useCallback((teamId: number) => {
    const teamToUpdate = teams.find(t => t.id === teamId);
    
    if (!teamToUpdate || teamToUpdate.timeoutsRemaining <= 0 || !timer.isRunning || timer.isTimeout) {
        return;
    }

    setTimer(prev => ({ ...prev, isRunning: false, isTimeout: true }));
    setSubstitutionsMadeThisBreak({ team1: 0, team2: 0 });
    
    let teamName = '';
    const newTeams = JSON.parse(JSON.stringify(teams)) as [Team, Team];
    const teamIndex = newTeams.findIndex(t => t.id === teamId);
    if (teamIndex !== -1) {
        newTeams[teamIndex].timeoutsRemaining -= 1;
        teamName = newTeams[teamIndex].name;
    }

    setTeams(newTeams);
    toast({
        title: "Timeout Called",
        description: `${teamName} has called a timeout.`,
    });

}, [teams, timer.isRunning, timer.isTimeout, toast]);

  const handleMatchDurationChange = useCallback((newDuration: number) => {
    const duration = isNaN(newDuration) || newDuration < 1 ? 1 : newDuration;
    setMatchDuration(duration);
    if (!timer.isRunning && isMatchPristine) {
        setTimer(prev => ({ ...prev, minutes: duration, seconds: 0 }));
    }
  }, [timer.isRunning, isMatchPristine]);
  
  const handleAddScore = useCallback((data: { teamId: number; playerId?: number; pointType: string; points: number }) => {
    let newTeams = JSON.parse(JSON.stringify(teams)) as [Team, Team];
    const isRaidEvent = !['tackle', 'tackle-lona', 'line-out'].includes(data.pointType);
    const isTackleEvent = data.pointType.includes('tackle');

    if (isRaidEvent) {
        const teamKey = data.teamId === 1 ? 'team1' : 'team2';
        setRaidState(prev => ({ ...prev, [teamKey]: 0 }));
    }

    const scoringTeamIndex = newTeams.findIndex(t => t.id === data.teamId);
    if (scoringTeamIndex === -1) return;

    const opposingTeamIndex = 1 - scoringTeamIndex;
    
    if (data.pointType === 'line-out') {
        newTeams[opposingTeamIndex].score += data.points;
    } else {
        let teamScoreIncrement = 0;
        if (data.pointType === 'lona-points') {
            teamScoreIncrement = data.points + 2;
        } else if (data.pointType === 'bonus') {
            teamScoreIncrement = 1;
        } else if (data.pointType === 'raid-bonus') {
            teamScoreIncrement = data.points + 1;
        } else if (data.pointType === 'lona-bonus-points') {
            teamScoreIncrement = data.points + 1 + 2;
        } else if (data.pointType === 'tackle-lona') {
            teamScoreIncrement = data.points + 2;
        } else {
            teamScoreIncrement = data.points;
        }
        newTeams[scoringTeamIndex].score += teamScoreIncrement;

        if (data.playerId) {
            const playerIndex = newTeams[scoringTeamIndex].players.findIndex(p => p.id === data.playerId);
            if (playerIndex !== -1) {
                const player = newTeams[scoringTeamIndex].players[playerIndex];
                let playerPointIncrement = 0;
                const isSuccessfulRaid = data.pointType.includes('raid') || data.pointType.includes('bonus') || data.pointType.includes('lona');

                if (isSuccessfulRaid) {
                    player.totalRaids += 1;
                    player.successfulRaids += 1;
                }

                const raidPointsScored = data.points;
                const totalPointsInRaid = raidPointsScored + (data.pointType.includes('bonus') ? 1 : 0);
                if (isSuccessfulRaid && totalPointsInRaid >= 3) {
                    player.superRaids += 1;
                }

                switch (data.pointType) {
                    case 'raid':
                    case 'lona-points':
                        player.raidPoints += data.points;
                        playerPointIncrement = data.points;
                        break;
                    case 'raid-bonus':
                        player.raidPoints += data.points;
                        player.bonusPoints += 1;
                        playerPointIncrement = data.points + 1;
                        break;
                    case 'lona-bonus-points':
                        player.raidPoints += data.points;
                        player.bonusPoints += 1;
                        playerPointIncrement = data.points + 1;
                        break;
                    case 'tackle':
                    case 'tackle-lona':
                        player.tacklePoints += data.points;
                        if (data.points === 2) {
                            player.superTacklePoints += 1;
                        }
                        playerPointIncrement = data.points;
                        break;
                    case 'bonus':
                        player.bonusPoints += 1;
                        playerPointIncrement = 1;
                        break;
                }
                player.totalPoints += playerPointIncrement;
            }
        }
    }
    
    const team1Score = newTeams.find(t => t.id === 1)!.score;
    const team2Score = newTeams.find(t => t.id === 2)!.score;

    const scoringTeam = newTeams.find(t => t.id === data.teamId)!;
    const defendingTeam = newTeams.find(t => t.id !== data.teamId)!;
    const player = scoringTeam.players.find(p => p.id === data.playerId);

    const raidingTeamForCommentary = isTackleEvent ? defendingTeam : scoringTeam;
    const defendingTeamForCommentary = isTackleEvent ? scoringTeam : defendingTeam; 
    const currentRaidCount = raidingTeamId === 1 ? raidState.team1 : raidState.team2;
    const totalPointsInRaid = data.points + (['raid-bonus', 'bonus', 'lona-bonus-points'].includes(data.pointType) ? 1 : 0);
    const isSuccessfulRaid = data.pointType.includes('raid') || data.pointType.includes('bonus') || data.pointType.includes('lona');

    let eventType: string;
    if (isTackleEvent) {
        eventType = data.points === 2 ? 'super_tackle_score' : 'tackle_score';
    } else if (data.pointType === 'line-out') {
        eventType = 'line_out';
    } else {
        eventType = 'raid_score';
    }
    
    let raiderForCommentary: string | undefined;
    let defenderForCommentary: string | undefined;

    if (eventType === 'line_out') {
        const originalRaidingTeam = teams.find(t => t.id === raidingTeamId)
        raiderForCommentary = originalRaidingTeam?.players.find(p => p.id === data.playerId)?.name ?? 'Unknown Player';
    } else if (isTackleEvent) {
        const originalRaidingTeam = teams.find(t => t.id === raidingTeamId);
        const activeRaider = originalRaidingTeam?.players.find(p => p.isPlaying);
        raiderForCommentary = activeRaider?.name ?? 'Unknown Raider';
        defenderForCommentary = player?.name;
    } else { // raid event
        raiderForCommentary = player?.name;
    }

    const commentaryData = {
        eventType: eventType,
        raidingTeam: raidingTeamForCommentary.name,
        defendingTeam: defendingTeamForCommentary.name,
        raiderName: raiderForCommentary,
        defenderName: defenderForCommentary,
        points: data.points,
        isSuperRaid: isSuccessfulRaid && totalPointsInRaid >= 3,
        isDoOrDie: currentRaidCount === 2,
        isBonus: ['raid-bonus', 'bonus', 'lona-bonus-points'].includes(data.pointType),
        isLona: data.pointType.includes('lona'),
        raidCount: currentRaidCount,
        team1Score,
        team2Score,
    };
    
    addCommentary(commentaryData);
    setTeams(newTeams);
    if (!isTackleEvent) {
        switchRaidingTeam();
    }
}, [teams, raidState, addCommentary, switchRaidingTeam, raidingTeamId]);


  const handleEmptyRaid = useCallback((teamId: number, playerId: number) => {
    const isTeam1 = teamId === 1;
    const currentRaids = isTeam1 ? raidState.team1 : raidState.team2;
    
    let newTeamsWithRaidStat = JSON.parse(JSON.stringify(teams)) as [Team, Team];
    
    const raidingTeamIndex = newTeamsWithRaidStat.findIndex(t => t.id === teamId);
    if(raidingTeamIndex !== -1) {
        const playerIndex = newTeamsWithRaidStat[raidingTeamIndex].players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            const raider = newTeamsWithRaidStat[raidingTeamIndex].players[playerIndex];
            raider.totalRaids += 1;
        }
    }
    
    const raidingTeam = newTeamsWithRaidStat.find(t => t.id === teamId)!;
    const defendingTeam = newTeamsWithRaidStat.find(t => t.id !== teamId)!;
    const player = raidingTeam.players.find(p => p.id === playerId);
    const isDoOrDieRaid = currentRaids === 2;
    let finalTeams = newTeamsWithRaidStat;
    
    let finalTeam1Score = newTeamsWithRaidStat.find(t => t.id === 1)!.score;
    let finalTeam2Score = newTeamsWithRaidStat.find(t => t.id === 2)!.score;


    if (isDoOrDieRaid) { 
      const opposingTeamId = isTeam1 ? 2 : 1;
      const raidingTeamName = newTeamsWithRaidStat.find(t => t.id === teamId)?.name;
      const scoringTeamName = newTeamsWithRaidStat.find(t => t.id === opposingTeamId)?.name;
      
      const newTeamsWithScore = newTeamsWithRaidStat.map(team => 
        team.id === opposingTeamId ? { ...team, score: team.score + 1 } : team
      ) as [Team, Team];
      
      finalTeam1Score = newTeamsWithScore.find(t => t.id === 1)!.score;
      finalTeam2Score = newTeamsWithScore.find(t => t.id === 2)!.score;

      addCommentary({
          eventType: 'do_or_die_fail',
          raidingTeam: raidingTeam.name,
          defendingTeam: defendingTeam.name,
          raiderName: player?.name,
          points: 1,
          isSuperRaid: false,
          isDoOrDie: true,
          isBonus: false,
          isLona: false,
          raidCount: currentRaids,
          team1Score: finalTeam1Score,
          team2Score: finalTeam2Score,
      });

      finalTeams = newTeamsWithScore;

      toast({
          title: "Do or Die Raid Failed!",
          description: `1 point awarded to ${scoringTeamName} as ${raidingTeamName} failed to score.`,
          variant: "destructive"
      });
      
      setRaidState(prev => isTeam1 ? { ...prev, team1: 0 } : { ...prev, team2: 0 });

    } else {
      setRaidState(prev => isTeam1 ? { ...prev, team1: prev.team1 + 1 } : { ...prev, team2: prev.team2 + 1 });
      toast({
          title: "Empty Raid",
          description: `Raid count for ${newTeamsWithRaidStat.find(t => t.id === teamId)?.name} is now ${currentRaids + 1}.`,
      });
       addCommentary({
          eventType: 'empty_raid',
          raidingTeam: raidingTeam.name,
          defendingTeam: defendingTeam.name,
          raiderName: player?.name,
          points: 0,
          isSuperRaid: false,
          isDoOrDie: false,
          isBonus: false,
          isLona: false,
          raidCount: currentRaids,
          team1Score: finalTeam1Score,
          team2Score: finalTeam2Score,
      });
    }

    setTeams(finalTeams);
    switchRaidingTeam();

  }, [raidState, teams, toast, switchRaidingTeam, addCommentary]);


  const handleTeamNameChange = useCallback((teamId: number, newName: string) => {
    setTeams(currentTeams =>
      currentTeams.map(team =>
        team.id === teamId ? { ...team, name: newName } : team
      ) as [Team, Team]
    );
  }, []);
  
  const handleTeamCoachChange = useCallback((teamId: number, newCoach: string) => {
    setTeams(currentTeams =>
      currentTeams.map(team =>
        team.id === teamId ? { ...team, coach: newCoach } : team
      ) as [Team, Team]
    );
  }, []);

  const handleTeamCityChange = useCallback((teamId: number, newCity: string) => {
    setTeams(currentTeams =>
      currentTeams.map(team =>
        team.id === teamId ? { ...team, city: newCity } : team
      ) as [Team, Team]
    );
  }, []);


  const handlePlayerNameChange = useCallback((teamId: number, playerId: number, newName: string) => {
    setTeams(currentTeams =>
      currentTeams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            players: team.players.map(player =>
              player.id === playerId ? { ...player, name: newName } : player
            ),
          };
        }
        return team;
      }) as [Team, Team]
    );
  }, []);

  const handleSubstitutePlayer = useCallback((teamId: number, playerInId: number, playerOutId: number) => {
    const teamKey = teamId === 1 ? 'team1' : 'team2';
    if (!isSubstitutionPeriod) {
        toast({
            title: "Substitution Not Allowed",
            description: "Substitutions can only be made during a timeout or halftime.",
            variant: "destructive",
        });
        return;
    }
    if (substitutionsMadeThisBreak[teamKey] >= 2) {
      toast({
        title: "Substitution Limit Reached",
        description: "A team can only make 2 substitutions per break.",
        variant: "destructive",
      });
      return;
    }

    const currentTeams = JSON.parse(JSON.stringify(teams)) as [Team, Team];
    const team = currentTeams.find(t => t.id === teamId);
    if (!team) return;

    const playerIn = team.players.find(p => p.id === playerInId);
    const playerOut = team.players.find(p => p.id === playerOutId);

    if (!playerIn || !playerOut) return;
    
    // Additional check for red-carded players
    if (playerIn.isRedCarded || playerOut.isRedCarded) {
        toast({
            title: "Substitution Not Allowed",
            description: "A red-carded player cannot be part of a substitution.",
            variant: "destructive",
        });
        return;
    }

    const teamIndex = currentTeams.findIndex(t => t.id === teamId)!;
    const playerInIndex = currentTeams[teamIndex].players.findIndex(p => p.id === playerInId)!;
    const playerOutIndex = currentTeams[teamIndex].players.findIndex(p => p.id === playerOutId)!;

    currentTeams[teamIndex].players[playerInIndex].isPlaying = true;
    currentTeams[teamIndex].players[playerOutIndex].isPlaying = false;
    
    setTeams(currentTeams);
  
    setSubstitutionsMadeThisBreak(prev => ({
      ...prev,
      [teamKey]: prev[teamKey] + 1,
    }));

    toast({
      title: "Substitution Successful",
      description: `${playerIn.name} has been substituted in for ${playerOut.name}.`,
    });

  }, [teams, isSubstitutionPeriod, substitutionsMadeThisBreak, toast]);

  const handleIssueCard = useCallback((data: { teamId: number; playerId: number; cardType: 'green' | 'yellow' | 'red' }) => {
    let newTeams = JSON.parse(JSON.stringify(teams)) as [Team, Team];
    const { teamId, playerId, cardType } = data;

    const teamIndex = newTeams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) return;

    const playerIndex = newTeams[teamIndex].players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    const player = newTeams[teamIndex].players[playerIndex];
    const team = newTeams[teamIndex];
    const opposingTeamIndex = 1 - teamIndex;
    const opposingTeam = newTeams[opposingTeamIndex];
    let commentaryCardType: string = cardType;

    if (cardType === 'green') {
        player.greenCards += 1;
        if(player.greenCards > 1) { // Second green card becomes a yellow
            player.yellowCards += 1;
            opposingTeam.score += 1;
            player.suspensionTimer = 120;
            player.isPlaying = false;
            commentaryCardType = 'yellow'; // Upgrade for commentary
        }
    } else if (cardType === 'yellow') {
        player.yellowCards += 1;
        opposingTeam.score += 1;
        if (player.yellowCards > 1) { // Second yellow becomes a red
            player.isRedCarded = true;
            player.isPlaying = false;
            player.suspensionTimer = 0; // No timer, just out
            commentaryCardType = 'red'; // Upgrade for commentary
        } else {
            player.suspensionTimer = 120; // 2 minutes
            player.isPlaying = false;
        }
    } else if (cardType === 'red') {
        player.isRedCarded = true;
        player.isPlaying = false;
        opposingTeam.score += 1;
    }

    addCommentary({
        eventType: `${commentaryCardType}_card`,
        raidingTeam: team.name, // Team of the player getting carded
        defendingTeam: opposingTeam.name,
        raiderName: player.name, // Player getting carded
        points: 1, // Technical point
        team1Score: newTeams[0].score,
        team2Score: newTeams[1].score,
    });
    
    setTeams(newTeams);
  }, [teams, addCommentary]);

  const handleExportStats = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const [team1, team2] = teams;

    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFFFF" } }, fill: { fgColor: { rgb: "FFD32F2F" } }, alignment: { horizontal: "center", vertical: "center" } };
    const centeredStyle = { alignment: { horizontal: "center", vertical: "center" } };
    const border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };

    const summaryData = [
      [`${team1.name} vs ${team2.name} - Match Summary`],
      [],
      ["Final Score"],
      [`${team1.name}`, team1.score],
      [`${team2.name}`, team2.score],
      [],
      ["Result"],
      [team1.score > team2.score ? `${team1.name} Won` : team2.score > team1.score ? `${team2.name} Won` : "Match Drawn"]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, 
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }, 
      { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } }, 
      { s: { r: 7, c: 0 }, e: { r: 7, c: 1 } } 
    ];
    wsSummary['A1'].s = { font: { bold: true, sz: 16 }, alignment: { horizontal: "center" } };
    wsSummary['A3'].s = { font: { bold: true, sz: 14 } };
    wsSummary['A7'].s = { font: { bold: true, sz: 14 } };
    wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Match Summary");

    teams.forEach(team => {
        const teamDataForSheet = team.players.map(p => ({
            "Player Name": p.name,
            "Status": p.isRedCarded ? 'Red Card' : p.suspensionTimer > 0 ? `Suspended (${p.suspensionTimer}s)` : p.isPlaying ? 'Active' : 'Substitute',
            "Total Points": p.totalPoints,
            "Raid Points": p.raidPoints,
            "Bonus Points": p.bonusPoints,
            "Tackle Points": p.tacklePoints,
            "Super Tackles": p.superTacklePoints,
            "Total Raids": p.totalRaids,
            "Successful Raids": p.successfulRaids,
            "Success Rate (%)": p.totalRaids > 0 ? parseFloat(((p.successfulRaids / p.totalRaids) * 100).toFixed(2)) : 0,
            "Super Raids": p.superRaids,
            "Green Cards": p.greenCards,
            "Yellow Cards": p.yellowCards,
        }));

        const teamHeader = [
            [team.name],
            [],
            ["Coach:", team.coach, "", "City:", team.city, "", "Final Score:", team.score],
            []
        ];

        const ws = XLSX.utils.aoa_to_sheet(teamHeader, { origin: "A1" });
        XLSX.utils.sheet_add_json(ws, teamDataForSheet, { origin: "A5" });

        ws["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: teamDataForSheet[0] ? Object.keys(teamDataForSheet[0]).length - 1 : 10 } },
        ];
        
        ws['A1'].s = { font: { bold: true, sz: 16 }, alignment: { horizontal: "center" } };

        const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A5:K5');
        for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: 4, c: C });
            if (ws[cellAddress]) {
                ws[cellAddress].s = headerStyle;
            }
        }
        
        const dataRange = XLSX.utils.decode_range(ws['!ref'] || `A5:M${5 + team.players.length}`);
        for (let R = dataRange.s.r + 5; R <= dataRange.e.r; ++R) {
            for (let C = dataRange.s.c; C <= dataRange.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellAddress]) continue;
                
                ws[cellAddress].s = { ...ws[cellAddress].s, border };
                
                if (typeof ws[cellAddress].v === 'number' || (C > 0 && ws[cellAddress].v === 'Active') || (C > 0 && ws[cellAddress].v === 'Substitute')) {
                    ws[cellAddress].s = { ...ws[cellAddress].s, ...centeredStyle };
                }
            }
        }
        
        const colWidths = Object.keys(teamDataForSheet[0] || {}).map((key) => ({ 
            wch: Math.max(
                key.length, 
                ...teamDataForSheet.map(row => String(row[key as keyof typeof row]).length)
            ) + 2 
        }));
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, team.name.substring(0, 31));
    });
    
    const matchFileName = `${teams[0].name} vs ${teams[1].name} - Match Stats.xlsx`;
    XLSX.writeFile(wb, matchFileName);
  }, [teams]);

  const handleExportCommentary = useCallback(() => {
    const doc = new Document({
        sections: [{
            children: commentaryLog.slice().reverse().map(entry => 
                new Paragraph({
                    children: [new TextRun(entry)],
                    spacing: { after: 200 }
                })
            ),
        }],
    });

    Packer.toBlob(doc).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        a.download = `${teams[0].name} vs ${teams[1].name} - Commentary.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    });
}, [commentaryLog, teams]);

  return (
    <>
      <main className="min-h-screen bg-background text-foreground font-body">
        <div className="container mx-auto p-4 md:p-8">
          <header className="text-center mb-8">
            <h1 className="text-2xl font-headline font-bold text-primary">Kabaddi Score Master</h1>
            <p className="text-sm text-muted-foreground">The ultimate tool for managing Kabaddi matches.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
               <Scoreboard
                teams={teams}
                timer={timer}
                raidState={raidState}
                raidingTeamId={raidingTeamId}
                matchDuration={matchDuration}
                onToggleTimer={handleToggleTimer}
                onResetTimer={handleResetTimer}
                onTeamNameChange={handleTeamNameChange}
                onTeamCoachChange={handleTeamCoachChange}
                onTeamCityChange={handleTeamCityChange}
                onMatchDurationChange={handleMatchDurationChange}
                onTakeTimeout={handleTakeTimeout}
                isMatchPristine={isMatchPristine}
              />
               <LiveCommentary commentaryLog={commentaryLog} isLoading={isCommentaryLoading} onExportCommentary={handleExportCommentary} />
            </div>
            <div className="lg:col-span-1 space-y-8">
                <ScoringControls 
                  teams={teams} 
                  raidingTeamId={raidingTeamId}
                  onAddScore={handleAddScore} 
                  onEmptyRaid={handleEmptyRaid}
                  onSwitchRaidingTeam={switchRaidingTeam}
                  isTimerRunning={timer.isRunning}
                />
                <FoulPlay teams={teams} onIssueCard={handleIssueCard} isTimerRunning={timer.isRunning} />
            </div>
          </div>


          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PlayerStatsTable team={teams[0]} onPlayerNameChange={handlePlayerNameChange} onSubstitutePlayer={handleSubstitutePlayer} isSubstitutionAllowed={isSubstitutionPeriod} substitutionsMade={substitutionsMadeThisBreak.team1} />
              <PlayerStatsTable team={teams[1]} onPlayerNameChange={handlePlayerNameChange} onSubstitutePlayer={handleSubstitutePlayer} isSubstitutionAllowed={isSubstitutionPeriod} substitutionsMade={substitutionsMadeThisBreak.team2} />
          </div>
          <div className="mt-8 flex justify-center">
              <Button onClick={handleExportStats} size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Export Stats to Excel
              </Button>
          </div>
        </div>
      </main>
      <Toaster />
    </>
  );
}
