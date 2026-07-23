import React, { useEffect, useMemo, useState } from "react";
import { getRiderLiveLocation } from "../services/api";

// NOTE: Using simple HTML/CSS positioning (no external map SDK) to avoid adding heavy dependencies.
// Marker is shown relative to a small bounding box around last known coordinates.

const DEFAULT_POLL_MS = 4000;

const TrackLiveMap = ({ riderId, pollMs = DEFAULT_POLL_MS }) => {
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState("");
  const [loc, setLoc] = useState({ latitude: null, longitude: null, last_updated: null });

  useEffect(() => {
    if (!riderId) return;

    let active = true;

    const load = async () => {
      try {
        const data = await getRiderLiveLocation(riderId);
        if (!active) return;

        setAvailable(!!data.available);
        if (data.available) {
          setLoc({ latitude: data.latitude, longitude: data.longitude, last_updated: data.last_updated });
        }
        setError("");
      } catch (e) {
        if (!active) return;
        setError(e?.message || "Failed to load rider location");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, pollMs);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [riderId, pollMs]);

  const mapModel = useMemo(() => {
    // If we have no coordinates, render placeholder.
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    // Create a tiny bounding box around current coords to position the marker.
    const delta = 0.01; // ~1km latitude-ish; acceptable for "ish" visualization
    const minLat = lat - delta;
    const maxLat = lat + delta;
    const minLng = lng - delta;
    const maxLng = lng + delta;

    const clampedLat = Math.min(Math.max(lat, minLat), maxLat);
    const clampedLng = Math.min(Math.max(lng, minLng), maxLng);

    // Convert to relative positions
    const x = (clampedLng - minLng) / (maxLng - minLng); // 0..1
    const y = 1 - (clampedLat - minLat) / (maxLat - minLat); // 0..1

    return { x, y };
  }, [loc.latitude, loc.longitude]);

  if (loading) {
    return (
      <div className="w-full rounded-lg border bg-white p-4 text-center text-gray-600">
        Loading rider location...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-lg border bg-white p-4 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (!available) {
    return (
      <div className="w-full rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Location not available yet</h3>
        <p className="text-gray-600">Your rider hasn’t started sharing location. Please check again in a moment.</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Live Rider Location</h3>
          <p className="text-sm text-gray-600">
            {loc.last_updated ? `Last updated: ${new Date(loc.last_updated).toLocaleTimeString()}` : ""}
          </p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <div>Lat: {loc.latitude}</div>
          <div>Lng: {loc.longitude}</div>
        </div>
      </div>

      <div className="relative h-[420px] w-full overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 border">
        {mapModel ? (
          <>
            {/* faux grid */}
            <div className="absolute inset-0 opacity-40">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0 w-full h-px bg-gray-400"
                  style={{ top: `${(i / 10) * 100}%` }}
                />
              ))}
            </div>
            <div className="absolute inset-0 opacity-40">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0 h-full w-px bg-gray-400"
                  style={{ left: `${(i / 10) * 100}%` }}
                />
              ))}
            </div>

            <div
              className="absolute"
              style={{
                left: `${mapModel.x * 100}%`,
                top: `${mapModel.y * 100}%`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="w-3 h-3 rounded-full bg-red-600 shadow-lg" />
              <div className="mt-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded">
                Rider
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Waiting for coordinates...
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Map visualization is approximate (polling). For production-grade maps, integrate a map SDK.
      </p>
    </div>
  );
};

export default TrackLiveMap;

