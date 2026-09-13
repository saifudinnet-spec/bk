import React from 'react';

export const CardSkeleton = ({ height = 'h-32' }) => (
  <div className={`w-full ${height} rounded-3xl bg-gray-200/70 animate-pulse`} />
);

export const ListSkeleton = ({ count = 3 }) => (
  <div className="space-y-3 w-full">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-4 bg-white rounded-2xl border border-softborder animate-pulse space-y-2.5">
        <div className="h-4 bg-gray-200 rounded-md w-1/3" />
        <div className="h-3 bg-gray-100 rounded-md w-3/4" />
        <div className="h-3 bg-gray-100 rounded-md w-1/2" />
      </div>
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-4 max-w-xl mx-auto w-full">
    <div className="h-20 bg-gray-200/60 rounded-3xl animate-pulse" />
    <div className="h-28 bg-gray-200/60 rounded-3xl animate-pulse" />
    <div className="grid grid-cols-2 gap-3">
      <div className="h-24 bg-gray-200/60 rounded-2xl animate-pulse" />
      <div className="h-24 bg-gray-200/60 rounded-2xl animate-pulse" />
    </div>
    <div className="h-40 bg-gray-200/60 rounded-3xl animate-pulse" />
  </div>
);

export default DashboardSkeleton;
