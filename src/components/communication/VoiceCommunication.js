import React, { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  UserRound,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  ArrowLeft,
  Radio,
  Volume2,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const VoiceCommunication = () => {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState(new Map());
  const [activeSpeakers, setActiveSpeakers] = useState(new Set());
  const [mutedParticipants, setMutedParticipants] = useState(new Set());
  const [currentDriver, setCurrentDriver] = useState(null);
  const [busNumbers, setBusNumbers] = useState(new Map());
  const [usedRandomNumbers] = useState(new Set());
  const [isConnecting, setIsConnecting] = useState(false);

  const appId = "360b82d858e442b1af33093eb3b3781b";
  const channelName = "driver_channel";

  const getRandomBusNumber = () => {
    const availableNumbers = Array.from({ length: 9 }, (_, i) => i + 1).filter(
      (num) => !usedRandomNumbers.has(num)
    );

    if (availableNumbers.length === 0) {
      usedRandomNumbers.clear();
      return getRandomBusNumber();
    }

    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const randomNumber = availableNumbers[randomIndex];
    usedRandomNumbers.add(randomNumber);
    return randomNumber.toString();
  };

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (loggedInUser && loggedInUser.role === "driver") {
      setCurrentDriver({
        uid: loggedInUser.uid,
        busNumber: loggedInUser.busNumber,
      });
      setBusNumbers(new Map([[loggedInUser.uid, loggedInUser.busNumber]]));
    }
  }, []);

  useEffect(() => {
    const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
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

        setParticipants((prev) => {
          const busNumber = busNumbers.get(user.uid) || getRandomBusNumber();
          return new Map(
            prev.set(user.uid, {
              uid: user.uid,
              busNumber: busNumber,
              audioEnabled: true,
            })
          );
        });

        setMutedParticipants((prev) => {
          const updated = new Set(prev);
          updated.delete(user.uid);
          return updated;
        });
      }
    };

    const handleUserUnpublished = async (user, mediaType) => {
      if (mediaType === "audio") {
        setMutedParticipants((prev) => new Set(prev.add(user.uid)));
        setActiveSpeakers((prev) => {
          const updated = new Set(prev);
          updated.delete(user.uid);
          return updated;
        });

        setParticipants((prev) => {
          const updated = new Map(prev);
          const participant = updated.get(user.uid);
          if (participant) {
            updated.set(user.uid, { ...participant, audioEnabled: false });
          }
          return updated;
        });
      }
    };

    const handleUserJoined = (user) => {
      const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
      const isCurrentUser = loggedInUser && loggedInUser.uid === user.uid;
      let busNumber = isCurrentUser
        ? loggedInUser.busNumber
        : busNumbers.get(user.uid);

      if (!busNumber) {
        busNumber = getRandomBusNumber();
      }

      setParticipants(
        (prev) =>
          new Map(
            prev.set(user.uid, {
              uid: user.uid,
              busNumber: busNumber,
              audioEnabled: false,
            })
          )
      );

      setBusNumbers((prev) => new Map(prev.set(user.uid, busNumber)));
    };

    const handleUserLeft = (user) => {
      setParticipants((prev) => {
        const updated = new Map(prev);
        updated.delete(user.uid);
        return updated;
      });
      setMutedParticipants((prev) => {
        const updated = new Set(prev);
        updated.delete(user.uid);
        return updated;
      });
      setActiveSpeakers((prev) => {
        const updated = new Set(prev);
        updated.delete(user.uid);
        return updated;
      });
    };

    const handleVolumeIndicator = (volumes) => {
      const speakingUsers = new Set();
      volumes.forEach((volume) => {
        if (volume.level > 5) {
          speakingUsers.add(volume.uid);
        }
      });
      setActiveSpeakers(speakingUsers);
    };

    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    client.on("user-joined", handleUserJoined);
    client.on("user-left", handleUserLeft);
    client.enableAudioVolumeIndicator();
    client.on("volume-indicator", handleVolumeIndicator);

    return () => {
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
      client.off("user-joined", handleUserJoined);
      client.off("user-left", handleUserLeft);
      client.off("volume-indicator", handleVolumeIndicator);
    };
  }, [client, busNumbers]);

  const joinChannel = async () => {
    if (!currentDriver) {
      setError("Driver information not available");
      return;
    }

    try {
      if (!client) return;
      const uid = await client.join(
        appId,
        channelName,
        null,
        currentDriver.uid
      );
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalAudioTrack(audioTrack);
      await client.publish(audioTrack);
      setJoined(true);
      setError("");
      setMuted(false);

      setParticipants(
        (prev) =>
          new Map(
            prev.set(uid, {
              uid: uid,
              busNumber: currentDriver.busNumber,
              audioEnabled: true,
            })
          )
      );

      setBusNumbers((prev) => new Map(prev.set(uid, currentDriver.busNumber)));

      setMutedParticipants((prev) => {
        const updated = new Set(prev);
        updated.delete(uid);
        return updated;
      });
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
      setParticipants(new Map());
      setActiveSpeakers(new Set());
      setMutedParticipants(new Set());
    } catch (err) {
      setError("Failed to leave channel: " + err.message);
    }
  };

  const toggleMute = async () => {
    if (localAudioTrack && currentDriver) {
      try {
        const newMutedState = !muted;
        await localAudioTrack.setEnabled(!newMutedState);

        setMutedParticipants((prev) => {
          const updated = new Set(prev);
          if (newMutedState) {
            updated.add(currentDriver.uid);
          } else {
            updated.delete(currentDriver.uid);
          }
          return updated;
        });

        setParticipants((prev) => {
          const updated = new Map(prev);
          const participant = updated.get(currentDriver.uid);
          if (participant) {
            updated.set(currentDriver.uid, {
              ...participant,
              audioEnabled: !newMutedState,
            });
          }
          return updated;
        });

        setMuted(newMutedState);

        if (newMutedState) {
          setActiveSpeakers((prev) => {
            const updated = new Set(prev);
            updated.delete(currentDriver.uid);
            return updated;
          });
        }
      } catch (err) {
        setError("Failed to toggle mute: " + err.message);
      }
    }
  };

  const getParticipantStatus = (participant) => {
    const isMuted = mutedParticipants.has(participant.uid);
    const isSpeaking = activeSpeakers.has(participant.uid) && !isMuted;
    return {
      backgroundColor: isSpeaking ? "bg-green-100" : "bg-white",
      borderColor: isSpeaking ? "border-green-500" : "border-gray-200",
      ringColor: isSpeaking ? "ring-green-400" : "ring-transparent",
      micIcon: isMuted ? (
        <MicOff className="w-5 h-5 text-gray-400" />
      ) : isSpeaking ? (
        <Mic className="w-5 h-5 text-green-500" />
      ) : (
        <Mic className="w-5 h-5 text-gray-400" />
      ),
    };
  };

  const WelcomeState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Radio className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome to Driver Communication
          </h2>
          <p className="text-gray-600">
            Connect with other drivers in real-time through voice chat
          </p>
        </div>

        {/* Features Grid
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
            <Volume2 className="w-8 h-8 text-blue-500 mb-2" />
            <h3 className="font-semibold mb-1">Clear Audio</h3>
            <p className="text-sm text-gray-600">
              High-quality voice communication
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
            <Users className="w-8 h-8 text-blue-500 mb-2" />
            <h3 className="font-semibold mb-1">Group Chat</h3>
            <p className="text-sm text-gray-600">
              Connect with multiple drivers
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
            <Mic className="w-8 h-8 text-blue-500 mb-2" />
            <h3 className="font-semibold mb-1">Easy Controls</h3>
            <p className="text-sm text-gray-600">
              Simple mute and unmute options
            </p>
          </div>
        </div> */}

        {/* Join Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={joinChannel}
            disabled={isConnecting}
            className="px-8 py-4 bg-green-600 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center space-x-3 transition-colors disabled:opacity-50 text-lg font-medium"
          >
            <Phone className="w-6 h-6" />
            <span>{isConnecting ? "Connecting..." : "Join Channel"}</span>
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Click to join the voice channel and start communicating
          </p>
        </div>
      </div>
    </div>
  );

  const ActiveCommunicationState = () => (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* Status Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-700 font-medium">
            Connected to voice channel
          </span>
        </div>
      </div>

      {/* Participants Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {Array.from(participants.values()).map((participant) => {
          const isMuted = mutedParticipants.has(participant.uid);
          const isSpeaking = activeSpeakers.has(participant.uid) && !isMuted;
          const displayText =
            participant.uid === currentDriver?.uid
              ? "You"
              : `Bus ${participant.busNumber}`;

          return (
            <div
              key={participant.uid}
              className={`p-6 rounded-xl border-2 ${
                isSpeaking
                  ? "bg-green-100 border-green-500"
                  : "bg-white border-gray-200"
              } ring-2 ${
                isSpeaking ? "ring-green-400" : "ring-transparent"
              } transition-all duration-200 transform hover:scale-105`}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <div className="p-3 bg-gray-100 rounded-full">
                    <UserRound className="w-12 h-12 text-gray-700" />
                  </div>
                  <div className="absolute -right-1 -bottom-1 p-1.5 bg-white rounded-full shadow-sm">
                    {isMuted ? (
                      <MicOff className="w-5 h-5 text-gray-400" />
                    ) : isSpeaking ? (
                      <Mic className="w-5 h-5 text-green-500" />
                    ) : (
                      <Mic className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {displayText}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center space-y-4">
        <div className="flex justify-center gap-4">
          <button
            onClick={leaveChannel}
            className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center space-x-2 transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
            <span>Leave Channel</span>
          </button>

          <button
            onClick={toggleMute}
            className={`px-6 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center space-x-2 transition-colors ${
              muted
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500"
                : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
            }`}
          >
            {muted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            <span>{muted ? "Unmute" : "Mute"}</span>
          </button>
        </div>

        {error && (
          <div className="w-full max-w-md bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate("/driver/dashboard")}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Driver Communication Hub
          </h1>
        </div>

        {/* Main Content */}
        {!joined ? <WelcomeState /> : <ActiveCommunicationState />}
      </div>
    </div>
  );
};

export default VoiceCommunication;
