'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export interface AddressSuggestion {
  label: string;
  housenumber: string;
  street: string;
  postcode: string;
  city: string;
  context: string;
  longitude?: number | null;
  latitude?: number | null;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Ex: 12 rue de la Paix, 75002 Paris',
  required = false,
  className = '',
  id,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await fetch(`/api/addresses?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setSuggestions(data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      setHighlightedIndex(-1);
    } catch (err) {
      console.error('Erreur recherche adresse:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.label);
    onSelect?.(suggestion);
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
        id={id}
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
          className="absolute z-[9999] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.label}-${i}`}
              onClick={() => handleSelect(s)}
              onMouseEnter={() => setHighlightedIndex(i)}
              className={`px-4 py-3 cursor-pointer text-sm transition-colors ${
                i === highlightedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
              role="option"
              aria-selected={i === highlightedIndex}
            >
              <span className="font-medium text-gray-900">{s.label}</span>
              <span className="block text-xs text-gray-400 mt-0.5">{s.context}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
