export const SkeletonCard = () => {
  return (
    <div className="neu-card p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  )
}

export const SkeletonButton = () => {
  return (
    <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
  )
}

export const SkeletonChart = () => {
  return (
    <div className="neu-card p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  )
}

export const SkeletonCalendar = () => {
  return (
    <div className="neu-card p-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  )
}






