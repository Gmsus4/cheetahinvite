import { birthdayCinemaTemplate } from './birthday-cinema';
import { birthdayElegantTemplate } from './birthday-elegant';
import { birthdayCowboyTemplate } from './birthday-cowboy';
import { birthdayGamerTemplate } from './birthday-gamer';
import { birthdayDinosaurTemplate } from './birthday-dinosaur';
import { birthdayConfettiTemplate } from './birthday-designs';
import { birthdayPastelTemplate } from './birthday-pastel';
import { birthdayNeonTemplate } from './birthday-neon';
import { birthdayDiscoTemplate } from './birthday-disco';
import { birthdaySpaceTemplate } from './birthday-space';

export const birthdayDesigns = [
  { template: birthdayCinemaTemplate, slug: 'cumpleanos-cine' },
  { template: birthdayElegantTemplate, slug: 'cumpleanos-elegante' },
  { template: birthdayCowboyTemplate, slug: 'cumpleanos-vaquero' },
  { template: birthdayGamerTemplate, slug: 'cumpleanos-gamer' },
  { template: birthdayDinosaurTemplate, slug: 'cumpleanos-dinosaurios' },
  { template: birthdayConfettiTemplate, slug: 'cumpleanos-confeti' },
  { template: birthdayPastelTemplate, slug: 'cumpleanos-globos-pastel' },
  { template: birthdayNeonTemplate, slug: 'cumpleanos-neon' },
  { template: birthdayDiscoTemplate, slug: 'cumpleanos-disco' },
  { template: birthdaySpaceTemplate, slug: 'cumpleanos-espacial' },
].filter(({ template }) => template.available);
