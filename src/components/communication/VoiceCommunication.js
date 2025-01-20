import React, { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { UserRound, Mic, MicOff, Phone, PhoneOff } from "lucide-react";

const VoiceCommunication = () => {
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
      backgroundColor: isSpeaking ? "bg-green-50" : "bg-white",
      borderColor: isSpeaking ? "border-green-500" : "border-gray-200",
      micIcon: isMuted ? (
        <MicOff className="w-4 h-4 text-gray-400" />
      ) : isSpeaking ? (
        <Mic className="w-4 h-4 text-green-500" />
      ) : (
        <Mic className="w-4 h-4 text-gray-400" />
      ),
    };
  };

  if (!currentDriver) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          Driver Voice Communication
        </h2>
      </div>

      <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from(participants.values()).map((participant) => {
          const status = getParticipantStatus(participant);
          const displayText =
            participant.uid === currentDriver?.uid
              ? "You"
              : `Bus ${participant.busNumber}`;

          return (
            <div
              key={participant.uid}
              className={`p-4 rounded-lg border-2 ${status.backgroundColor} ${status.borderColor} flex flex-col items-center justify-center space-y-2`}
            >
              <div className="relative">
                <UserRound className="w-12 h-12 text-gray-600" />
                <div className="absolute -right-1 -bottom-1">
                  {status.micIcon}
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">
                {displayText}
              </span>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="flex justify-center gap-4">
          {!joined ? (
            <button
              onClick={joinChannel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
            >
              <Phone className="w-4 h-4 mr-2" />
              Join Voice Channel
            </button>
          ) : (
            <button
              onClick={leaveChannel}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
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
              {muted ? (
                <MicOff className="w-4 h-4 mr-2" />
              ) : (
                <Mic className="w-4 h-4 mr-2" />
              )}
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
