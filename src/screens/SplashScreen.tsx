import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, ActivityIndicator} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {useAuth} from '../contexts/AuthContext';
import {Colors} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC<Props> = ({navigation}) => {
  const {loading} = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        navigation.replace('Landing');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {opacity: fadeAnim, transform: [{scale: scaleAnim}]},
        ]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>⚔️</Text>
        </View>
        <Text style={styles.title}>سجال</Text>
        <Text style={styles.subtitle}>SEJAL</Text>
        <Text style={styles.tagline}>تحدي المعرفة والمناظرة</Text>
      </Animated.View>

      <ActivityIndicator
        size="large"
        color={Colors.orange500}
        style={styles.spinner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.slate900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  logoIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.orange500,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.slate400,
    letterSpacing: 8,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 14,
    color: Colors.slate500,
    textAlign: 'center',
  },
  spinner: {
    position: 'absolute',
    bottom: 80,
  },
});

export default SplashScreen;
