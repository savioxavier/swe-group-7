import React from "react";
import { motion } from "framer-motion";
import { Crown, Medal, Award, Flame, Trophy } from "lucide-react";
import { LeaderboardEntry } from "../../types/friend";
import { useAuth } from "../../contexts/AuthContext";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const { user } = useAuth();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = {
        1: "from-yellow-400 to-yellow-600",
        2: "from-gray-300 to-gray-500",
        3: "from-amber-500 to-amber-700",
      };
      return `bg-gradient-to-r ${
        colors[rank as keyof typeof colors]
      } text-white`;
    }
    return "bg-slate-600/50 text-slate-300";
  };

  const getRowGlow = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return "ring-2 ring-green-400/50 bg-green-500/10";
    if (rank === 1) return "ring-2 ring-yellow-400/50 bg-yellow-500/10";
    if (rank === 2) return "ring-2 ring-gray-400/50 bg-gray-500/10";
    if (rank === 3) return "ring-2 ring-amber-500/50 bg-amber-500/10";
    return "hover:bg-white/5";
  };

  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-12 text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-10 h-10 text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">
          No Leaderboard Data Yet
        </h3>
        <p className="text-green-200/80 text-lg">
          Complete some tasks to see your progress on the leaderboard!
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-3xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-8 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-xl flex items-center justify-center pulse-glow">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col pt-3">
            <h3 className="text-2xl font-bold text-left text-white">
              Garden Champions
            </h3>
            <p className="text-green-200/80 text-left">
              Top performers in your garden community
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-green-200 font-medium text-sm">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-green-200 font-medium text-sm">
                Player
              </th>
              <th className="px-4 py-3 text-right text-green-200 font-medium text-sm">
                Level
              </th>
              <th className="px-4 py-3 text-right text-green-200 font-medium text-sm">
                XP
              </th>
              <th className="px-4 py-3 text-right text-green-200 font-medium text-sm">
                Tasks
              </th>
              <th className="px-4 py-3 text-right text-green-200 font-medium text-sm">
                Plants
              </th>
              <th className="px-4 py-3 text-right text-green-200 font-medium text-sm">
                Streak
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {entries.map((entry, index) => {
              const isCurrentUser = entry.user_id === user?.id;
              return (
                <motion.tr
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    transition-all duration-300
                    ${getRowGlow(entry.rank, isCurrentUser)}
                  `}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      {getRankIcon(entry.rank)}
                      <span
                        className={`
                        px-2 py-1 rounded-lg text-sm font-semibold
                        ${getRankBadge(entry.rank)}
                      `}
                      >
                        #{entry.rank}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white text-sm
                        ${
                          entry.rank === 1
                            ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                            : entry.rank === 2
                            ? "bg-gradient-to-br from-gray-300 to-gray-600"
                            : entry.rank === 3
                            ? "bg-gradient-to-br from-amber-500 to-amber-700"
                            : "bg-gradient-to-br from-green-400 to-emerald-600"
                        }
                      `}
                      >
                        {(entry.display_name || entry.email)
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">
                            {entry.display_name || entry.email}
                          </span>
                          {isCurrentUser && (
                            <span className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded text-xs font-medium">
                              You
                            </span>
                          )}
                        </div>
                        {entry.display_name && (
                          <p className="text-green-200/60 text-xs">
                            {entry.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <span className="text-white font-semibold">
                      {entry.level}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <span className="text-white font-medium">
                      {entry.total_experience.toLocaleString()}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <span className="text-white font-medium">
                      {entry.tasks_completed.toLocaleString()}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <span className="text-white font-medium">
                      {entry.plants_grown.toLocaleString()}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <span className="text-white font-medium">
                        {entry.current_streak}
                      </span>
                      {entry.current_streak > 0 && (
                        <Flame className="w-4 h-4 text-orange-400" />
                      )}
                    </div>
                    <div className="text-xs text-green-200/50 mt-0.5">
                      Best: {entry.longest_streak}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Stats */}
      <div className="p-6 border-t border-white/10 bg-black/20">
        <div className="flex items-center justify-between text-sm text-green-200/80">
          <span>Total Players: {entries.length}</span>
          <span>
            Your Rank:{" "}
            {entries.find((e) => e.user_id === user?.id)?.rank || "Not ranked"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
