import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useEffect } from "react";
import { ChevronLeft, LogOut } from "lucide-react-native";

export default function ProfilePage() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  const profileImageUrl = user?.imageUrl;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Custom Header */}
      <LinearGradient
        colors={["#4a90e2", "#63a4ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-4 pb-20"
        style={{ paddingTop: insets.top }}
      >
        <TouchableOpacity
          className="absolute top-4 left-4 z-10 p-2 bg-white/20 rounded-full"
          style={{ marginTop: insets.top }}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <View className="items-center pt-8">
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl }}
              className="w-24 h-24 rounded-full mb-4 border-4 border-white"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-white items-center justify-center mb-4">
              <Text className="text-blue-500 text-3xl font-medium">
                {user?.firstName?.[0]?.toUpperCase()}
              </Text>
            </View>
          )}
          <Text className="text-2xl font-bold text-white">
            {user?.fullName}
          </Text>
          <Text className="text-white/80">
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>
      </LinearGradient>

      {/* Profile Information */}
      <Animated.View className="px-6 -mt-12" style={{ opacity: fadeAnim }}>
        <View className="bg-white rounded-3xl shadow-lg p-6 space-y-6">
          <View className="space-y-4">
            <Text className="text-lg font-semibold text-gray-800">
              Personal Information
            </Text>
            <View className="space-y-3">
              <InfoRow
                label="First Name"
                value={user?.firstName || undefined}
              />
              <InfoRow label="Last Name" value={user?.lastName || undefined} />
              <InfoRow label="User ID" value={user?.id || undefined} />
            </View>
          </View>

          {/* Email Addresses */}
          <View className="space-y-4">
            <Text className="text-lg font-semibold text-gray-800">
              Email Addresses
            </Text>
            {user?.emailAddresses.map((email) => (
              <View
                key={email.id}
                className="flex-row justify-between items-center"
              >
                <Text className="text-gray-600">{email.emailAddress}</Text>
                {email.verification && (
                  <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-green-600 text-xs font-medium">
                      Verified
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-red-500 py-3 rounded-xl mt-6 flex-row justify-center items-center space-x-2"
          >
            <LogOut size={20} color="white" />
            <Text className="text-white text-center font-semibold">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
      <Text className="text-gray-600">{label}</Text>
      <Text className="text-gray-800 font-medium">{value || "N/A"}</Text>
    </View>
  );
}
