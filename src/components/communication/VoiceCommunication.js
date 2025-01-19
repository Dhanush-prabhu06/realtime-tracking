import React, { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const VoiceCommunication = ({ driverId, driverName }) => {
  const [client, setClient] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");

  const appId = "360b82d858e442b1af33093eb3b3781b"; // Replace with your Agora App ID
  const channelName = "driver_channel"; // You can make this dynamic based on area/route

  //   useEffect(() => {
  //     // Initialize Agora client
  //     const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  //     setClient(agoraClient);

  //     // Cleanup function
  //     return () => {
  //       if (localAudioTrack) {
  //         localAudioTrack.close();
  //       }
  //       if (client) {
  //         client.leave();
  //       }
  //     };
  //   }, []);

  useEffect(() => {
    // Initialize Agora client with specific playback config
    const agoraClient = AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
      role: "host",
    });

    // Set the audio output configuration
    AgoraRTC.setParameter("AUDIO_OUTPUT_TYPE", 2); // Force speaker output

    setClient(agoraClient);

    return () => {
      if (localAudioTrack) {
        localAudioTrack.close();
      }
      if (client) {
        client.leave();
      }
    };
  }, []);

  useEffect(() => {
    if (!client) return;

    const handleUserPublished = async (user, mediaType) => {
      if (mediaType === "audio") {
        await client.subscribe(user, mediaType);
        user.audioTrack.play();
      }
    };

    const handleUserUnpublished = async (user, mediaType) => {
      if (mediaType === "audio") {
        await client.unsubscribe(user, mediaType);
      }
    };

    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);

    return () => {
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
    };
  }, [client]);

  const joinChannel = async () => {
    try {
      if (!client) return;
      const uid = await client.join(appId, channelName, null, driverId);

      // Create audio track with specific configurations
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: {
          sampleRate: 48000,
          stereo: true,
          bitrate: 128,
        },
        AEC: true, // Echo cancellation
        AGC: true, // Auto gain control
        ANS: true, // Noise suppression
        audioOptimizationMode: "VoiceCall", // Optimize for voice
        speakerphone: true, // Force speaker output
      });

      // Set playback device to speaker
      await audioTrack.setPlaybackDevice("speaker");

      setLocalAudioTrack(audioTrack);
      await client.publish(audioTrack);

      setJoined(true);
      setError("");
    } catch (err) {
      setError("Failed to join voice channel: " + err.message);
    }
  };

  const leaveChannel = async () => {
    try {
      if (localAudioTrack) {
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }
      await client?.leave();
      setJoined(false);
      setMuted(false);
      setError("");
    } catch (err) {
      setError("Failed to leave channel: " + err.message);
    }
  };

  const toggleMute = async () => {
    if (localAudioTrack) {
      if (muted) {
        await localAudioTrack.setEnabled(true);
      } else {
        await localAudioTrack.setEnabled(false);
      }
      setMuted(!muted);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          Driver Voice Communication
        </h2>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center gap-4">
          {!joined ? (
            <button
              onClick={joinChannel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Join Voice Channel
            </button>
          ) : (
            <button
              onClick={leaveChannel}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
                />
              </svg>
              Leave Channel
            </button>
          )}

          {joined && (
            <button
              onClick={toggleMute}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center ${
                muted
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500"
                  : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
              }`}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {muted ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                )}
              </svg>
              {muted ? "Unmute" : "Mute"}
            </button>
          )}
        </div>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        {joined && (
          <p className="text-green-600 text-sm text-center">
            Connected to voice channel
          </p>
        )}
      </div>
    </div>
  );
};

export default VoiceCommunication;
