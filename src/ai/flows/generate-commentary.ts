
'use server';
/**
 * @fileOverview A flow for generating live Kabaddi match commentary.
 *
 * - generateCommentary - A function that takes event details and returns a commentary string.
 * - GenerateCommentaryInput - The input type for the generateCommentary function.
 * - GenerateCommentaryOutput - The return type for the generateCommentary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCommentaryInputSchema = z.object({
  eventType: z.enum(['raid_score', 'tackle_score', 'super_tackle_score', 'empty_raid', 'line_out', 'do_or_die_fail', 'green_card', 'yellow_card', 'red_card', 'technical_point']).describe("The type of event that occurred."),
  raidingTeam: z.string().describe("The name of the raiding team, or the team of the player who committed the foul."),
  defendingTeam: z.string().describe("The name of the defending team, or the opposing team."),
  raiderName: z.string().describe("The name of the raider, or the player who committed the foul."),
  defenderName: z.string().optional().describe("The name of the defender, if applicable."),
  points: z.number().describe("The number of points scored in the event."),
  isSuperRaid: z.boolean().optional().describe("Whether the raid was a super raid."),
  isDoOrDie: z.boolean().optional().describe("Whether the raid was a do-or-die raid."),
  isBonus: z.boolean().optional().describe("Whether a bonus point was scored."),
  isLona: z.boolean().optional().describe("Whether a Lona was scored."),
  commentaryHistory: z.array(z.string()).optional().describe('A brief history of the last few commentary snippets to maintain context.'),
  team1Score: z.number().describe("The score of team 1."),
  team2Score: z.number().describe("The score of team 2."),
  raidCount: z.number().optional().describe("The current consecutive empty raid count for the raiding team."),
});
export type GenerateCommentaryInput = z.infer<typeof GenerateCommentaryInputSchema>;

const GenerateCommentaryOutputSchema = z.object({
  commentary: z.string().describe('The generated commentary for the event.'),
});
export type GenerateCommentaryOutput = z.infer<typeof GenerateCommentaryOutputSchema>;

export async function generateCommentary(input: GenerateCommentaryInput): Promise<GenerateCommentaryOutput> {
  return generateCommentaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCommentaryPrompt',
  input: {schema: GenerateCommentaryInputSchema},
  output: {schema: GenerateCommentaryOutputSchema},
  prompt: `You are an expert, high-energy Kabaddi commentator. Your job is to provide exciting, concise commentary for live match events. Keep it short and punchy, like a real-time update. Use the provided context to make your commentary more descriptive.

  Match Context:
  - Current Score: {{team1Score}} - {{team2Score}}
  {{#if raidCount}}
  - Current Empty Raids for {{raidingTeam}}: {{raidCount}}
  {{/if}}
  - Last few commentary lines for context:
    {{#if commentaryHistory}}
    {{#each commentaryHistory}}
    - {{this}}
    {{/each}}
    {{else}}
    - The match is just getting started!
    {{/if}}

  Now, generate the commentary for the following event:

  {{#if is_green_card}}
  A Green Card has been shown to {{raiderName}} of {{raidingTeam}}! That's a final warning for the player.
  {{/if}}
  {{#if is_yellow_card}}
  It's a Yellow Card for {{raiderName}} from {{raidingTeam}}! That's a technical point to {{defendingTeam}} and a two-minute suspension for the player. This could be costly!
  {{/if}}
  {{#if is_red_card}}
  RED CARD! {{raiderName}} of {{raidingTeam}} has been sent off for the rest of the match! A technical point is awarded to {{defendingTeam}}. A huge blow for {{raidingTeam}}!
  {{/if}}
  {{#if is_technical_point}}
  A technical point has been awarded to {{raidingTeam}}!
  {{/if}}
  {{#if is_other_event}}
  Event Type: {{eventType}}
  Raiding Team: {{raidingTeam}}
  Raider: {{raiderName}}
  Defending Team: {{defendingTeam}}
  {{#if defenderName}}
  Defender: {{defenderName}}
  {{/if}}
  Points Scored: {{points}}
  {{#if isBonus}}
  A bonus point was scored!
  {{/if}}
  {{#if isSuperRaid}}
  This was a SUPER RAID!
  {{/if}}
  {{#if isDoOrDie}}
  This was a DO OR DIE raid!
  {{/if}}
  {{#if isLona}}
  This resulted in a LONA!
  {{/if}}
  {{/if}}

  Based on all this information, generate a single, exciting commentary line.
  `,
});

const generateCommentaryFlow = ai.defineFlow(
  {
    name: 'generateCommentaryFlow',
    inputSchema: GenerateCommentaryInputSchema,
    outputSchema: GenerateCommentaryOutputSchema,
  },
  async (input) => {
    const processedInput = {
      ...input,
      is_green_card: input.eventType === 'green_card',
      is_yellow_card: input.eventType === 'yellow_card',
      is_red_card: input.eventType === 'red_card',
      is_technical_point: input.eventType === 'technical_point',
      is_other_event: !['green_card', 'yellow_card', 'red_card', 'technical_point'].includes(input.eventType),
    };

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const {output} = await prompt(processedInput);
        return output!;
      } catch (error: any) {
        attempts++;
        if (error.message.includes('503') && attempts < maxAttempts) {
          // Wait for a short period before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        } else {
          // If it's not a 503 error or we've run out of attempts, rethrow the error.
          throw error;
        }
      }
    }
    // This line should not be reached, but is here for type safety.
    throw new Error('Failed to generate commentary after multiple attempts.');
  }
);

    