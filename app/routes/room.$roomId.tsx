// app/routes/room.$roomId.jsx
import { useParams } from "@remix-run/react";
import { useState, useEffect } from "react";
import JitsiMeetComponent from "~/components/JitsiMeetComponent";

/**
 * Room component that provides direct access to a specific Jitsi meeting room
 * This allows users to join meetings via URL (e.g., /room/my-meeting-name)
 */
export default function Room() {
  const { roomId } = useParams();
  const [displayName, setDisplayName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);

  // When the component loads, check if there's a stored name
  useEffect(() => {
    const storedName = localStorage.getItem("jitsi-display-name");
    if (storedName) {
      setDisplayName(storedName);
    }
  }, []);

  /**
   * Handles joining the meeting with the provided display name
   */
  const handleJoinMeeting = (e) => {
    e.preventDefault();
    if (displayName.trim() === "") {
      alert("Please enter your name");
      return;
    }

    // Store the display name for future use
    localStorage.setItem("jitsi-display-name", displayName);
    setHasJoined(true);
  };

  /**
   * Handles leaving the current meeting
   */
  const handleLeaveMeeting = () => {
    setHasJoined(false);
  };

  return (
    <div className="container mx-auto p-4">
      {!hasJoined ? (
        <div className="max-w-md mx-auto bg-white rounded-lg overflow-hidden shadow-lg p-6 mt-10">
          <h2 className="text-xl font-semibold mb-4">Join Meeting: {roomId}</h2>

          <form onSubmit={handleJoinMeeting} className="space-y-4">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium mb-1"
              >
                Your Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
            >
              Join Meeting
            </button>
          </form>
        </div>
      ) : (
        <div className="conference-container">
          <div className="bg-gray-800 text-white p-4 flex justify-between items-center mb-2">
            <div>
              <h2 className="text-xl font-semibold">Room: {roomId}</h2>
              <p className="text-sm text-gray-300">Joined as: {displayName}</p>
            </div>
            <button
              onClick={handleLeaveMeeting}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            >
              Leave Meeting
            </button>
          </div>

          <div className="conference-wrapper" style={{ height: "80vh" }}>
            <JitsiMeetComponent
              roomName={roomId}
              displayName={displayName}
              domain="meet.jit.si"
            />
          </div>
        </div>
      )}
    </div>
  );
}
