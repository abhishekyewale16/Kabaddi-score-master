# App Briefing: Kabaddi Score Master

## 1. High-Level Goal

The **Kabaddi Score Master** is a comprehensive, web-based scoring and management tool designed for live Kabaddi matches. It provides a single interface for a match official to track scores, manage the game clock, record player statistics, handle disciplinary actions, and generate live, AI-powered commentary. The application is built for ease of use during a fast-paced game and provides detailed post-match exports for analysis.

---

## 2. Core Features & Functionality

### a. Scoreboard & Timer Management
- **Live Score Tracking:** Real-time display of scores for two competing teams.
- **Match Timer:** A countdown timer for each half of the match (e.g., 20 minutes).
- **Timer Controls:** Functionality to Start, Pause, and Resume the match clock.
- **Half Management:** The app tracks the first and second halves of the game.
- **Timeouts:** Each team can take a set number of timeouts, which pauses the game clock. The app tracks remaining timeouts.
- **End of Match:** A mechanism to formally end the match after the final raid is complete when time runs out.
- **Reset Functionality:** A full reset button to clear all match data and start a new game.

### b. Team & Player Management
- **Editable Team Details:** Users can edit the Name, Coach Name, and City for each team directly on the scoreboard.
- **Player Roster:** Each team has a roster of 12 players, with 7 "active" (on the mat) and 5 "substitutes" (on the bench) at the start.
- **Editable Player Names:** Player names can be edited directly within their respective team's statistics table.
- **Captain Selection:** Users can designate one player from each team as the captain via a star icon in the player table.
- **Substitutions:** During timeouts or halftime, users can substitute an active player with a benched player. The app enforces a substitution limit per break.

### c. Scoring & Game Events
- **Raid & Tackle Points:** A dedicated scoring modal to award points for successful raids (1+ points) and tackles (1 point, or 2 for a Super Tackle).
- **Bonus Points:** The system correctly identifies when a bonus point is possible (6 or more defenders on the mat) and allows it to be awarded.
- **Elimination Tracking:** When points are scored, the user selects which opposing players were eliminated ("out"). These players are marked as out.
- **"All Out" (Lona):** The system automatically detects when all active players on a team are out, awards 2 bonus points to the opposing team, and revives all players on the "All Out" team.
- **Empty Raids:** A button to declare an "empty raid" (no points scored). The app tracks consecutive empty raids.
- **"Do or Die" Raids:** After two consecutive empty raids by a team, the third raid is a "Do or Die" raid. If the raider fails to score, they are eliminated, and the defending team gets a point. The app automates this logic.
- **Line Out:** A point can be awarded to the defending team if a raider steps out of bounds.

### d. Foul Play & Disciplinary Cards
- **Card System:** An interface to issue Green, Yellow, and Red cards to players for fouls.
- **Card Consequences:**
  - **Green Card:** A warning. A second Green Card to the same player automatically results in a Yellow Card.
  - **Yellow Card:** 2-minute temporary suspension for the player and 1 technical point to the opposition. A second Yellow Card results in a Red Card.
  - **Red Card:** Player is removed for the rest of the match and 1 technical point is awarded to the opposition. Red-carded players cannot be substituted.
- **Suspension Timer:** Suspended players have a visible 2-minute countdown timer and are automatically made available to play when it expires.

### e. AI-Powered Live Commentary
- **Real-Time Generation:** Using Genkit and Google's Gemini AI, the app generates exciting, context-aware commentary for every significant match event (e.g., score, empty raid, card, All Out).
- **Context-Awareness:** The AI prompt includes current scores, team names, player names, recent commentary history, and event-specific details (like "Super Raid" or "Do or Die") to generate relevant and engaging text.
- **Robust Error Handling:** The system includes retry logic with exponential backoff for API calls and gracefully handles rate-limiting errors by notifying the user.

### f. Post-Match & Data Export
- **Winner Declaration:** A pop-up modal appears at the end of the match, celebrating the winning team (or declaring a draw) with their name, coach, and captain.
- **Export to Excel:** Users can download a comprehensive Excel spreadsheet containing:
  - A match summary sheet with final scores.
  - Detailed player-by-player statistics for both teams.
  - A timeline of key events like timeouts and substitutions.
- **Export Commentary:** The entire live commentary log can be exported as a formatted Microsoft Word (`.docx`) document.

### g. State Persistence
- **Local Storage:** The entire match state (scores, timer, teams, players, commentary log, etc.) is saved to the browser's `localStorage`. This prevents data loss if the user accidentally closes the tab or refreshes the page, allowing them to resume the match seamlessly.

---

## 3. Key Components & Architecture

- **`page.tsx` (Main Component):** The central hub of the application. It holds the entire application state (`teams`, `timer`, `commentaryLog`, etc.) and contains all the core logic and handler functions (`handleAddScore`, `handleEmptyRaid`, `handleIssueCard`, etc.). It passes down state and functions as props to child components.
- **`Scoreboard.tsx`:** A presentational component that displays team names, scores, the match timer, and controls for the timer.
- **`ScoringControls.tsx`:** Contains the forms and dialogs for adding all types of scoring events. It captures user input and calls the appropriate handler function from `page.tsx`.
- **`PlayerStatsTable.tsx`:** Renders the detailed statistics for one team's roster. It handles UI for player name changes, substitutions, and captain selection.
- **`FoulPlay.tsx`:** The component containing the UI (dialog and form) for issuing disciplinary cards.
- **`LiveCommentary.tsx`:** Displays the scrolling log of AI-generated commentary and includes the export button.
- **`MatchResult.tsx`:** The dialog component that appears at the end of the match to announce the winner.
- **`generate-commentary.ts` (AI Flow):** A server-side Genkit flow that defines the prompt and logic for interacting with the Gemini AI model to generate commentary.
- **`types.ts` & `data.ts`:** These files define the core data structures (`Team`, `Player`) and provide the initial state for a new match.

---

## 4. Technology Stack

- **Framework:** Next.js with React (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with ShadCN UI components for a consistent and modern look and feel.
- **AI/Generative:** Genkit with the `googleai` plugin (Gemini model).
- **Data Export:**
  - `xlsx` library for creating Excel files.
  - `docx` library for creating Microsoft Word files.
- **State Management:** React Hooks (`useState`, `useEffect`, `useCallback`) combined with prop drilling. `localStorage` for persistence.
- **UI/UX:** Framer Motion for subtle animations in the commentary feed.

