import { useEffect, useState } from 'react';
import api, { allowMockData } from '../lib/api.js';
import ListingCard from './ListingCard.jsx';
import FilterChips from './FilterChips.jsx';
import { mockListings } from '../mockData.js';
import { formatListingCount, getBrandFilters } from '../lib/listingPresentation.js';

export default function ListingsPage({ condition, participant, trustMode = 'social' }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeBrand, setActiveBrand] = useState('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    setUsingDemoData(false);

    api.get('/api/listings', {
      params: { participant_code: participant?.participantCode },
    })
      .then(res => setListings(res.data))
      .catch(() => {
        if (allowMockData) {
          setListings(mockListings);
          setUsingDemoData(true);
          setLoadError('The API is unavailable, so local demo listings are being shown.');
          return;
        }

        setListings([]);
        setLoadError('CrepFinder could not load the marketplace. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [participant?.participantCode, reloadKey]);

  const brands = getBrandFilters(listings);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredListings = listings.filter((listing) => {
    const brandMatches = activeBrand === 'All' || listing.brand === activeBrand;
    const queryMatches = !normalizedQuery
      || [listing.brand, listing.model, listing.seller_username, listing.condition]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));

    return brandMatches && queryMatches;
  });

  useEffect(() => {
    if (!brands.includes(activeBrand)) {
      setActiveBrand('All');
    }
  }, [activeBrand, brands]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading listings">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="overflow-hidden rounded-[10px] border border-border-subtle bg-surface">
            <div className="aspect-square animate-pulse bg-subtle" />
            <div className="space-y-3 p-3">
              <div className="h-3 w-16 animate-pulse rounded-full bg-subtle" />
              <div className="h-4 w-32 animate-pulse rounded-full bg-subtle" />
              <div className="h-10 animate-pulse rounded-[8px] bg-subtle" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (loadError && !usingDemoData) {
    return (
      <div className="space-y-6">
        <h1 className="text-[26px] font-medium text-primary">Browse</h1>
        <div role="alert" className="rounded-[10px] border border-border-subtle bg-surface px-6 py-12 text-center">
          <p className="text-[14px] text-secondary">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="mt-4 rounded-full bg-primary px-5 py-2 text-[13px] font-medium text-surface"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {usingDemoData && (
        <div role="status" className="border-l-2 border-amber-500 bg-amber-50 px-4 py-3 text-[12px] text-stone-700">
          {loadError}
        </div>
      )}
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-[26px] font-medium text-primary">Browse</h1>
          <p className="pb-0.5 text-[12px] font-medium text-muted">
            {formatListingCount(filteredListings.length)}
          </p>
        </div>
        <label className="block">
          <span className="sr-only">Search listings</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by brand, model, condition or seller"
            className="w-full rounded-full border border-border-subtle bg-surface px-4 py-3 text-[13px] text-primary outline-none transition-colors placeholder:text-muted focus:border-border-strong"
          />
        </label>
        <FilterChips options={brands} value={activeBrand} onChange={setActiveBrand} />
      </div>

      {filteredListings.length === 0 ? (
        <div className="rounded-[10px] border border-border-subtle bg-surface px-6 py-12 text-center text-[14px] text-secondary">
          No listings match this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} condition={condition} trustMode={trustMode} />
          ))}
        </div>
      )}
    </div>
  );
}
