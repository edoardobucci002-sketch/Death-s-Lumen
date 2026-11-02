/* Record: il miglior tempo di ogni personaggio, salvato sul dispositivo. */
export function leggiRecord(personaggio: string): number {
  try {
    return Number(localStorage.getItem(`dl-record-${personaggio}`)) || 0;
  } catch {
    return 0;
  }
}

/** Salva il tempo se è un nuovo record; restituisce true se lo è. */
export function salvaRecord(personaggio: string, secondi: number): boolean {
  if (secondi <= leggiRecord(personaggio)) return false;
  try {
    localStorage.setItem(`dl-record-${personaggio}`, String(Math.floor(secondi)));
  } catch {
    /* niente memoria: il record vale solo per ora */
  }
  return true;
}
