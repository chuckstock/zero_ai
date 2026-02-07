import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Alert } from 'react-native';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SwipeScreen } from './src/screens/SwipeScreen';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { usePhotos } from './src/hooks/usePhotos';
import { usePurchase } from './src/hooks/usePurchase';
import { useStats } from './src/hooks/useStats';
import { storageService } from './src/services/storageService';

const Stack = createNativeStackNavigator();

export default function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const { requestPermissions } = usePhotos();
  const { isPremium, loading: purchaseLoading, purchase, restore, productInfo } = usePurchase();
  const { stats, reset, formatStorage } = useStats();

  // Check if onboarding is complete
  useEffect(() => {
    const checkOnboarding = async () => {
      const complete = await storageService.isOnboardingComplete();
      setOnboardingComplete(complete);
      setLoading(false);
    };

    checkOnboarding();
  }, []);

  const handleOnboardingComplete = async () => {
    await storageService.setOnboardingComplete();
    setOnboardingComplete(true);
  };

  const handleResetStats = () => {
    Alert.alert(
      'Reset Stats',
      'Are you sure you want to reset your session stats?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: reset,
        },
      ]
    );
  };

  if (loading || purchaseLoading) {
    return null; // Could show a splash screen here
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {!onboardingComplete ? (
            <Stack.Screen name="Onboarding">
              {(props) => (
                <OnboardingScreen
                  {...props}
                  onComplete={handleOnboardingComplete}
                  requestPermissions={requestPermissions}
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Swipe">
                {({ navigation }) => (
                  <SwipeScreen
                    isPremium={isPremium}
                    onShowPaywall={() => navigation.navigate('Paywall')}
                    onShowStats={() => navigation.navigate('Stats')}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen
                name="Paywall"
                options={{ presentation: 'modal' }}
              >
                {({ navigation }) => (
                  <PaywallScreen
                    onPurchase={purchase}
                    onRestore={restore}
                    onClose={() => navigation.goBack()}
                    productInfo={productInfo}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="Stats">
                {({ navigation }) => (
                  <StatsScreen
                    stats={stats}
                    formatStorage={formatStorage}
                    onClose={() => navigation.goBack()}
                    onReset={handleResetStats}
                  />
                )}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
