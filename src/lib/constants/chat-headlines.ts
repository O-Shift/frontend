/**
 * List of hero headline messages displayed on the Agent Chat empty state.
 * One message is selected at random on every page load.
 *
 * You can add, edit, or remove any number of sentences here at any time.
 */
export const CHAT_HERO_HEADLINES: string[] = [
  'So, what’s happening out there?',
  'Let’s see what’s going on.',
  'What’s worth a closer look?',
  'Let’s connect a few dots.',
  'Anything interesting on the horizon?',
  'Let’s get the lay of the land.',
  'What’s the word?',
  'Let’s see what’s brewing.',
  'Anything catch your eye?',
  'What’s on the radar?',
  'Let’s dig a little deeper.',
  'What’s the bigger picture?',
  'Let’s see what turns up.',
  'What’s the story here?',
  'Let’s follow the breadcrumbs.',
  'What’s hiding in plain sight?',
  'Let’s put the pieces together.',
  'Well, this is interesting.',
  'Let’s get to the interesting part.',
  'What’s worth knowing?',
  'Let’s have a look around.',
  'Anything worth digging into?',
  'Let’s see what’s taking shape.',
  'What’s making noise?',
  'Let’s get a read on things.',
  'A little digging never hurts.',
  'Let’s see where this goes.',
  'Things are looking interesting.',
  'Let’s get to the point.',
  'What have we got?',
  'What\'s cooking gng?'
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
