// One entry per specialty the app knows about: an Ionicons name + a soft
// tint pair (bg for chip/card backdrops, fg for icon/text on that tint).
// Mirrors web/lib/specialties.js — falls back to a neutral sand tint +
// medkit icon for anything unlisted.

export const SPECIALTIES = {
  Cardiologist: { icon: 'pulse', bg: '#FBE6DE', fg: '#B4432B' },
  Dermatologist: { icon: 'water', bg: '#FBE3EC', fg: '#A23D68' },
  Neurologist: { icon: 'flash', bg: '#EDE6FB', fg: '#5B3FA0' },
  Orthopedics: { icon: 'walk', bg: '#F3E9D6', fg: '#8A6A2C' },
  Gynecologist: { icon: 'female', bg: '#F6E1EE', fg: '#9C3E76' },
  Pediatric: { icon: 'happy', bg: '#E1EEFB', fg: '#2E6CA0' },
  Dentist: { icon: 'medical', bg: '#DCEEE8', fg: '#0E6B58' },
  Consultation: { icon: 'medkit', bg: '#EFECE2', fg: '#5B655F' },
  Psychiatry: { icon: 'body', bg: '#E6EFFB', fg: '#33608A' },
  ENT: { icon: 'ear', bg: '#FDEDE0', fg: '#B5601F' },
  Ophthalmology: { icon: 'eye', bg: '#E3F3EE', fg: '#1F7A5C' },
  Nutrition: { icon: 'nutrition', bg: '#EAF3DC', fg: '#557A1F' },
};

const FALLBACK = { icon: 'medkit', bg: '#EFECE2', fg: '#5B655F' };

export function getSpecialtyStyle(specialty) {
  return SPECIALTIES[specialty] || FALLBACK;
}
