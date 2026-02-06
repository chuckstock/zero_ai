import { ReactNode } from 'react';

interface ThreePanelLayoutProps {
  leftPanel: ReactNode;
  middlePanel: ReactNode;
  rightPanel: ReactNode;
}

export default function ThreePanelLayout({
  leftPanel,
  middlePanel,
  rightPanel,
}: ThreePanelLayoutProps) {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Chat */}
      <div className="w-80 border-r border-gray-700 flex flex-col bg-gray-800">
        {leftPanel}
      </div>

      {/* Middle Panel - Game Preview */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {middlePanel}
      </div>

      {/* Right Panel - Assets */}
      <div className="w-80 border-l border-gray-700 flex flex-col bg-gray-800">
        {rightPanel}
      </div>
    </div>
  );
}
