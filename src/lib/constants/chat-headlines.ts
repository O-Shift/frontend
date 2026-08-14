/**
 * List of hero headline messages displayed on the Agent Chat empty state.
 * One message is selected at random on every page load.
 *
 * You can add, edit, or remove any number of sentences here at any time.
 */
export const CHAT_HERO_HEADLINES: string[] = [
  'Ready to explore your market?',
  'What moves are your competitors making today?',
  'Ready to outmaneuver your market?',
  'Uncover the market signals your competitors missed.',
  'What competitive edge are you looking for?',
  'Where should we find your next growth angle?',
  'Ready to dissect your market landscape?',
  "Let's spot the opportunities before anyone else.",
  'What market intelligence can I unpack for you?',
  'Which competitor campaign are we breaking down?',
];

/**
 * Returns a randomly selected headline from the provided list.
 */
export function getRandomHeroHeadline(headlines: string[] = CHAT_HERO_HEADLINES): string {
  if (!headlines || headlines.length === 0) {
    return 'Ready to explore your market?';
  }
  const randomIndex = Math.floor(Math.random() * headlines.length);
  return headlines[randomIndex];
}
