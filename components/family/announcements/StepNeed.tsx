'use client';

import {
  AnnouncementFormData,
  ACCOMPANIMENT_OPTIONS,
  PROFESSION_OPTIONS,
  TND_OPTIONS,
} from './types';

interface StepNeedProps {
  data: AnnouncementFormData;
  onChange: (patch: Partial<AnnouncementFormData>) => void;
  errors: Record<string, string>;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function StepNeed({ data, onChange, errors }: StepNeedProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
          Titre de l&apos;annonce <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Ex : Accompagnement éducatif pour mon fils TSA, 8 ans"
          className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent text-base"
          style={{ '--tw-ring-color': '#027e7e', fontSize: '16px' } as any}
          maxLength={120}
        />
        <div className="flex justify-between mt-1">
          <p className={`text-xs ${errors.title ? 'text-red-600' : 'text-gray-500'}`}>
            {errors.title || 'Minimum 8 caractères'}
          </p>
          <p className="text-xs text-gray-400">{data.title.length}/120</p>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
          Description du besoin <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          rows={5}
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Décrivez le contexte, les objectifs, les attentes vis-à-vis du professionnel..."
          className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent text-base"
          style={{ '--tw-ring-color': '#027e7e', fontSize: '16px' } as any}
          maxLength={2000}
        />
        <div className="flex justify-between mt-1">
          <p className={`text-xs ${errors.description ? 'text-red-600' : 'text-gray-500'}`}>
            {errors.description || 'Minimum 30 caractères'}
          </p>
          <p className="text-xs text-gray-400">{data.description.length}/2000</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Types d&apos;accompagnement <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">Sélectionnez tous les domaines pertinents.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ACCOMPANIMENT_OPTIONS.map((opt) => {
            const selected = data.accompaniment_types.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                  selected ? 'border-transparent' : 'border-gray-200 hover:border-gray-300'
                }`}
                style={selected ? { backgroundColor: 'rgba(2, 126, 126, 0.1)', borderColor: '#027e7e' } : {}}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onChange({ accompaniment_types: toggle(data.accompaniment_types, opt.value) })}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: '#027e7e' }}
                />
                <span className="text-sm text-gray-700 font-medium">{opt.label}</span>
              </label>
            );
          })}
        </div>
        {errors.accompaniment_types && (
          <p className="text-xs text-red-600 mt-2">{errors.accompaniment_types}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Professions recherchées <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">Indiquez le ou les profils que vous souhaitez recevoir.</p>
        <div className="flex flex-wrap gap-2">
          {PROFESSION_OPTIONS.map((opt) => {
            const selected = data.desired_professions.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ desired_professions: toggle(data.desired_professions, opt.value) })}
                className={`px-3 py-2 text-sm rounded-full border transition-all ${
                  selected
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                }`}
                style={selected ? { backgroundColor: '#027e7e' } : {}}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {errors.desired_professions && (
          <p className="text-xs text-red-600 mt-2">{errors.desired_professions}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Contexte TND (facultatif)
        </label>
        <p className="text-xs text-gray-500 mb-3">Aide les pros à mieux cibler leur réponse.</p>
        <div className="flex flex-wrap gap-2">
          {TND_OPTIONS.map((opt) => {
            const selected = data.tnd_context.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ tnd_context: toggle(data.tnd_context, opt.value) })}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                  selected
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                }`}
                style={selected ? { backgroundColor: '#f0879f' } : {}}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
