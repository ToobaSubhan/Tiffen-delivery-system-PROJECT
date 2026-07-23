import React, { useEffect, useState } from "react";
import { getUserDeliveries } from "../../services/api";
import TrackLiveMap from "../TrackLiveMap";

const IN_PROGRESS_STATUSES = ["assigned", "picked_up", "on_way"];

const DeliveryHistoryWithTracking = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRiderId, setSelectedRiderId] = useState(null);

  useEffect(() => {
    getUserDeliveries()
      .then((data) => {
        setDeliveries(Array.isArray(data) ? data : data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12">Loading...</div>;

  const selectedDelivery = deliveries.find((d) => d.rider_id === selectedRiderId);

  return (
    <div className="dashboard-container p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Delivery History</h1>
      <p className="text-sm text-gray-600 mb-4">Track your active delivery in real time.</p>

      {selectedRiderId && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Tracking</h2>
            <button
              onClick={() => setSelectedRiderId(null)}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Close
            </button>
          </div>
          <TrackLiveMap riderId={selectedRiderId} />
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-3">Deliveries</h2>
        {deliveries.length > 0 ? (
          <div className="space-y-3">
            {deliveries.map((del) => {
              const inProgress = IN_PROGRESS_STATUSES.includes(del.status);
              const hasRider = !!del.rider_id;
              const canTrack = inProgress && hasRider;

              return (
                <div key={del.delivery_id || del.order_id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{del.plan_name || "Delivery"}</h3>
                      <div className="text-sm text-gray-600">Date: {del.delivery_date || del.order_date || "N/A"}</div>
                      <div className="text-sm text-gray-600">Status: {del.status}</div>
                      {del.rider_id && (
                        <div className="text-sm text-gray-600">Rider ID: {del.rider_id}</div>
                      )}
                    </div>

                    {canTrack ? (
                      <button
                        className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 text-sm font-medium"
                        onClick={() => setSelectedRiderId(del.rider_id)}
                      >
                        Track Live
                      </button>
                    ) : hasRider && inProgress ? (
                      <button
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium cursor-not-allowed"
                        onClick={() => setSelectedRiderId(del.rider_id)}
                        title="Rider has not shared location yet"
                      >
                        Track Live
                      </button>
                    ) : (
                      <div className="text-xs text-gray-500 pt-1">{del.status === "delivered" ? "Completed" : ""}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600">No deliveries found.</p>
        )}
      </div>
    </div>
  );
};

export default DeliveryHistoryWithTracking;

