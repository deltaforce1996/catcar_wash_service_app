export const parseKeyValueOnly = <K extends string>(
  query: string,
  allowed: readonly K[],
): { key: K; value: string }[] => {
  if (!query?.trim()) return [];

  const normalized = query.replace(/:\s*\{([^}]*)\}/g, (_m, v) => `:"${String(v).trim()}"`);

  const set = new Set(allowed.map((k) => k.toLowerCase()));
  const re = /([A-Za-z_][A-Za-z0-9_.]*)\s*:\s*(?:"([^"]*?)"|'([^']*?)'|([^\s"']+))/g;

  const out: { key: K; value: string }[] = [];
  for (const m of normalized.matchAll(re)) {
    const rawKey = m[1].toLowerCase();
    if (!set.has(rawKey)) continue;

    const value = (m[2] ?? m[3] ?? m[4] ?? '').trim();
    if (value === '') continue;

    out.push({ key: rawKey as K, value });
  }
  return out;
};
