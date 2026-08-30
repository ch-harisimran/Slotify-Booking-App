import {
  IconHeartPulse, IconDroplet, IconBrain, IconBone, IconVenus, IconBabyBottle,
  IconTooth, IconStethoscope, IconHeadThought, IconEar, IconEye, IconApple,
} from '../components/icons';

// One entry per specialty the app knows about: an icon + a soft tint pair
// (bg for chips/card backdrops, fg for icon/text on that tint). Falls back
// to a neutral sand tint + stethoscope for anything unlisted.
export const SPECIALTIES = {
  Cardiologist: { icon: IconHeartPulse, bg: '#FBE6DE', fg: '#B4432B' },
  Dermatologist: { icon: IconDroplet, bg: '#FBE3EC', fg: '#A23D68' },
  Neurologist: { icon: IconBrain, bg: '#EDE6FB', fg: '#5B3FA0' },
  Orthopedics: { icon: IconBone, bg: '#F3E9D6', fg: '#8A6A2C' },
  Gynecologist: { icon: IconVenus, bg: '#F6E1EE', fg: '#9C3E76' },
  Pediatric: { icon: IconBabyBottle, bg: '#E1EEFB', fg: '#2E6CA0' },
  Dentist: { icon: IconTooth, bg: '#DCEEE8', fg: '#0E6B58' },
  Consultation: { icon: IconStethoscope, bg: '#EFECE2', fg: '#5B655F' },
  Psychiatry: { icon: IconHeadThought, bg: '#E6EFFB', fg: '#33608A' },
  ENT: { icon: IconEar, bg: '#FDEDE0', fg: '#B5601F' },
  Ophthalmology: { icon: IconEye, bg: '#E3F3EE', fg: '#1F7A5C' },
  Nutrition: { icon: IconApple, bg: '#EAF3DC', fg: '#557A1F' },
};

const FALLBACK = { icon: IconStethoscope, bg: '#EFECE2', fg: '#5B655F' };

export function getSpecialtyStyle(specialty) {
  return SPECIALTIES[specialty] || FALLBACK;
}
