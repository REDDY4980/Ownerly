// @ts-nocheck
import { groq } from '@ai-sdk/groq';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import teamsData from '@/lib/teams.json';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    messages,
    system: `You are Antigravity, a professional AI Engineer assistant. 
You help users write professional emails and resolve team identities.
Use the \`resolveIdentity\` tool to find email addresses for a given team.
Use the \`draftEmail\` tool to write a professional email based on user directives.

IMPORTANT PROCESS TO FOLLOW:
1. When a user asks you to email a team, FIRST use \`resolveIdentity\` to get their emails.
2. Then, use \`draftEmail\` to draft the content.
3. Finally, report back the drafted email and the recipients clearly.`,
    tools: {
      resolveIdentity: tool({
        description: 'Read from the local database to find recipient email addresses for a given team name.',
        parameters: z.object({
          teamName: z.string().describe('The name of the team to lookup, e.g., "Team 1", "Team 2", etc.')
        }),
        execute: async ({ teamName }: { teamName: string }): Promise<any> => {
          const validTeams = Object.keys(teamsData);
          const formattedName = validTeams.find(t => t.toLowerCase() === teamName.toLowerCase());
          
          if (!formattedName) {
            return { error: `Team "${teamName}" not found. Available teams: ${validTeams.join(', ')}` };
          }
          
          return {
            team: formattedName,
            recipients: teamsData[formattedName as keyof typeof teamsData]
          };
        },
      }),
      draftEmail: tool({
        description: 'Generate a professional email based on the given directive and recipient context.',
        parameters: z.object({
          subject: z.string().describe('A professional subject line for the email.'),
          body: z.string().describe('The main content of the email, written in a professional tone.'),
        }),
        execute: async ({ subject, body }: { subject: string, body: string }): Promise<any> => {
          // This tool mocks the drafting or saving process
          // and returns the structured drafted email ready for the UI
          return {
            status: "draft_complete",
            subject,
            body
          };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
