"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ShopsMap, type MapBounds } from "@/components/map/shops-map";
import { SHOP_STATUSES, type Shop } from "@/types/database";

const DEFAULT_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

type ApiResponse = {
  data: Shop[];
  total: number;
  limit: number;
  offset: number;
};

type FilterState = {
  search: string;
  country: string;
  city: string;
  status: "" | (typeof SHOP_STATUSES)[number];
};

export function MapExplorer() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    country: "",
    city: "",
    status: ""
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    search: "",
    country: "",
    city: "",
    status: ""
  });
  const [shops, setShops] = useState<Shop[]>([]);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL || DEFAULT_TILE_URL;

  const fetchShops = useCallback(async (nextBounds: MapBounds, signal: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      limit: "1000",
      offset: "0",
      west: nextBounds.west.toString(),
      south: nextBounds.south.toString(),
      east: nextBounds.east.toString(),
      north: nextBounds.north.toString()
    });

    if (appliedFilters.search) params.set("search", appliedFilters.search);
    if (appliedFilters.country) params.set("country", appliedFilters.country);
    if (appliedFilters.city) params.set("city", appliedFilters.city);
    if (appliedFilters.status) params.set("status", appliedFilters.status);

    try {
      const response = await fetch(`/api/shops?${params.toString()}`, { signal });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const payload = (await response.json()) as ApiResponse;
      setShops(payload.data);
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Unexpected map data error.");
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [appliedFilters]);

  useEffect(() => {
    if (!bounds) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetchShops(bounds, controller.signal);
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [bounds, fetchShops]);

  const handleBoundsChanged = useCallback((nextBounds: MapBounds) => {
    setBounds((currentBounds) => {
      if (
        currentBounds &&
        currentBounds.west === nextBounds.west &&
        currentBounds.south === nextBounds.south &&
        currentBounds.east === nextBounds.east &&
        currentBounds.north === nextBounds.north &&
        currentBounds.zoom === nextBounds.zoom
      ) {
        return currentBounds;
      }

      return nextBounds;
    });
  }, []);

  const countries = useMemo(() => {
    const values = new Set(shops.map((shop) => shop.country));
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [shops]);

  return (
    <section className="space-y-6">
      <form
        className="grid gap-3 rounded-2xl border border-batter-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedFilters(filters);
        }}
      >
        <input
          className="h-11 rounded-xl border border-batter-300 px-3 text-sm focus:border-batter-500 focus:outline-none focus:ring-2 focus:ring-batter-200"
          placeholder="Search name/city/country"
          value={filters.search}
          onChange={(event) => {
            setFilters((current) => ({ ...current, search: event.target.value }));
          }}
        />

        <input
          className="h-11 rounded-xl border border-batter-300 px-3 text-sm focus:border-batter-500 focus:outline-none focus:ring-2 focus:ring-batter-200"
          placeholder="Country"
          list="country-options"
          value={filters.country}
          onChange={(event) => {
            setFilters((current) => ({ ...current, country: event.target.value }));
          }}
        />
        <datalist id="country-options">
          {countries.map((country) => (
            <option key={country} value={country} />
          ))}
        </datalist>

        <input
          className="h-11 rounded-xl border border-batter-300 px-3 text-sm focus:border-batter-500 focus:outline-none focus:ring-2 focus:ring-batter-200"
          placeholder="City"
          value={filters.city}
          onChange={(event) => {
            setFilters((current) => ({ ...current, city: event.target.value }));
          }}
        />

        <select
          className="h-11 rounded-xl border border-batter-300 bg-white px-3 text-sm focus:border-batter-500 focus:outline-none focus:ring-2 focus:ring-batter-200"
          value={filters.status}
          onChange={(event) => {
            const value = event.target.value as FilterState["status"];
            setFilters((current) => ({ ...current, status: value }));
          }}
        >
          <option value="">Any status</option>
          {SHOP_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="h-11 rounded-xl bg-batter-500 px-4 text-sm font-semibold text-white transition hover:bg-batter-600"
        >
          Apply filters
        </button>
      </form>

      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/80">
          Showing <span className="font-semibold">{shops.length}</span> shop{shops.length === 1 ? "" : "s"}
        </p>
        {!bounds && <p className="text-sm text-ink/70">Waiting for map bounds...</p>}
        {bounds && isLoading && <p className="text-sm text-ink/70">Loading map data...</p>}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Unable to load map: {error}</div>
      ) : (
        <ShopsMap shops={shops} tileUrl={tileUrl} onBoundsChanged={handleBoundsChanged} />
      )}
    </section>
  );
}
