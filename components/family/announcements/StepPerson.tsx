'use client';

import { AnnouncementFormData, ChildProfileLite } from './types';

interface StepPersonProps {
  data: AnnouncementFormData;
  onChange: (patch: Partial<AnnouncementFormData>) => void;
  childrenList: ChildProfileLite[];
  errors: Record<string, string>;
}

const ADULT_VALUE = '__adult__';

function computeAge(child: ChildProfileLite): number | null {
  if (child.age) return child.age;
  if (!child.birth_date) return null;
  const birth = new Date(child.birth_date);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function StepPerson({ data, onChange, childrenList, errors }: StepPersonProps) {
  const handleChildChange = (value: string) => {
    if (value === ADULT_VALUE) {
      onChange({ child_id: null });
      return;
    }
    const c = childrenList.find((ch) => ch.id === value);
    if (!c) {
      onChange({ child_id: null, person_age: null });
      return;
    }
    onChange({ child_id: c.id, person_age: computeAge(c) });
  };

  const currentValue = data.child_id ?? (data.person_age !== null ? ADULT_VALUE : '');

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Pour qui est cette annonce ? <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Sélectionnez un proche déjà enregistré ou choisissez « Aucun / un adulte ».
        </p>

        {childrenList.length === 0 ? (
          <div
            className="p-4 rounded-lg border text-sm"
            style={{ backgroundColor: 'rgba(2, 126, 126, 0.05)', borderColor: 'rgba(2, 126, 126, 0.2)' }}
          >
            Vous n&apos;avez pas encore enregistré de proche. Vous pouvez créer l&apos;annonce pour un adulte ou
            <a href="/dashboard/family/children" className="font-semibold ml-1 underline" style={{ color: '#027e7e' }}>
              ajouter un proche
            </a>.
          </div>
        ) : (
          <div className="space-y-2">
            {childrenList.map((child) => {
              const selected = data.child_id === child.id;
              const age = computeAge(child);
              return (
                <label
                  key={child.id}
                  className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                    selected ? 'border-transparent' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={selected ? { backgroundColor: 'rgba(2, 126, 126, 0.1)', borderColor: '#027e7e' } : {}}
                >
                  <input
                    type="radio"
                    name="child"
                    value={child.id}
                    checked={selected}
                    onChange={() => handleChildChange(child.id)}
                    className="h-4 w-4"
                    style={{ accentColor: '#027e7e' }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">
                      {child.first_name} {child.last_name || ''}
                    </p>
                    {age !== null && <p className="text-xs text-gray-500">{age} ans</p>}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <label
          className={`flex items-center gap-3 p-4 mt-2 border rounded-xl cursor-pointer transition-all ${
            currentValue === ADULT_VALUE ? 'border-transparent' : 'border-gray-200 hover:border-gray-300'
          }`}
          style={currentValue === ADULT_VALUE ? { backgroundColor: 'rgba(2, 126, 126, 0.1)', borderColor: '#027e7e' } : {}}
        >
          <input
            type="radio"
            name="child"
            value={ADULT_VALUE}
            checked={currentValue === ADULT_VALUE}
            onChange={() => handleChildChange(ADULT_VALUE)}
            className="h-4 w-4"
            style={{ accentColor: '#027e7e' }}
          />
          <span className="text-sm font-semibold text-gray-700">Aucun / un adulte</span>
        </label>

        {errors.child_id && <p className="text-xs text-red-600 mt-2">{errors.child_id}</p>}
      </div>

      {currentValue === ADULT_VALUE && (
        <div>
          <label htmlFor="person_age" className="block text-sm font-semibold text-gray-700 mb-2">
            Âge de la personne <span className="text-red-500">*</span>
          </label>
          <input
            id="person_age"
            type="number"
            min={0}
            max={120}
            value={data.person_age ?? ''}
            onChange={(e) => onChange({ person_age: e.target.value ? Number(e.target.value) : null })}
            className="w-full max-w-xs border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent text-base"
            style={{ '--tw-ring-color': '#027e7e', fontSize: '16px' } as any}
            placeholder="Ex: 32"
          />
          {errors.person_age && <p className="text-xs text-red-600 mt-1">{errors.person_age}</p>}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Préférence de genre du professionnel
        </label>
        <div className="grid grid-cols-3 gap-2 max-w-md">
          {[
            { value: 'any', label: 'Indifférent' },
            { value: 'male', label: 'Masculin' },
            { value: 'female', label: 'Féminin' },
          ].map((opt) => {
            const selected = data.gender_preference === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                  selected ? 'border-transparent' : 'border-gray-200 hover:border-gray-300'
                }`}
                style={selected ? { backgroundColor: 'rgba(2, 126, 126, 0.1)', borderColor: '#027e7e' } : {}}
              >
                <input
                  type="radio"
                  name="gender_preference"
                  value={opt.value}
                  checked={selected}
                  onChange={() => onChange({ gender_preference: opt.value as any })}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
