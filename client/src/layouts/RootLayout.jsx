import { Outlet } from "react-router-dom";
import { NavBar } from "../components/NavBar";

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}