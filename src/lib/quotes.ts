import { hashStr } from "./utils";

/** Motivational quotes for aspiring doctors — one picked deterministically per day. */
export const QUOTES: Array<{ text: string; by: string }> = [
  { text: "Dream is not what you see in sleep. Dream is the thing that does not let you sleep.", by: "A. P. J. Abdul Kalam" },
  { text: "Medicine is a science of uncertainty and an art of probability.", by: "William Osler" },
  { text: "The good physician treats the disease; the great physician treats the patient.", by: "William Osler" },
  { text: "Wherever the art of medicine is loved, there is also a love of humanity.", by: "Hippocrates" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", by: "Robert Collier" },
  { text: "It always seems impossible until it is done.", by: "Nelson Mandela" },
  { text: "The secret of getting ahead is getting started.", by: "Mark Twain" },
  { text: "Don't watch the clock; do what it does. Keep going.", by: "Sam Levenson" },
  { text: "Discipline is the bridge between goals and accomplishment.", by: "Jim Rohn" },
  { text: "The future depends on what you do today.", by: "Mahatma Gandhi" },
  { text: "You don't have to be extreme, just consistent.", by: "Unknown" },
  { text: "A year from now you will wish you had started today.", by: "Karen Lamb" },
  { text: "Hard work beats talent when talent doesn't work hard.", by: "Tim Notke" },
  { text: "The pain of discipline is far less than the pain of regret.", by: "Sarah Bombell" },
  { text: "Excellence is not an act, but a habit.", by: "Aristotle" },
  { text: "If you're going through hell, keep going.", by: "Winston Churchill" },
  { text: "Study while others are sleeping; work while others are loafing.", by: "William A. Ward" },
  { text: "There are no shortcuts to any place worth going.", by: "Beverly Sills" },
  { text: "Push yourself, because no one else is going to do it for you.", by: "Unknown" },
  { text: "Every champion was once a contender that refused to give up.", by: "Rocky Balboa" },
  { text: "The best way to predict your future is to create it.", by: "Abraham Lincoln" },
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", by: "Thomas Edison" },
  { text: "Your only limit is the one you set for yourself.", by: "Unknown" },
  { text: "Small daily improvements are the key to staggering long-term results.", by: "Unknown" },
  { text: "The stethoscope is earned, not given. Earn it daily.", by: "Ascent" },
  { text: "One chapter a day keeps the backlog away.", by: "Ascent" },
  { text: "Wearing a white coat starts with wearing out your desk chair.", by: "Ascent" },
  { text: "Lakhs will appear. The seat goes to the most consistent.", by: "Ascent" },
  { text: "Revise today what you learned yesterday. That is how ranks are made.", by: "Ascent" },
  { text: "Toppers don't study more days. They waste fewer.", by: "Ascent" },
];

export function quoteOfTheDay(dateStr?: string): { text: string; by: string } {
  const key = dateStr ?? new Date().toDateString();
  return QUOTES[hashStr(key) % QUOTES.length];
}
