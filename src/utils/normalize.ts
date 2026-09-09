const GENDER_ALIASES_MALE = new Set(['m', 'male', '♂', 'mannlich', 'männlich']);
const GENDER_ALIASES_FEMALE = new Set(['f', 'w', 'female', 'weiblich', '♀']);

function resolveNidoranAlias(input: string): string {
  const lower = input.toLowerCase().trim();
  if (!lower.startsWith('nidoran')) return input;
  const rest = lower.slice('nidoran'.length).replace(/^[\s-]+/, '');
  if (GENDER_ALIASES_MALE.has(rest)) return 'nidoran♂';
  if (GENDER_ALIASES_FEMALE.has(rest)) return 'nidoran♀';
  return input;
}

export function normalizeName(raw: string): string {
  let s = resolveNidoranAlias(raw);
  s = s.replace(/♀/g, 'f').replace(/♂/g, 'm').toLowerCase();
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return s.replace(/[^a-z0-9]/g, '');
}
