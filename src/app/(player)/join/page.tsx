import { Suspense } from 'react';
import { PlayerJoinForm } from '@/components/player/player-join-form';

export default function PlayerJoinPage() {
  return (
    <Suspense>
      <PlayerJoinForm />
    </Suspense>
  );
}
