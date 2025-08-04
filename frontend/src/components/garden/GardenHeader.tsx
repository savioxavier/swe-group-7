import React, { useState } from "react";
import { LogOut, Zap, Trophy, Loader2, Menu, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { UserProgressResponse } from "../../types";
import { MobileMenu } from "./MobileMenu";
import { AudioSettings } from "./AudioSettings";

interface GardenHeaderProps {
  user: { username?: string; email?: string } | null;
  userProgress: UserProgressResponse | null;
  onLogout: () => void;
  plants?: Array<{ current_streak?: number }>;
  showAudioSettings?: boolean;
  onToggleAudioSettings?: () => void;
  sounds: {
    getMasterVolume: () => number;
    setMasterVolume: (volume: number) => void;
    getBackgroundMusicVolume: () => number;
    setBackgroundMusicVolume: (volume: number) => void;
    getSoundEffectsVolume: () => number;
    setSoundEffectsVolume: (volume: number) => void;
    getIsBackgroundMusicEnabled: () => boolean;
    setIsBackgroundMusicEnabled: (enabled: boolean) => void;
    getIsSoundEffectsEnabled: () => boolean;
    setIsSoundEffectsEnabled: (enabled: boolean) => void;
    getAudioVariationsEnabled: () => boolean;
    setAudioVariationsEnabled: (enabled: boolean) => void;
  };
}

export const GardenHeader: React.FC<GardenHeaderProps> = ({
  user,
  userProgress,
  onLogout,
  plants = [],
  showAudioSettings = false,
  onToggleAudioSettings = () => {},
  sounds,
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const longestPlantStreak = plants.reduce((max, plant) => {
    const streak = plant.current_streak || 0;
    return Math.max(max, streak);
  }, 0);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      onLogout();
    }, 200);
  };
  return (
    <>
      {/* Main Header - Compact Design */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left Section - Brand & User */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Logo */}
              <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-green-400/30 flex items-center justify-center overflow-hidden">
                <img
                  src="/assets/logo.png"
                  alt="TaskGarden Logo"
                  className="w-6 h-6 object-cover rounded"
                />
              </div>

              {/* Brand & User Info */}
              <div className="min-w-0 mt-3">
                <h1 className="text-lg font-bold text-white truncate text-left">
                  TaskGarden
                </h1>
                <p className="text-green-200 text-xs truncate">
                  {user?.username || user?.email}
                </p>
              </div>
            </div>

            {/* Center Section - Stats (Desktop Only) */}
            <div className="hidden md:flex items-center gap-2">
              {/* Level */}
              <div className="bg-white/10 backdrop-blur-sm border border-yellow-400/30 rounded-lg px-3 py-2 w-20 text-center flex flex-col justify-center h-14">
                <Zap className="w-3 h-3 text-yellow-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-white">
                  L{userProgress?.level || 1}
                </div>
              </div>

              {/* Experience */}
              <div className="bg-white/10 backdrop-blur-sm border border-blue-400/30 rounded-lg px-3 py-2 w-20 text-center flex flex-col justify-center h-14">
                <div className="text-xs text-blue-300">XP</div>
                <div className="text-sm font-bold text-white">
                  {userProgress?.total_experience || 0}
                </div>
              </div>

              {/* Streak */}
              <div className="bg-white/10 backdrop-blur-sm border border-orange-400/30 rounded-lg px-3 py-2 w-20 text-center flex flex-col justify-center h-14">
                <Trophy className="w-3 h-3 text-orange-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-white">
                  {longestPlantStreak}d
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Leaderboard */}
              <div className="bg-white/10 backdrop-blur-sm border border-purple-400/30 rounded-lg text-center flex flex-col justify-center p-3.5">
                <Link
                  to="/leaderboard"
                  className="text-sm font-bold text-white"
                >
                  <Users className="size-4 text-purple-400 mx-auto hover:text-purple-300" />
                </Link>
              </div>

              {/* Audio Settings */}
              <div className="relative">
                <AudioSettings
                  isOpen={showAudioSettings}
                  onToggle={onToggleAudioSettings}
                  sounds={sounds}
                />
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors min-h-[40px] min-w-[40px]"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] ${
                  isLoggingOut
                    ? "bg-orange-500/20 text-orange-300 cursor-not-allowed"
                    : "bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white"
                }`}
                aria-label={isLoggingOut ? "Logging out..." : "Logout"}
              >
                {isLoggingOut ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Component */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        userProgress={userProgress}
        longestPlantStreak={longestPlantStreak}
      />
    </>
  );
};
