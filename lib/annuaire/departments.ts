/**
 * Référentiel département → région pour l'annuaire externe.
 * Source : INSEE — codes officiels géographiques 2024.
 */

export interface DepartmentInfo {
  code: string;       // '75', '2A', '971'
  name: string;       // 'Paris', 'Corse-du-Sud', 'Guadeloupe'
  regionCode: string; // '11', '94', '01'
  regionName: string;
  regionSlug: string;
}

export const DEPARTMENTS: Record<string, DepartmentInfo> = {
  '01': { code: '01', name: 'Ain', regionCode: '84', regionName: 'Auvergne-Rhône-Alpes', regionSlug: 'auvergne-rhone-alpes' },
  '02': { code: '02', name: 'Aisne', regionCode: '32', regionName: 'Hauts-de-France', regionSlug: 'hauts-de-france' },
  '03': { code: '03', name: 'Allier', regionCode: '84', regionName: 'Auvergne-Rhône-Alpes', regionSlug: 'auvergne-rhone-alpes' },
  '04': { code: '04', name: 'Alpes-de-Haute-Provence', regionCode: '93', regionName: 'Provence-Alpes-Côte d\'Azur', regionSlug: 'provence-alpes-cote-dazur' },
  '05': { code: '05', name: 'Hautes-Alpes', regionCode: '93', regionName: 'Provence-Alpes-Côte d\'Azur', regionSlug: 'provence-alpes-cote-dazur' },
  '06': { code: '06', name: 'Alpes-Maritimes', regionCode: '93', regionName: 'Provence-Alpes-Côte d\'Azur', regionSlug: 'provence-alpes-cote-dazur' },
  '07': { code: '07', name: 'Ardèche', regionCode: '84', regionName: 'Auvergne-Rhône-Alpes', regionSlug: 'auvergne-rhone-alpes' },
  '08': { code: '08', name: 'Ardennes', regionCode: '44', regionName: 'Grand Est', regionSlug: 'grand-est' },
  '09': { code: '09', name: 'Ariège', regionCode: '76', regionName: 'Occitanie', regionSlug: 'occitanie' },
  '10': { code: '10', name: 'Aube', regionCode: '44', regionName: 'Grand Est', regionSlug: 'grand-est' },
  '11': { code: '11', name: 'Aude', regionCode: '76', regionName: 'Occitanie', regionSlug: 'occitanie' },
  '12': { code: '12', name: 'Aveyron', regionCode: '76', regionName: 'Occitanie', regionSlug: 'occitanie' },
  '13': { code: '13', name: 'Bouches-du-Rhône', regionCode: '93', regionName: 'Provence-Alpes-Côte d\'Azur', regionSlug: 'provence-alpes-cote-dazur' },
  '14': { code: '14', name: 'Calvados', regionCode: '28', regionName: 'Normandie', regionSlug: 'normandie' },
  '15': { code: '15', name: 'Cantal', regionCode: '84', regionName: 'Auvergne-Rhône-Alpes', regionSlug: 'auvergne-rhone-alpes' },
  '16': { code: '16', name: 'Charente', regionCode: '75', regionName: 'Nouvelle-Aquitaine', regionSlug: 'nouvelle-aquitaine' },
  '17': { code: '17', name: 'Charente-Maritime', regionCode: '75', regionName: 'Nouvelle-Aquitaine', regionSlug: 'nouvelle-aquitaine' },
  '18': { code: '18', name: 'Cher', regionCode: '24', regionName: 'Centre-Val de Loire', regionSlug: 'centre-val-de-loire' },
  '19': { code: '19', name: 'Corrèze', regionCode: '75', regionName: 'Nouvelle-Aquitaine', regionSlug: 'nouvelle-aquitaine' },
  '2A': { code: '2A', name: 'Corse-du-Sud', regionCode: '94', regionName: 'Corse', regionSlug: 'corse' },
  '2B': { code: '2B', name: 'Haute-Corse', regionCode: '94', regionName: 'Corse', regionSlug: 'corse' },
  '21': { code: '21', name: 'Côte-d\'Or', regionCode: '27', regionName: 'Bourgogne-Franche-Comté', regionSlug: 'bourgogne-franche-comte' },
  '22': { code: '22', name: 'Côtes-d\'Armor', regionCode: '53', regionName: 'Bretagne', regionSlug: 'bretagne' },
  '23': { code: '23', name: 'Creuse', regionCode: '75', regionName: 'Nouvelle-Aquitaine', regionSlug: 'nouvelle-aquitaine' },
  '24': { code: '24', name: 'Dordogne', regionCode: '75', regionName: 'Nouvelle-Aquitaine', regionSlug: 'nouvelle-aquitaine' },
  '25': { code: '25', name: 'Doubs', regionCode: '27', regionName: 'Bourgogne-Franche-Comté', regionSlug: 'bourgogne-franche-comte' },
  '26': { code: '26', name: 'Drôme', regionCode: '84', regionName: 'Auvergne-Rhône-Alpes', regionSlug: 'auvergne-rhone-alpes' },
  '27': { code: '27', name: 'Eure', regionCode: '28', regionName: 'Normandie', regionSlug: 'normandie' },
  '28': { code: '28', name: 'Eure-et-Loir', regionCode: '24', regionName: 'Centre-Val de Loire', regionSlug: 'centre-val-de-loire' },
  '29': { code: '29', name: 'Finistère', regionCode: '53', regionName: 'Bretagne', regionSlug: 'bretagne' },
  '30': { code: '30', name: 'Gard', regionCode: '76', regionName: 'Occitanie', regionSlug: 'occitanie' },
  '31': { code: '31', name: 'Haute-Garonne', regionCode: '76', regionName: 'Occitanie', regionSlug: 'occitanie' },
  '32': { code: '32', name: 'Gers', regionCode: '76', regionName: 'Occitanie', regionSlug: 'occitanie' },
  '33': { code: '33', name: 'Gironde', regionCode: '75', regionName: 'Nouvelle-Aquitaine', regionSlug: 'nouvelle-aquitaine' },
  '34': { code: '34', name: 'Hérault', regionCode: '76', regionName: 'Occitanie', regionSlug: 'occitanie' },
  '35': { code: '35', name: 'Ille-et-Vilaine', regionCode: '53', regionName: 'Bretagne', regionSlug: 'bretagne' },
  '36': { code: '36', name: 'Indre', regionCode: '24', regionName: 'Centre-Val de Loire', regionSlug: 'centre-val-de-loire' },
  '37': { code: '37', name: 'Indre-et-Loire', regionCode: '24', regionName: 'Centre-Val de Loire', regionSlug: 'centre-val-de-loire' },
  '38': { code: '38', name: 'Isère', regionCode: '84', regionName: 'Auvergne-Rhône-Alpes', regionSlug: 'auvergne-rhone-alpes' },
  '39': { code: '39', name: 'Jura', regionCode: '27', regionName: 'Bourgogne-Franche-Comté', regionSlug: 'bourgogne-franche-comte' },
  '40': { code: '40', name: 'Landes', regionCode: '75', regionName: 'Nouvelle-Aquitaine', regionSlug: 'nouvelle-aquitaine' },
  '41': { code: '41', name: 'Loir-et-Cher', regionCode: '24', regionName: 'Centre-Val de Loire', regionSlug: 'centre-val-de-loire' },
  '42': { code: '42', name: 'Loire', regionCode: '84', regionName: 'Auvergne-Rhône-Alpes', regionSlug: 'auvergne-rhone-alpes' },
  '43': { code: '43', name: 'Haute-Loire', regionCode: '84', regionName: 'Auvergne-Rhône-Alpes', regionSlug: 'auvergne-rhone-alpes' },
  '44': { code: '44', name: 'Loire-Atlantique', regionCode: '52', regionName: 'Pays de la Loire', regionSlug: 'pays-de-la-loire' },
  '45': { code: '45', name: 'Loiret', regionCode: '24', regionName: 'Centre-Val de Loire', regionSlug: 'centre-val-de-loire' },
  '46': { code: '46', name: 'Lot', regionCode: '76', regionName: 'Occitanie', regionSlug: 'occitanie' },
  '47': { code: '47', name: 'Lot-et-Garonne', regionCode: '75', regionName: 'Nouvelle-Aquitaine', regionSlug: 'nouvelle-aquitaine' },
  '48': { code: '48', name: 'Lozère', regionCode: '76', regionName: 'Occitanie', regionSlug: 'occitanie' },
  '49': { code: '49', name: 'Maine-et-Loire', regionCode: '52', regionName: 'Pays de la Loire', regionSlug: 'pays-de-la-loire' },
  '50': { code: '50', name: 'Manche', regionCode: '28', regionName: 'Normandie', regionSlug: 'normandie' },
  '51': { code: '51', name: 'Marne', regionCode: '44', regionName: 'Grand Est', regionSlug: 'grand-est' },
  '52': { code: '52', name: 'Haute-Marne', regionCode: '44', regionName: 'Grand Est', regionSlug: 'grand-est' },
  '53': { code: '53', name: 'Mayenne', regionCode: '52', regionName: 'Pays de la Loire', regionSlug: 'pays-de-la-loire' },
  '54': { code: '54', name: 'Meurthe-et-Moselle', regionCode: '44', regionName: 'Grand Est', regionSlug: 'grand-est' },
  '55': { code: '55', name: 'Meuse', regionCode: '44', regionName: 'Grand Est', regionSlug: 'grand-est' },
  '56': { code: '56', name: 'Morbihan', regionCode: '53', regionName: 'Bretagne', regionSlug: 'bretagne' },
  '57': { code: '57', name: 'Moselle', regionCode: '44', regionName: 'Grand Est', regionSlug: 'grand-est' },
  '58': { code: '58', name: 'Nièvre', regionCode: '27', regionName: 'Bourgogne-Franche-Comté', regionSlug: 'bourgogne-franche-comte' },
  '59': { code: '59', name: 'Nord', regionCode: '32', regionName: 'Hauts-de-France', regionSlug: 'hauts-de-france' },
  '60': { code: '60', name: 'Oise', regionCode: '32', regionName: 'Hauts-de-France', regionSlug: 'hauts-de-france' },
  '61': { code: '61', name: 'Orne', regionCode: '28', regionName: 'Normandie', regionSlug: 'normandie' },
  '62': { code: '62', name: 'Pas-de-Calais', regionCode: '32', regionName: 'Hauts-de-France', regionSlug: 'hauts-de-france' },
  '63': { code: '63', name: 'Puy-de-Dôme', regionCode: '84', regionName: 'Auvergne-Rhône-Alpes', regionSlug: 'auvergne-rhone-alpes' },
  '64': { code: '64', name: 'Pyrénées-Atlantiques', regionCode: '75', regionName: 'Nouvelle-Aquitaine', regionSlug: 'nouvelle-aquitaine' },
  '65': { code: '65', name: 'Hautes-Pyrénées', regionCode: '76', regionName: 'Occitanie', regionSlug: 'occitanie' },
  '66': { code: '66', name: 'Pyrénées-Orientales', regionCode: '76', regionName: 'Occitanie', regionSlug: 'occitanie' },
  '67': { code: '67', name: 'Bas-Rhin', regionCode: '44', regionName: 'Grand Est', regionSlug: 'grand-est' },
  '68': { code: '68', name: 'Haut-Rhin', regionCode: '44', regionName: 'Grand Est', regionSlug: 'grand-est' },
  '69': { code: '69', name: 'Rhône', regionCode: '84', regionName: 'Auvergne-Rhône-Alpes', regionSlug: 'auvergne-rhone-alpes' },
  '70': { code: '70', name: 'Haute-Saône', regionCode: '27', regionName: 'Bourgogne-Franche-Comté', regionSlug: 'bourgogne-franche-comte' },
  '71': { code: '71', name: 'Saône-et-Loire', regionCode: '27', regionName: 'Bourgogne-Franche-Comté', regionSlug: 'bourgogne-franche-comte' },
  '72': { code: '72', name: 'Sarthe', regionCode: '52', regionName: 'Pays de la Loire', regionSlug: 'pays-de-la-loire' },
  '73': { code: '73', name: 'Savoie', regionCode: '84', regionName: 'Auvergne-Rhône-Alpes', regionSlug: 'auvergne-rhone-alpes' },
  '74': { code: '74', name: 'Haute-Savoie', regionCode: '84', regionName: 'Auvergne-Rhône-Alpes', regionSlug: 'auvergne-rhone-alpes' },
  '75': { code: '75', name: 'Paris', regionCode: '11', regionName: 'Île-de-France', regionSlug: 'ile-de-france' },
  '76': { code: '76', name: 'Seine-Maritime', regionCode: '28', regionName: 'Normandie', regionSlug: 'normandie' },
  '77': { code: '77', name: 'Seine-et-Marne', regionCode: '11', regionName: 'Île-de-France', regionSlug: 'ile-de-france' },
  '78': { code: '78', name: 'Yvelines', regionCode: '11', regionName: 'Île-de-France', regionSlug: 'ile-de-france' },
  '79': { code: '79', name: 'Deux-Sèvres', regionCode: '75', regionName: 'Nouvelle-Aquitaine', regionSlug: 'nouvelle-aquitaine' },
  '80': { code: '80', name: 'Somme', regionCode: '32', regionName: 'Hauts-de-France', regionSlug: 'hauts-de-france' },
  '81': { code: '81', name: 'Tarn', regionCode: '76', regionName: 'Occitanie', regionSlug: 'occitanie' },
  '82': { code: '82', name: 'Tarn-et-Garonne', regionCode: '76', regionName: 'Occitanie', regionSlug: 'occitanie' },
  '83': { code: '83', name: 'Var', regionCode: '93', regionName: 'Provence-Alpes-Côte d\'Azur', regionSlug: 'provence-alpes-cote-dazur' },
  '84': { code: '84', name: 'Vaucluse', regionCode: '93', regionName: 'Provence-Alpes-Côte d\'Azur', regionSlug: 'provence-alpes-cote-dazur' },
  '85': { code: '85', name: 'Vendée', regionCode: '52', regionName: 'Pays de la Loire', regionSlug: 'pays-de-la-loire' },
  '86': { code: '86', name: 'Vienne', regionCode: '75', regionName: 'Nouvelle-Aquitaine', regionSlug: 'nouvelle-aquitaine' },
  '87': { code: '87', name: 'Haute-Vienne', regionCode: '75', regionName: 'Nouvelle-Aquitaine', regionSlug: 'nouvelle-aquitaine' },
  '88': { code: '88', name: 'Vosges', regionCode: '44', regionName: 'Grand Est', regionSlug: 'grand-est' },
  '89': { code: '89', name: 'Yonne', regionCode: '27', regionName: 'Bourgogne-Franche-Comté', regionSlug: 'bourgogne-franche-comte' },
  '90': { code: '90', name: 'Territoire de Belfort', regionCode: '27', regionName: 'Bourgogne-Franche-Comté', regionSlug: 'bourgogne-franche-comte' },
  '91': { code: '91', name: 'Essonne', regionCode: '11', regionName: 'Île-de-France', regionSlug: 'ile-de-france' },
  '92': { code: '92', name: 'Hauts-de-Seine', regionCode: '11', regionName: 'Île-de-France', regionSlug: 'ile-de-france' },
  '93': { code: '93', name: 'Seine-Saint-Denis', regionCode: '11', regionName: 'Île-de-France', regionSlug: 'ile-de-france' },
  '94': { code: '94', name: 'Val-de-Marne', regionCode: '11', regionName: 'Île-de-France', regionSlug: 'ile-de-france' },
  '95': { code: '95', name: 'Val-d\'Oise', regionCode: '11', regionName: 'Île-de-France', regionSlug: 'ile-de-france' },
  '971': { code: '971', name: 'Guadeloupe', regionCode: '01', regionName: 'Guadeloupe', regionSlug: 'guadeloupe' },
  '972': { code: '972', name: 'Martinique', regionCode: '02', regionName: 'Martinique', regionSlug: 'martinique' },
  '973': { code: '973', name: 'Guyane', regionCode: '03', regionName: 'Guyane', regionSlug: 'guyane' },
  '974': { code: '974', name: 'La Réunion', regionCode: '04', regionName: 'La Réunion', regionSlug: 'la-reunion' },
  '976': { code: '976', name: 'Mayotte', regionCode: '06', regionName: 'Mayotte', regionSlug: 'mayotte' },
};

export const ALL_DEPARTMENT_CODES: ReadonlyArray<string> = Object.keys(DEPARTMENTS);

export function getDepartment(code: string): DepartmentInfo | null {
  return DEPARTMENTS[code] ?? null;
}

/**
 * Extrait le code département depuis un code postal français.
 * - 75001 → '75'
 * - 20000 → '2A' (par convention basse Corse)
 * - 97400 → '974'
 */
export function departmentFromPostalCode(postalCode: string): string | null {
  const cp = postalCode.trim().replace(/\s/g, '');
  if (!/^\d{5}$/.test(cp)) return null;

  const prefix = cp.slice(0, 2);
  const prefix3 = cp.slice(0, 3);

  // DOM-TOM (97x)
  if (prefix === '97' || prefix === '98') {
    if (DEPARTMENTS[prefix3]) return prefix3;
    return null;
  }

  // Corse : 20xxx → 2A si <20200, sinon 2B
  if (prefix === '20') {
    const num = parseInt(cp, 10);
    return num < 20200 ? '2A' : '2B';
  }

  return DEPARTMENTS[prefix] ? prefix : null;
}
