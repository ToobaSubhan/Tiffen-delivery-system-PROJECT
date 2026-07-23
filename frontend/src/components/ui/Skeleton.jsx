import React from 'react';

const Skeleton = ({ width = '100%', height = '1rem', rounded = 'rounded-lg', className = '', children }) => (
  <div
    className={`relative overflow-hidden bg-gray-200/80 ${rounded} ${className}`}
    style={{ width, height }}
  >
    <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    {children}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <Skeleton height="1rem" width="40%" className="mb-3" />
          <Skeleton height="2rem" width="70%" className="mb-2" />
          <Skeleton height="0.85rem" width="55%" />
        </div>
      ))}
    </div>
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <Skeleton height="1.2rem" width="35%" className="mb-4" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 py-3">
          <Skeleton height="2.5rem" width="2.5rem" rounded="rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton height="0.9rem" width="70%" />
            <Skeleton height="0.8rem" width="45%" />
          </div>
          <Skeleton height="1rem" width="20%" />
        </div>
      ))}
    </div>
  </div>
);

export const MenuCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
    <Skeleton height="10rem" width="100%" rounded="rounded-none" />
    <div className="space-y-3 p-4">
      <Skeleton height="0.9rem" width="35%" />
      <Skeleton height="1rem" width="70%" />
      <Skeleton height="0.9rem" width="50%" />
    </div>
  </div>
);

export const PlanCardSkeleton = () => (
  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
    <Skeleton height="1rem" width="35%" className="mb-4" />
    <Skeleton height="1.6rem" width="60%" className="mb-3" />
    <Skeleton height="0.9rem" width="100%" className="mb-2" />
    <Skeleton height="0.9rem" width="80%" className="mb-6" />
    <Skeleton height="2.5rem" width="100%" rounded="rounded-xl" />
  </div>
);

export const DeliveryRowSkeleton = () => (
  <div className="flex items-center gap-3 border-b border-gray-100 py-3">
    <Skeleton height="1rem" width="20%" />
    <Skeleton height="1rem" width="25%" />
    <Skeleton height="1rem" width="20%" />
    <Skeleton height="1rem" width="15%" />
  </div>
);

export default Skeleton;
