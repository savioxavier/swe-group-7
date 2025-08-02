import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Mail,
  Check,
  X,
  Clock,
  Users,
  UserMinus,
  Send,
  Heart,
  UserCheck,
} from "lucide-react";
import { UserProfile, Friendship } from "../../types/friend";
import { api } from "../../lib/api";
import { toast } from "sonner";

interface FriendManagementProps {
  friends: UserProfile[];
  incomingRequests: Friendship[];
  outgoingRequests: Friendship[];
  onRequestSent: () => void;
  onRequestAccepted: () => void;
  onRequestDeclined: () => void;
  onFriendRemoved: () => void;
}

export function FriendManagement({
  friends,
  incomingRequests,
  outgoingRequests,
  onRequestSent,
  onRequestAccepted,
  onRequestDeclined,
  onFriendRemoved,
}: FriendManagementProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.sendFriendRequest(email);
      setEmail("");
      onRequestSent();
      toast.success("Friend request sent successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send friend request"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.acceptFriendRequest(requestId);
      onRequestAccepted();
      toast.success("Friend request accepted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to accept request"
      );
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await api.declineFriendRequest(requestId);
      onRequestDeclined();
      toast.success("Friend request declined");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to decline request"
      );
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await api.removeFriend(friendId);
      onFriendRemoved();
      toast.success("Friend removed successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove friend"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Friend Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">Add New Friend</h3>
        </div>

        <form
          onSubmit={handleSendRequest}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-4 h-4" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter friend's email address"
              className="w-full pl-10 pr-4 py-3 glass rounded-lg text-white placeholder-green-300/60 input-focus text-sm font-medium"
              required
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="btn-primary text-white font-semibold h-11 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Request</span>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Incoming Requests */}
      <AnimatePresence>
        {incomingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Incoming Requests
              </h3>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-blue-500/20 text-blue-300 px-3 py-0.5 rounded-full text-sm font-medium"
              >
                {incomingRequests.length}
              </motion.span>
            </div>

            <div className="space-y-3">
              {incomingRequests.map((request, index) => (
                <motion.div
                  key={request.action_user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-lg p-4 flex items-center justify-between hover:bg-white/5 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {request.profile?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="pt-2.5">
                      <span className="text-white font-medium">
                        {request.profile?.email}
                      </span>
                      <p className="text-green-200/60 text-sm">
                        Wants to be your friend
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        handleAcceptRequest(request.action_user_id)
                      }
                      className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-1"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        handleDeclineRequest(request.action_user_id)
                      }
                      className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Decline</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outgoing Requests */}
      <AnimatePresence>
        {outgoingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Pending Requests</h3>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-yellow-500/20 text-yellow-300 px-3 py-0.5 rounded-full text-sm font-medium"
              >
                {outgoingRequests.length}
              </motion.span>
            </div>

            <div className="space-y-3">
              {outgoingRequests.map((request, index) => (
                <motion.div
                  key={request.action_user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {request.profile?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="pt-2.5">
                      <span className="text-white font-medium">
                        {request.profile?.email}
                      </span>
                      <p className="text-green-200/60 text-sm">Request sent</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-yellow-300">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Pending</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friends List */}
      <AnimatePresence>
        {friends.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Your Garden Friends
              </h3>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-pink-500/20 text-pink-300 px-3 py-0.5 rounded-full text-sm font-medium"
              >
                {friends.length}
              </motion.span>
            </div>

            <div className="space-y-3">
              {friends.map((friend, index) => (
                <motion.div
                  key={friend.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-lg p-4 flex items-center justify-between hover:bg-white/5 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {(friend.display_name || friend.email)
                          ?.charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-white font-medium">
                        {friend.display_name || friend.email}
                      </span>
                      {friend.display_name && (
                        <p className="text-green-200/60 text-sm">
                          {friend.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRemoveFriend(friend.user_id)}
                    className="px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-300 flex items-center space-x-1 border border-red-400/30"
                  >
                    <UserMinus className="w-4 h-4" />
                    <span>Remove</span>
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {friends.length === 0 &&
        incomingRequests.length === 0 &&
        outgoingRequests.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Start Building Your Garden Community
            </h3>
            <p className="text-green-200/80 mb-4">
              Add friends to compete together and grow your gardens side by
              side!
            </p>
            <div className="text-green-300/60 text-sm">
              Enter an email address above to send your first friend request
            </div>
          </motion.div>
        )}
    </div>
  );
}
