import { useState, useEffect } from "react";
import { searchCity } from "../components/ui/api";

/**
 * Debounced city search hook.
 * Returns city results from the API, with a configurable debounce delay.
 */
export function useCitySearch(
  query: string,
  selectedCity: any,
  delay: number = 500
) {
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 3 && (!selectedCity || query !== selectedCity.name)) {
        const data = await searchCity(query);
        setResults(data);
      } else {
        setResults([]);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [query, selectedCity, delay]);

  return { results, setResults };
}
