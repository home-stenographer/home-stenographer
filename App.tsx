import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://0ec90b57d6e95fcbda19832f.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Recording {
  id: string;
  filename: string;
  duration: number;
  timestamp: string;
  uri?: string;
}

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingObject, setRecordingObject] =
    useState<Audio.Recording | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecordings();
    setupAudio();
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
    } catch (err) {
      console.error("Failed to setup audio:", err);
    }
  };

  const startRecording = async () => {
    try {
      setLoading(true);
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();
      setRecordingObject(recording);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = async () => {
    try {
      setLoading(true);
      if (!recordingObject) return;

      await recordingObject.stopAndUnloadAsync();
      const uri = recordingObject.getURI();

      if (!uri) {
        console.error("No recording URI");
        return;
      }

      const filename = `recording_${Date.now()}.m4a`;
      const timestamp = new Date().toISOString();

      const info = await FileSystem.getInfoAsync(uri);
      const duration = 0;

      const newRecording: Recording = {
        id: Date.now().toString(),
        filename,
        duration,
        timestamp,
        uri,
      };

      setRecordings([newRecording, ...recordings]);
      setRecordingObject(null);
      setIsRecording(false);

      await saveRecordingToDatabase(newRecording);
    } catch (err) {
      console.error("Failed to stop recording:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveRecordingToDatabase = async (recording: Recording) => {
    try {
      if (!recording.uri) return;

      const fileData = await FileSystem.readAsStringAsync(recording.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { error } = await supabase.from("recordings").insert([
        {
          filename: recording.filename,
          duration: recording.duration,
          timestamp: recording.timestamp,
          audio_data: fileData,
        },
      ]);

      if (error) console.error("Database error:", error);
    } catch (err) {
      console.error("Failed to save to database:", err);
    }
  };

  const playRecording = async (recording: Recording) => {
    try {
      setLoading(true);
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recording.uri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (err) {
      console.error("Failed to play recording:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecording = async (id: string) => {
    try {
      setRecordings(recordings.filter((r) => r.id !== id));
      const recording = recordings.find((r) => r.id === id);
      if (recording?.uri) {
        await FileSystem.deleteAsync(recording.uri);
      }

      await supabase
        .from("recordings")
        .delete()
        .eq("filename", recording?.filename);
    } catch (err) {
      console.error("Failed to delete recording:", err);
    }
  };

  const loadRecordings = async () => {
    try {
      const { data, error } = await supabase
        .from("recordings")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error loading recordings:", error);
        return;
      }

      const mappedRecordings: Recording[] = (data || []).map((r: any) => ({
        id: r.id,
        filename: r.filename,
        duration: r.duration || 0,
        timestamp: r.timestamp,
      }));

      setRecordings(mappedRecordings);
    } catch (err) {
      console.error("Failed to load recordings:", err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Home Stenographer</Text>
      </View>

      <View style={styles.recordingSection}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="large" />
          ) : (
            <Text style={styles.recordButtonText}>
              {isRecording ? "⏹ Stop" : "⏺ Record"}
            </Text>
          )}
        </TouchableOpacity>
        {isRecording && <Text style={styles.recordingIndicator}>Recording...</Text>}
      </View>

      <ScrollView style={styles.listSection}>
        <Text style={styles.sectionTitle}>Recordings</Text>
        {recordings.length === 0 ? (
          <Text style={styles.emptyText}>No recordings yet</Text>
        ) : (
          recordings.map((recording) => (
            <View key={recording.id} style={styles.recordingItem}>
              <View style={styles.recordingInfo}>
                <Text style={styles.recordingName} numberOfLines={1}>
                  {recording.filename}
                </Text>
                <Text style={styles.recordingDate}>
                  {new Date(recording.timestamp).toLocaleString()}
                </Text>
              </View>
              <View style={styles.recordingActions}>
                <TouchableOpacity
                  onPress={() => playRecording(recording)}
                  disabled={loading || isPlaying}
                >
                  <Text style={styles.actionButton}>▶</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteRecording(recording.id)}
                  disabled={loading}
                >
                  <Text style={styles.deleteButton}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  recordingSection: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    gap: 12,
  },
  recordButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordButtonActive: {
    backgroundColor: "#FF3B30",
  },
  recordButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  recordingIndicator: {
    fontSize: 14,
    color: "#FF3B30",
    fontWeight: "600",
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 24,
  },
  recordingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  recordingInfo: {
    flex: 1,
  },
  recordingName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  recordingDate: {
    fontSize: 12,
    color: "#999",
  },
  recordingActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    fontSize: 18,
    color: "#007AFF",
    paddingHorizontal: 12,
  },
  deleteButton: {
    fontSize: 18,
    color: "#FF3B30",
    paddingHorizontal: 12,
  },
});
