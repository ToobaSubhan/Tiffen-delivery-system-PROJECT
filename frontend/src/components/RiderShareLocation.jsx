import React, { useEffect, useRef, useState } from "react";
import { submitRiderLocationUpdate } from "../services/api";

import { useParams } from "react-router-dom";

const RiderShareLocation = ({ riderId }) => {
  const params = useParams();
  const effectiveRiderId = riderId || params.riderId;
  const [sharing, setSharing] = useState(false);
  const id = riderId || effectiveRiderId;
  const [error, setError] = useState("");
  const [lastSentAt, setLastSentAt] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const stopSharing = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  };

  const startSharing = async () => {
    setError("");

    if (!id) {
      setError("Missing rider_id");
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device");
      return;
    }

    // Request permission by calling watchPosition; browser will prompt.
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          await submitRiderLocationUpdate(id, latitude, longitude);
          setLastSentAt(new Date().toISOString());
        } catch (e) {
          setError(e?.message || "Failed to send location");
        }
      },
      (geoErr) => {
        setError(geoErr?.message || "Location permission denied");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    watchIdRef.current = watchId;
    setSharing(true);
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      {/* Rider ID comes from route param: /rider/share/:riderId */}
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Share Live Location</h2>

      <div className="rounded-lg border bg-white p-4">
        <p className="text-gray-600 mb-3">
          Rider ID: <span className="font-semibold text-gray-900">{riderId || effectiveRiderId}</span>
        </p>

        {lastSentAt && (
          <p className="text-sm text-gray-600 mb-3">
            Last update sent: {new Date(lastSentAt).toLocaleTimeString()}
          </p>
        )}

        {error && (
          <div className="mb-3 rounded bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {!sharing ? (
            <button
              onClick={startSharing}
              className="px-5 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Start Sharing
            </button>
          ) : (
            <button
              onClick={stopSharing}
              className="px-5 py-2 rounded bg-gray-700 text-white hover:bg-gray-800"
            >
              Stop Sharing
            </button>
          )}

          <a
            href={`/`}
            className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Home
          </a>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Location updates are sent periodically via watchPosition while sharing is active.
        </p>
      </div>
    </div>
  );
};

export default RiderShareLocation;

