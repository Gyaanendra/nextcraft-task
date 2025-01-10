// index.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
// import HomePage from "./home";  // Import the HomePage component

const IndexPage = () => {
  const { user } = useUser();
  const router = useRouter();

  const navigateToProfile = () => {
    router.push("/(home)/home"); // Navigate programmatically
  };
  return (
    <View className="flex-1 justify-center items-center">
      <SignedIn>
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          Welcome, {user?.firstName}
        </Text>
        <TouchableOpacity
          className="bg-blue-500 py-3 px-8 rounded-xl"
          onPress={navigateToProfile}
        >
          <Text className="text-white font-semibold text-lg">
            Go to Dashboard
          </Text>
        </TouchableOpacity>
      </SignedIn>

      <SignedOut>
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          Get Started
        </Text>
        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity className="bg-blue-500 py-3 px-8 rounded-xl">
            <Text className="text-white font-semibold text-lg">
              Get Started RetailDaddy
            </Text>
          </TouchableOpacity>
        </Link>
      </SignedOut>
    </View>
  );
};

export default IndexPage;
