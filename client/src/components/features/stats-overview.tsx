import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface StatsOverviewProps {
  stats: {
    totalLinks: number;
    upcomingDeadlines: number;
    completedLinks: number;
    tagsUsed: number;
  };
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center">
          <div className="rounded-md bg-blue-100 p-3 mr-4">
            <FontAwesomeIcon icon="link" className="text-primary text-xl" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Links</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalLinks}</h3>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center">
          <div className="rounded-md bg-yellow-100 p-3 mr-4">
            <FontAwesomeIcon icon="clock" className="text-yellow-500 text-xl" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Upcoming Deadlines</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.upcomingDeadlines}</h3>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center">
          <div className="rounded-md bg-green-100 p-3 mr-4">
            <FontAwesomeIcon icon="check-double" className="text-green-500 text-xl" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Completed</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.completedLinks}</h3>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center">
          <div className="rounded-md bg-purple-100 p-3 mr-4">
            <FontAwesomeIcon icon="tag" className="text-purple-500 text-xl" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Tags Used</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.tagsUsed}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
