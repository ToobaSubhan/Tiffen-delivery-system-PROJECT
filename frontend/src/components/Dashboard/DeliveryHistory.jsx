import React, { useEffect, useState } from "react";
import { getUserDeliveries } from "../../services/api";

import DeliveryHistoryWithTracking from "./DeliveryHistoryWithTracking";

// Backward-compatible wrapper: existing route renders tracking-enhanced version.
export default function DeliveryHistory() {
  return <DeliveryHistoryWithTracking />;
}

