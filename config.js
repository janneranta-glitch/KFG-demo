// Kaidetietojen logiikka sekä asetukset

export const KAIDEMALLIT = [
  { id: "pinnakaide", label: "Pinnakaide", ylatanko: "6x40mm latta", alatanko: "6x40mm latta", pystytanko: "12mm akseli" },
  { id: "lattakaide", label: "Lattakaide", ylatanko: "6x40mm latta", alatanko: "6x40mm latta", pystytanko: "20x4mm lattarauta" }
];

export const KORKEUDET = ["1.00", "1.10", "1.20", "1.30", "1.40", "1.50", "muu"];
export const VARIT = [
  { id: "RAL9005", label: "Musta (RAL9005)", code: "#222" },
  { id: "RAL9010", label: "Valkoinen (RAL9010)", code: "#efefef" },
  { id: "RAL7024", label: "Tumman harmaa (RAL7024)", code: "#565d66" },
  { id: "RAL7040", label: "Vaalean harmaa (RAL7040)", code: "#cfd1d0" }
];
export const KAYTTO = ["sisä", "ulkona"];
export const KIINNITYS = ["betoni", "puu", "muu"];
export const ALLOWED_FILES = [".pdf", ".jpg", ".jpeg", ".png", ".bmp", ".heic", ".gif"];
export function validateFileType(filename) {
  return ALLOWED_FILES.some(ext => filename.toLowerCase().endsWith(ext));
}
export function needsZinc(kaytto) {
  return kaytto === "ulkona";
}
export function mallidata(id) {
  return KAIDEMALLIT.find(m => m.id === id);
}

// *** Muista: Päivitä vain config.js jos lisäät uusia vaihtoehtoja! ***
