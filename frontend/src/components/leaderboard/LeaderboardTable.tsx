import React from "react";
import { LeaderboardEntry } from "../../types/friend";
import { useAuth } from "../../contexts/AuthContext";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const { user } = useAuth();

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="p-4 font-semibold">Rank</th>
            <th className="p-4 font-semibold">Player</th>
            <th className="p-4 font-semibold text-right">Level</th>
            <th className="p-4 font-semibold text-right">XP</th>
            <th className="p-4 font-semibold text-right">Tasks</th>
            <th className="p-4 font-semibold text-right">Plants</th>
            <th className="p-4 font-semibold text-right">Streak</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.user_id}
              className={`
                border-t
                ${
                  entry.user_id === user?.id
                    ? "bg-green-50"
                    : "hover:bg-gray-50"
                }
              `}
            >
              <td className="p-4">
                <div className="flex items-center gap-2">
                  {entry.rank === 1 && <span className="text-2xl">🏆</span>}
                  {entry.rank === 2 && <span className="text-2xl">🥈</span>}
                  {entry.rank === 3 && <span className="text-2xl">🥉</span>}
                  <span className={entry.rank <= 3 ? "font-bold" : ""}>
                    #{entry.rank}
                  </span>
                </div>
              </td>
              <td className="p-4">
                <div>
                  <span className="font-medium">
                    {entry.display_name || entry.email}
                  </span>
                  {entry.display_name && (
                    <span className="text-gray-500 text-sm ml-2">
                      ({entry.email})
                    </span>
                  )}
                  {entry.user_id === user?.id && (
                    <span className="text-green-600 text-sm ml-2">(You)</span>
                  )}
                </div>
              </td>
              <td className="p-4 text-right font-medium">{entry.level}</td>
              <td className="p-4 text-right">
                {entry.total_experience.toLocaleString()}
              </td>
              <td className="p-4 text-right">
                {entry.tasks_completed.toLocaleString()}
              </td>
              <td className="p-4 text-right">
                {entry.plants_grown.toLocaleString()}
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span>{entry.current_streak}</span>
                  {entry.current_streak > 0 && (
                    <span className="text-orange-500">🔥</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Best: {entry.longest_streak}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
