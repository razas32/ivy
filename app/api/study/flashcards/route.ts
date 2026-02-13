import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { Flashcard } from '@/types';
import { supabaseRest } from '@/lib/server/supabaseRest';

interface Payload {
  cards: Flashcard[];
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await requireAuthenticatedUser(req);
  if (errorResponse || !user) return errorResponse!;

  try {
    const body = (await req.json()) as Payload;
    const cards = Array.isArray(body.cards) ? body.cards : [];

    const setRows = await supabaseRest<{ id: string }[]>(
      'study_sets?select=id',
      {
        method: 'POST',
        body: [{ user_id: user.id, kind: 'flashcards', title: `Flashcards ${new Date().toISOString()}` }],
        prefer: 'return=representation',
      }
    );

    const studySetId = setRows[0]?.id;
    if (!studySetId) {
      throw new Error('Failed to create flashcard set.');
    }

    if (cards.length > 0) {
      await supabaseRest(
        'flashcards',
        {
          method: 'POST',
          body: cards.map((card, index) => ({
            id: card.id || crypto.randomUUID(),
            study_set_id: studySetId,
            front: card.front,
            back: card.back,
            position: index,
          })),
          prefer: 'return=minimal',
        }
      );
    }

    return NextResponse.json({ ok: true, studySetId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save flashcards.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
