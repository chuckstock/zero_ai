import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Upload, Image } from 'lucide-react';

interface AssetsPanelProps {
  gameId: Id<"games">;
}

export default function AssetsPanel({ gameId }: AssetsPanelProps) {
  const assets = useQuery(api.assets.listByGame, { gameId });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Assets</h2>
        <p className="text-sm text-gray-400 mt-1">
          Images, audio, and more
        </p>
      </div>

      {/* Upload zone */}
      <div className="p-4">
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors cursor-pointer">
          <Upload className="mx-auto mb-2 text-gray-500" size={32} />
          <p className="text-sm text-gray-400">
            Drag & drop files here
          </p>
          <p className="text-xs text-gray-500 mt-1">
            or click to browse
          </p>
        </div>
      </div>

      {/* Assets grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {assets && assets.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {assets.map((asset) => (
              <div
                key={asset._id}
                className="bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
              >
                {asset.type === 'image' ? (
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 flex items-center justify-center bg-gray-600">
                    <Image size={32} className="text-gray-400" />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs text-white truncate font-medium">
                    {asset.name}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">
                      {asset.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(asset.metadata.size / 1024).toFixed(1)}KB
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-8">
            <Image className="mx-auto mb-2 text-gray-600" size={48} />
            <p className="text-sm">No assets yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Upload files or ask the AI to generate images
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <button className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">
          View Code
        </button>
      </div>
    </div>
  );
}
