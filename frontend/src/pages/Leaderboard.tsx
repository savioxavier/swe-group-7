import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Users, Leaf } from "lucide-react";
import type {
  UserProfile,
  Friendship,
  LeaderboardEntry,
} from "../types/friend";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900">
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-8 flex flex-col items-center space-y-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-green-400/30 border-t-green-400 rounded-full"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center space-x-2 text-green-200"
            >
              <Leaf className="w-5 h-5 text-green-400" />
              <span className="font-medium">Loading leaderboard...</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="glass rounded-3xl p-8 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl mb-6 pulse-glow"
            >
              <Trophy className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-white mb-3"
            >
              TaskGarden Leaderboard
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-green-200/80 text-lg"
            >
              Compete with friends and grow your garden together!
            </motion.p>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="glass rounded-2xl p-2">
            <nav className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab("leaderboard")}
                className={`
                  flex items-center space-x-2 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-300
                  ${
                    activeTab === "leaderboard"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                      : "text-green-200 hover:text-white hover:bg-white/10"
                  }
                `}
              >
                <Trophy className="w-4 h-4" />
                <span>Leaderboard</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab("friends")}
                className={`
                  flex items-center space-x-2 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-300 relative
                  ${
                    activeTab === "friends"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                      : "text-green-200 hover:text-white hover:bg-white/10"
                  }
                `}
              >
                <Users className="w-4 h-4" />
                <span>Friend Management</span>
                {incomingRequests.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center pulse-glow"
                  >
                    {incomingRequests.length}
                  </motion.span>
                )}
              </motion.button>
            </nav>
          </div>
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === "leaderboard" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === "leaderboard" ? 20 : -20 }}
            transition={{ duration: 0.3 }}
          >
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
