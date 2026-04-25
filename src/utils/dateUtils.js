import React from 'react';
export const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return '';
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffInMs = now - lastSeenDate;
  const diffInMins = Math.floor(diffInMs / 60000);

  if (diffInMins < 1) return 'Active just now';
  if (diffInMins < 60) return `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`;

  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

  return `${lastSeenDate.toLocaleDateString()} at ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};
