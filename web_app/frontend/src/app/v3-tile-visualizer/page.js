import { TileVisualizerWorkspaceV3 } from "@/components/v3_tile_visualizer/TileVisualizerWorkspace";

export const metadata = {
  title: "SAM 3 Tile Visualizer V3.0 (PBR & Neural Perspective)",
  description: "Physics-Based Rendering architectural tile visualizer powered by Meta SAM 3 and RANSAC vanishing point perspective.",
};

export default function V3TileVisualizerPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <TileVisualizerWorkspaceV3 />
    </main>
  );
}
