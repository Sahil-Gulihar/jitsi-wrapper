import { useEffect, useRef, useState } from "react";

interface IJitsiMeetAPI {
  new (domain: string, options: JitsiMeetAPIOptions): IJitsiMeetAPI;
  dispose(): void;
  getNumberOfParticipants(): number;
  addEventListeners(listeners: Record<string, (event: any) => void>): void;
}

interface JitsiMeetAPIOptions {
  roomName: string;
  width: string | number;
  height: string | number;
  parentNode: HTMLElement;
  userInfo?: {
    displayName?: string;
  };
  configOverwrite?: Record<string, any>;
  interfaceConfigOverwrite?: Record<string, any>;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: IJitsiMeetAPI;
  }
}

interface JitsiMeetProps {
  roomName: string;
  displayName?: string;
  domain?: string;
  startWithAudioMuted?: boolean;
  startWithVideoMuted?: boolean;
}

/**
 * JitsiMeetComponent - A React component that integrates Jitsi Meet video conferencing
 * with enhanced stability and reconnection capabilities
 *
 * @param {Object} props Component properties
 * @param {string} props.roomName The name of the Jitsi Meet room to join
 * @param {string} props.displayName The user's display name in the conference
 * @param {string} props.domain The domain hosting the Jitsi Meet instance (default: meet.jit.si)
 * @param {boolean} props.startWithAudioMuted Whether to start with audio muted (default: false)
 * @param {boolean} props.startWithVideoMuted Whether to start with video muted (default: false)
 */
