import { Link } from "react-router-dom";
import { PixelButton } from "../components/ui/PixelButton";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="font-pixel text-6xl text-gold-bright mb-4">404</div>
      <div className="font-pixel text-sm text-parchment mb-2">LOST IN THE DUNGEON</div>
      <p className="font-mono text-sm text-parchment/60 max-w-md mb-8">
        This passage does not exist. Even the bravest heroes turn back from here.
      </p>
      <Link to="/"><PixelButton>Return to Surface</PixelButton></Link>
    </div>
  );
}