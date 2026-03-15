'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

interface CitySuggestion {
  label: string;
  city: string;
  postcode: string;
  context: string;
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Ex: Paris, France',
  required = false,
  className = '',
}: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fermer les suggestions au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=5`
      );
      const data = await res.json();

      const results: CitySuggestion[] = data.features.map((f: any) => ({
        label: `${f.properties.label}`,
        city: f.properties.city || f.properties.name,
        postcode: f.properties.postcode || '',
        context: f.properties.context || '',
      }));

      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setHighlightedIndex(-1);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
  };

  const handleSelect = (suggestion: CitySuggestion) => {
    onChange(`${suggestion.city} (${suggestion.postcode})`);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className={className}
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        role="combobox"
      />

      {showSuggestions && suggestions.length > 0 && (
        <ul
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.city}-${s.postcode}`}
              onClick={() => handleSelect(s)}
              onMouseEnter={() => setHighlightedIndex(i)}
              className={`px-4 py-3 cursor-pointer text-sm transition-colors ${
                i === highlightedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
              role="option"
              aria-selected={i === highlightedIndex}
            >
              <span className="font-medium text-gray-900">{s.city}</span>
              <span className="text-gray-400 ml-1.5">{s.postcode}</span>
              <span className="block text-xs text-gray-400 mt-0.5">{s.context}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
