export type ReminderTone = 'gentle' | 'normal' | 'aggressive' | 'vulgar' | 'bigpoppapump';

export const TONE_MESSAGES: Record<ReminderTone, { reminder: string[]; combo: string[] }> = {
  gentle: {
    reminder: [
      'Hej, pamietasz o tym zadaniu?',
      'Moze teraz bylby dobry moment na to zadanie?',
      'Delikatne przypomnienie o zadaniu',
      'Kiedy bedziesz gotowy/a - czeka na Ciebie zadanie',
      'Maly reminder - masz cos do zrobienia',
    ],
    combo: [
      'Swietnie Ci idzie!',
      'Jeden krok za drugim',
      'Robisz postepy!',
      'Tak trzymaj!',
      'Dobrze Ci idzie!',
      'Jestes na dobrej drodze!',
    ],
  },
  normal: {
    reminder: [
      'Czas na zadanie!',
      'Przypomnienie o zadaniu',
      'Nie zapomnij o tym!',
      'Do zrobienia:',
      'Masz zadanie do ogarniecia',
    ],
    combo: [
      'Ogarniasz!',
      'Niezle leci!',
      'Focus mode: ON',
      'Jeszcze troche!',
      'Maszyna!',
      'Kto Cie dzis zatrzyma?',
      'Produktywnosc 100%',
    ],
  },
  aggressive: {
    reminder: [
      'RUSZ SIE! Masz zadanie do zrobienia!',
      'To zadanie samo sie nie zrobi!',
      'TERAZ! Nie pozniej!',
      'Przestan odkladac!',
      'OGAR SIE! Task czeka!',
      'Zero wymowek - do roboty!',
    ],
    combo: [
      'MASZYNA!',
      'KTO CIE DZIS ZATRZYMA?!',
      'NIE DO ZATRZYMANIA!',
      'ROZPIERDALASZ TE LISTE!',
      'ADHD? Jaki ADHD?!',
      'FULL POWER MODE!',
    ],
  },
  vulgar: {
    reminder: [
      'Kurwa, ogar sie! Masz robote!',
      'Hej zjebany/a, zadanie czeka!',
      'Rusz dupe, prokrastynatorze!',
      'Chuj ci w oko jesli tego nie zrobisz!',
      'Kurwa mac, ogarniaj sie!',
      'Jebac lenistwo - do roboty!',
    ],
    combo: [
      'No kurwa, ogarniasz!',
      'Jebiesz te liste!',
      'Zajebisty/a jestes!',
      'Pierdolisz te taski jak zawodowiec!',
      'Kurwa, ale machasz!',
      'Jebanko mode: ON!',
    ],
  },
  bigpoppapump: {
    reminder: [
      'HEY! GIMME A MIC! You got a task to do, fatass!',
      'Big Poppa Pump says: DO YOUR DAMN TASK!',
      "You got a 141 2/3% chance of forgetting this task! Don't be a FATASS!",
      'HOLLA IF YA HEAR ME! Task time, freak!',
      "Big Poppa Pump is your hookup - now HOOK UP with this task!",
      "You're looking at the TASK MASTER! Now do your task!",
    ],
    combo: [
      "I'M YOUR HOOK UP! HOLLA IF YA HEAR ME!",
      'BIG POPPA PUMP IS YOUR HOOKUP!',
      "YOU'RE A GENETIC FREAK! AND YOU'RE NOT NORMAL!",
      "THE NUMBERS DON'T LIE!",
      'GIMME A FUCKIN MIC!',
      'I GOT NO SYMPY FOR YOU!',
      'HOLLA! HOLLA! HOLLA!',
      "HE'S FAT!",
      "YOU KNOW THEY SAY ALL TASKS ARE CREATED EQUAL...",
    ],
  },
};

export const TONE_LABELS: Record<ReminderTone, string> = {
  gentle: 'Delikatny',
  normal: 'Normalny',
  aggressive: 'Agresywny',
  vulgar: 'Wulgarny',
  bigpoppapump: 'Big Poppa Pump',
};

export function getRandomMessage(tone: ReminderTone, type: 'reminder' | 'combo'): string {
  const messages = TONE_MESSAGES[tone][type];
  return messages[Math.floor(Math.random() * messages.length)];
}
