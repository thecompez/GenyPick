export type Team = {
  id: number;
  name: string;
  code: string;
};

export const WORLD_CUP_2026_TEAMS: Team[] = [
  { id: 1, name: "Argentina", code: "AR" },
  { id: 2, name: "Algeria", code: "DZ" },
  { id: 3, name: "Australia", code: "AU" },
  { id: 4, name: "Austria", code: "AT" },
  { id: 5, name: "Belgium", code: "BE" },
  { id: 6, name: "Bosnia and Herzegovina", code: "BA" },
  { id: 7, name: "Brazil", code: "BR" },
  { id: 8, name: "Canada", code: "CA" },
  { id: 9, name: "Cape Verde", code: "CV" },
  { id: 10, name: "Colombia", code: "CO" },
  { id: 11, name: "Croatia", code: "HR" },
  { id: 12, name: "Curaçao", code: "CW" },
  { id: 13, name: "Czechia", code: "CZ" },
  { id: 14, name: "DR Congo", code: "CD" },
  { id: 15, name: "Ecuador", code: "EC" },
  { id: 16, name: "Egypt", code: "EG" },
  { id: 17, name: "England", code: "GB-ENG" },
  { id: 18, name: "France", code: "FR" },
  { id: 19, name: "Germany", code: "DE" },
  { id: 20, name: "Ghana", code: "GH" },
  { id: 21, name: "Haiti", code: "HT" },
  { id: 22, name: "Iran", code: "IR" },
  { id: 23, name: "Iraq", code: "IQ" },
  { id: 24, name: "Ivory Coast", code: "CI" },
  { id: 25, name: "Japan", code: "JP" },
  { id: 26, name: "Jordan", code: "JO" },
  { id: 27, name: "Mexico", code: "MX" },
  { id: 28, name: "Morocco", code: "MA" },
  { id: 29, name: "Netherlands", code: "NL" },
  { id: 30, name: "New Zealand", code: "NZ" },
  { id: 31, name: "Norway", code: "NO" },
  { id: 32, name: "Panama", code: "PA" },
  { id: 33, name: "Paraguay", code: "PY" },
  { id: 34, name: "Portugal", code: "PT" },
  { id: 35, name: "Qatar", code: "QA" },
  { id: 36, name: "Saudi Arabia", code: "SA" },
  { id: 37, name: "Scotland", code: "GB-SCT" },
  { id: 38, name: "Senegal", code: "SN" },
  { id: 39, name: "South Africa", code: "ZA" },
  { id: 40, name: "South Korea", code: "KR" },
  { id: 41, name: "Spain", code: "ES" },
  { id: 42, name: "Sweden", code: "SE" },
  { id: 43, name: "Switzerland", code: "CH" },
  { id: 44, name: "Tunisia", code: "TN" },
  { id: 45, name: "Turkey", code: "TR" },
  { id: 46, name: "United States", code: "US" },
  { id: 47, name: "Uruguay", code: "UY" },
  { id: 48, name: "Uzbekistan", code: "UZ" }
];

export function getTeamById(id: number): Team | undefined {
  return WORLD_CUP_2026_TEAMS.find((team) => team.id === id);
}

export function getTeamName(id: number): string {
  return getTeamById(id)?.name ?? `Team #${id}`;
}

export function getFlagLabel(code: string): string {
  if (code === "GB-ENG") return "ENG";
  if (code === "GB-SCT") return "SCT";
  if (!/^[A-Z]{2}$/.test(code)) return code;
  const base = 127397;
  return String.fromCodePoint(...[...code].map((char) => char.charCodeAt(0) + base));
}
