import React, { useState } from "react";
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
      <div className="p-4 bg-green-700 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Add Friend</h3>
        <form onSubmit={handleSendRequest} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter friend's email"
            className="flex-1 px-3 py-2 border rounded-md bg-green-500 text-white"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Request"}
          </button>
        </form>
      </div>

      {incomingRequests.length > 0 && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Incoming Requests</h3>
          <div className="space-y-2">
            {incomingRequests.map((request) => (
              <div
                key={request.action_user_id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span>{request.profile?.email}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => handleAcceptRequest(request.action_user_id)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(request.action_user_id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {outgoingRequests.length > 0 && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Outgoing Requests</h3>
          <div className="space-y-2">
            {outgoingRequests.map((request) => (
              <div
                key={request.action_user_id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span>{request.profile?.email}</span>
                <span className="text-gray-500">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {friends.length > 0 && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Friends</h3>
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.user_id}
                className="flex items-center justify-between p-2 bg-green-50 rounded"
              >
                <div>
                  <span className="font-medium">
                    {friend.display_name || friend.email}
                  </span>
                  {friend.display_name && (
                    <span className="text-gray-500 text-sm ml-2">
                      ({friend.email})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveFriend(friend.user_id)}
                  className="px-3 py-1 text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
