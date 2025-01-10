import React from "react";
import * as WebBrowser from "expo-web-browser";
import { Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { useOAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function SignInPage() {
  useWarmUpBrowser();
  const [signInError, setSignInError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const onPress = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setSignInError(null);

      console.log("Starting OAuth flow...");
      const { createdSessionId, signIn, signUp, setActive } =
        await startOAuthFlow({
          redirectUrl: Linking.createURL("/", { scheme: "myapp" }),
        });

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace("/(home)/home");
      }
    } catch (err) {
      console.error("Sign in error:", JSON.stringify(err, null, 2));
      setSignInError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <View className="flex-1 bg-white p-6">
      <View className="flex-1 justify-center items-center">
        <Text className="text-3xl font-bold mb-8 text-gray-800">
          Welcome Back
        </Text>

        <TouchableOpacity
          onPress={onPress}
          disabled={isLoading}
          className="w-full bg-white border-2 border-gray-200 py-4 px-6 rounded-xl flex-row items-center justify-center space-x-2 mb-4"
        >
          {isLoading ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <>
              <Text className="text-base font-semibold text-gray-700">
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {signInError && (
          <Text className="text-red-500 mt-4 text-center">{signInError}</Text>
        )}

        <Link href="/" asChild>
          <TouchableOpacity className="mt-6">
            <Text className="text-gray-500 text-base">Back to Home</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
