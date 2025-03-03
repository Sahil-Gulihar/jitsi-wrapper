// app/routes/index.jsx
import { useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import JitsiMeetComponent from "~/components/JitsiMeetComponent";

interface LoaderData {
  defaultRoomName: string;
  jitsiDomain: string;
  appName: string;
}

/**
 * Loader function that provides server-side data to the page
 * Now using environment variables for configuration
 */
export const loader = async ({ context }) => {
  return json({
    defaultRoomName: `room-${Math.floor(Math.random() * 10000)}`, // Generate a random room name
    jitsiDomain: context?.env?.JITSI_DOMAIN || "meet.jit.si", // Use environment variable or default
  });
};

/**
 * Main page component that renders a Jitsi Meet conference and provides
 * controls for creating/joining meetings
 */
export default function Index() {
  const { defaultRoomName, jitsiDomain, appName } = useLoaderData<LoaderData>();

  // State to track user inputs and conference settings
  const [roomName, setRoomName] = useState(defaultRoomName);
  const [displayName, setDisplayName] = useState("Guest");
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [customServer, setCustomServer] = useState("");
  const [useCustomServer, setUseCustomServer] = useState(false);

  /**
   * Handles joining a meeting room
   */
  const handleJoinMeeting = (e) => {
    e.preventDefault();
    if (roomName.trim() === "") {
      alert("Please enter a room name");
      return;
    }
    setIsInMeeting(true);
  };

  /**
   * Handles leaving the current meeting
   */
  const handleLeaveMeeting = () => {
    setIsInMeeting(false);
  };

  // Determine which Jitsi server to use
  const activeDomain =
    useCustomServer && customServer.trim() !== ""
      ? customServer.trim()
      : jitsiDomain;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Google Meet Clone</h1>
        <p className="text-gray-600">
          A simple Google meet clone using REMIX and JITSI
        </p>
      </div>

      {!isInMeeting ? (
        <div className="max-w-md mx-auto bg-white rounded-lg overflow-hidden shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Join a Meeting</h2>

          <form onSubmit={handleJoinMeeting} className="space-y-4">
            <div>
              <label
                htmlFor="roomName"
                className="block text-sm font-medium mb-1"
              >
                Room Name
              </label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

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

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="audioMuted"
                  checked={audioMuted}
                  onChange={(e) => setAudioMuted(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="audioMuted" className="text-sm">
                  Mute Audio
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="videoMuted"
                  checked={videoMuted}
                  onChange={(e) => setVideoMuted(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="videoMuted" className="text-sm">
                  Mute Video
                </label>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="useCustomServer"
                  checked={useCustomServer}
                  onChange={(e) => setUseCustomServer(e.target.checked)}
                  className="mr-2"
                />
                <label
                  htmlFor="useCustomServer"
                  className="text-sm font-medium"
                >
                  Use Custom Jitsi Server
                </label>
              </div>

              {useCustomServer && (
                <div>
                  <input
                    type="text"
                    value={customServer}
                    onChange={(e) => setCustomServer(e.target.value)}
                    placeholder="e.g., jitsi.yourdomain.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                  />
                  <p className="text-xs text-gray-500">
                    Using a custom or self-hosted Jitsi server can avoid service
                    limitations
                  </p>
                </div>
              )}
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
              <h2 className="text-xl font-semibold">Room: {roomName}</h2>
              <p className="text-sm text-gray-300">
                Joined as: {displayName} | Server: {activeDomain}
              </p>
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
              roomName={roomName}
              displayName={displayName}
              domain={activeDomain}
              startWithAudioMuted={audioMuted}
              startWithVideoMuted={videoMuted}
            />
          </div>
        </div>
      )}
    </div>
  );
}