const JitsiMeetComponent = ({
  roomName,
  displayName = "User",
  domain = "meet.jit.si",
  startWithAudioMuted = false,
  startWithVideoMuted = false,
}: JitsiMeetProps) => {
  // Reference to the container div that will hold the Jitsi Meet iframe
  const jitsiContainerRef = useRef(null);
  // Reference to the Jitsi Meet API instance
  const jitsiApiRef = useRef(null);
  // State to track connection status
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  // State to track reconnection attempts
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  // Maximum number of reconnection attempts
  const MAX_RECONNECT_ATTEMPTS = 3;
  // Flag to prevent multiple simultaneous reconnect attempts
  const isReconnectingRef = useRef(false);

  useEffect(() => {
    // Load the Jitsi Meet API script dynamically
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement("script");
      script.src = `https://${domain}/external_api.js`;
      script.async = true;

      script.onload = initializeJitsi;
      script.onerror = handleScriptError;
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    } else {
      // If the API is already loaded, initialize Jitsi
      initializeJitsi();
    }

    // Clean up function to dispose the Jitsi instance when component unmounts
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [roomName, displayName, domain, reconnectAttempts]); // Re-initialize when these props change or on reconnect

  /**
   * Handles errors loading the Jitsi script
   */
  const handleScriptError = (error) => {
    console.error("Failed to load Jitsi Meet API script:", error);
    setConnectionStatus("error");
  };

  /**
   * Initializes the Jitsi Meet API and creates a new meeting instance
   */
  const initializeJitsi = () => {
    if (!window.JitsiMeetExternalAPI) {
      console.error("Jitsi Meet API script not loaded yet");
      setConnectionStatus("error");
      return;
    }

    // Clean up previous instance if it exists
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }

    try {
      // Configuration options for Jitsi Meet with better defaults to avoid popups
      const options = {
        roomName: roomName,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: displayName,
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: startWithAudioMuted,
          startWithVideoMuted: startWithVideoMuted,
          // Disable JWT for public server
          disableThirdPartyRequests: true,
          // Disable features that might trigger popups
          disableDeepLinking: true,
          // Better defaults for free server
          startBitrate: 800,
          disableAudioLevels: true,
          enableLayerSuspension: true,
          // Disable recording to avoid service prompts
          fileRecordingsEnabled: false,
          liveStreamingEnabled: false,
          // Improve bandwidth usage
          disableSimulcast: false,
          resolution: 720,
          constraints: {
            video: {
              height: {
                ideal: 720,
                max: 720,
                min: 180,
              },
            },
          },
          toolbarButtons: [
            "microphone",
            "camera",
            "desktop",
            "fullscreen",
            "fodeviceselection",
            "hangup",
            "profile",
            "chat",
            "settings",
            "raisehand",
            "videoquality",
            "filmstrip",
            "tileview",
            "download",
            "help",
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_BUTTONS: [
            "microphone",
            "camera",
            "desktop",
            "fullscreen",
            "hangup",
            "profile",
            "chat",
            "settings",
            "raisehand",
            "videoquality",
            "filmstrip",
            "tileview",
          ],
          // Disable film strip only mode to avoid unintended UI changes
          FILM_STRIP_ONLY: false,
          // Hide invite options that might trigger popups
          HIDE_INVITE_MORE_HEADER: true,
        },
      };

      // Create the Jitsi Meet API instance
      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;
      setConnectionStatus("connected");
      isReconnectingRef.current = false;

      // Set up connection monitoring - check every 30 seconds
      const connectionMonitor = setInterval(() => {
        if (
          !jitsiApiRef.current ||
          !document.contains(jitsiContainerRef.current)
        ) {
          clearInterval(connectionMonitor);
          return;
        }

        // Check if iframe is still responsive
        try {
          jitsiApiRef.current.getNumberOfParticipants();
        } catch (e) {
          console.warn(
            "Jitsi connection check failed, attempting to recover:",
            e
          );
          handleConnectionIssue();
          clearInterval(connectionMonitor);
        }
      }, 30000);

      // Event handlers for connection tracking and error management
      api.addEventListeners({
        readyToClose: handleClose,
        videoConferenceJoined: handleVideoConferenceJoined,
        videoConferenceLeft: handleVideoConferenceLeft,
        connectionEstablished: () => {
          setConnectionStatus("connected");
          console.log("Jitsi connection established");
        },
        connectionFailed: handleConnectionFailure,
        suspendDetected: handleSuspendDetected,
        errorOccurred: handleErrorOccurred,
      });

      // Add overlay click handler to intercept Jitsi service popups
      const observer = new MutationObserver((mutations) => {
        const iframeDocument =
          jitsiContainerRef.current?.querySelector("iframe")?.contentDocument;
        if (iframeDocument) {
          // Look for popup dialogs or overlays that might indicate a service promotion
          const popups = iframeDocument.querySelectorAll(
            ".overlay-container, .dialog-container"
          );
          popups.forEach((popup) => {
            // Skip essential dialogs (like device permissions)
            if (
              !popup.textContent.includes("upgrade") &&
              !popup.textContent.includes("premium") &&
              !popup.textContent.includes("service")
            ) {
              return;
            }

            console.log("Detected and removing Jitsi service popup");
            // Try to close the popup or remove it from DOM if possible
            const closeButtons = popup.querySelectorAll("button");
            closeButtons.forEach((button) => {
              if (
                button.textContent.includes("Close") ||
                button.textContent.includes("Cancel") ||
                button.textContent.includes("Later")
              ) {
                button.click();
              }
            });

            // As a last resort, try to hide the popup
            if (popup.parentNode) {
              popup.style.display = "none";
            }
          });
        }
      });

      // Start observing for popups after a delay to let the interface initialize
      setTimeout(() => {
        const iframe = jitsiContainerRef.current?.querySelector("iframe");
        if (iframe) {
          try {
            observer.observe(iframe.contentDocument, {
              childList: true,
              subtree: true,
            });
          } catch (e) {
            console.warn(
              "Cannot access iframe content due to same-origin policy"
            );
          }
        }
      }, 3000);

      return () => {
        clearInterval(connectionMonitor);
        observer.disconnect();
      };
    } catch (error) {
      console.error("Error initializing Jitsi Meet:", error);
      setConnectionStatus("error");
    }
  };

  /**
   * Handles a detected connection issue and attempts reconnection
   */
  const handleConnectionIssue = () => {
    if (isReconnectingRef.current) return;

    isReconnectingRef.current = true;
    setConnectionStatus("reconnecting");
    console.log("Attempting to reconnect to Jitsi Meet...");

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      // Increment reconnect counter and trigger a reconnect
      setReconnectAttempts((prev) => prev + 1);
    } else {
      setConnectionStatus("failed");
      console.error("Maximum reconnection attempts reached");
    }
  };

  // Event handler functions
  const handleClose = () => {
    console.log("Jitsi Meet conference closed");
    setConnectionStatus("closed");
  };

  const handleVideoConferenceJoined = (conference) => {
    console.log("Video conference joined:", conference);
    setConnectionStatus("connected");
  };

  const handleVideoConferenceLeft = (conference) => {
    console.log("Video conference left:", conference);
    setConnectionStatus("left");
  };

  const handleConnectionFailure = (error) => {
    console.error("Connection failed:", error);
    handleConnectionIssue();
  };

  const handleErrorOccurred = (error) => {
    console.error("Jitsi error occurred:", error);

    // Check if error is related to service limitations or popups
    if (error.error?.includes("service") || error.error?.includes("limit")) {
      handleConnectionIssue();
    }
  };

  const handleSuspendDetected = () => {
    console.warn("System suspend detected");
    handleConnectionIssue();
  };

  // Render connection status message when not connected
  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case "connecting":
        return (
          <div className="p-4 text-center">Connecting to conference...</div>
        );
      case "reconnecting":
        return (
          <div className="p-4 text-center">
            Connection interrupted. Reconnecting... (Attempt {reconnectAttempts}
            /{MAX_RECONNECT_ATTEMPTS})
          </div>
        );
      case "error":
        return (
          <div className="p-4 text-center text-red-600">
            Failed to connect to the conference. Please try again.
          </div>
        );
      case "failed":
        return (
          <div className="p-4 text-center text-red-600">
            Could not reconnect after multiple attempts. Please reload the page.
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {connectionStatus !== "connected" && renderConnectionStatus()}

      <div
        ref={jitsiContainerRef}
        style={{
          width: "100%",
          height:
            connectionStatus === "connected" ? "100%" : "calc(100% - 40px)",
          minHeight: "600px",
          position: "relative",
        }}
        className="jitsi-meet-container"
      />
    </div>
  );
};

export default JitsiMeetComponent;
