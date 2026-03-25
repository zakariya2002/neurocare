import { Metadata } from 'next';
import structuresData from '@/data/structures-tnd.json';
import LieuxClient from './LieuxClient';

export const metadata: Metadata = {
  title: 'Lieux adapt\u00e9s TND | NeuroCare',
  description: 'Annuaire des lieux de prise en charge adapt\u00e9s pour les troubles du neurod\u00e9veloppement (autisme, TDAH, DYS) en France : CMP, CAMSP, SESSAD, CMPP, CRA.',
  keywords: [
    'CMP autisme', 'CAMSP', 'SESSAD', 'CMPP', 'CRA autisme',
    'lieux adapt\u00e9s TND', 'prise en charge autisme', 'structures autisme France',
    'annuaire TND', 'centre m\u00e9dico-psychologique',
  ],
};

export default function LieuxAdaptesPage() {
  return <LieuxClient structures={structuresData as any} />;
}
