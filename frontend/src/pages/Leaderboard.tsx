import React, { useEffect, useState } from "react";
import { UserProfile, Friendship, LeaderboardEntry } from "../types/friend";
import { api } from "../lib/api";
import { FriendManagement } from "../components/leaderboard/FriendManagement";
import { LeaderboardTable } from "../components/leaderboard/LeaderboardTable";
import { toast } from "sonner";

export function LeaderboardPage() {
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friendship[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friendship[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<
    LeaderboardEntry[]
  >([]);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "friends">(
    "leaderboard"
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadFriendData = async () => {
    try {
      const [friendsData, incomingData, outgoingData] = await Promise.all([
        api.getFriends(),
        api.getIncomingFriendRequests(),
        api.getOutgoingFriendRequests(),
      ]);
      setFriends(friendsData);
      setIncomingRequests(incomingData);
      setOutgoingRequests(outgoingData);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load friend data"
      );
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard();
      setLeaderboardEntries(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load leaderboard"
      );
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([loadFriendData(), loadLeaderboard()]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleRequestSent = () => {
    loadFriendData();
  };

  const handleRequestAccepted = async () => {
    await Promise.all([loadFriendData(), loadLeaderboard()]);
  };

  const handleRequestDeclined = () => {
    loadFriendData();
  };

  const handleFriendRemoved = async () => {
    await Promise.all([loadFriendData(), loadLeaderboard()]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">TaskGarden Leaderboard</h1>
        <p className="text-gray-600">
          Compete with friends and grow your garden together!
        </p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === "leaderboard"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === "friends"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              Friend Management
              {incomingRequests.length > 0 && (
                <span className="ml-2 bg-green-100 text-green-600 py-1 px-2 rounded-full text-xs">
                  {incomingRequests.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {activeTab === "leaderboard" ? (
        <LeaderboardTable entries={leaderboardEntries} />
      ) : (
        <FriendManagement
          friends={friends}
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          onRequestSent={handleRequestSent}
          onRequestAccepted={handleRequestAccepted}
          onRequestDeclined={handleRequestDeclined}
          onFriendRemoved={handleFriendRemoved}
        />
      )}
    </div>
  );
}
