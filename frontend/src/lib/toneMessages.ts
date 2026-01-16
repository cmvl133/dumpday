import i18n from '@/i18n';
import type { ReminderTone } from '@/types';

export type { ReminderTone };

export function getToneName(tone: ReminderTone): string {
  return i18n.t(`tones.${tone}.name`);
}

export function getRandomReminderMessage(tone: ReminderTone, taskTitle: string): string {
  const reminders = i18n.t(`tones.${tone}.reminders`, { returnObjects: true }) as string[];
  const template = reminders[Math.floor(Math.random() * reminders.length)];
  return template.replace('{{task}}', taskTitle);
}

export function getRandomComboMessage(tone: ReminderTone): string {
  const combos = i18n.t(`tones.${tone}.combo`, { returnObjects: true }) as string[];
  return combos[Math.floor(Math.random() * combos.length)];
}
