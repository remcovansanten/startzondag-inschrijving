import { prisma } from './db';
import { STATUS } from './aanmelding';

export interface PromotedAanmelding {
  id: string;
  naam: string;
  email: string;
  token: string;
  taakNaam: string;
}

// Promoveer de oudste wachtlijst-aanmelding van een taak naar ACTIEF zodra er een
// plek vrij is (bijv. na een annulering). Retourneert de gepromote aanmelding
// (voor de mail) of null als er niets te promoveren valt.
export async function promoteFromWaitlist(taakId: string): Promise<PromotedAanmelding | null> {
  return prisma.$transaction(async (tx) => {
    const taak = await tx.taak.findUnique({
      where: { id: taakId },
      include: { _count: { select: { aanmeldingen: { where: { status: STATUS.ACTIEF } } } } },
    });
    if (!taak) return null;
    if (taak._count.aanmeldingen >= taak.maxAantal) return null; // nog geen plek vrij

    const next = await tx.aanmelding.findFirst({
      where: { taakId, status: STATUS.WACHTLIJST },
      orderBy: { createdAt: 'asc' },
    });
    if (!next) return null;

    const promoted = await tx.aanmelding.update({
      where: { id: next.id },
      data: { status: STATUS.ACTIEF },
    });
    return {
      id: promoted.id,
      naam: promoted.naam,
      email: promoted.email,
      token: promoted.token,
      taakNaam: taak.naam,
    };
  });
}
