import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Card, GradientButton, Screen, Title } from '@/components/ui';
import { router, useLocalSearchParams } from 'expo-router';

export default function OuvertureScreen() {
  const { nom = 'Joueur mystere', note = '0', rarete = 'Bronze' } = useLocalSearchParams<{ nom: string; note: string; rarete: string }>();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(spin, { toValue: 1, duration: 900, useNativeDriver: true }).start();
  }, [spin]);

  const rotateFront = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const rotateBack = spin.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <Screen>
      <Title>Pret pour la revelation ?</Title>
      <View style={styles.stage}>
        <Animated.View style={[styles.face, { transform: [{ perspective: 1000 }, { rotateY: rotateFront }] }]}>
          <Card>
            <Text style={{ color: '#FFD700', fontWeight: '900' }}>PACK</Text>
            <Text style={{ color: '#F5F5F5', fontSize: 24, fontWeight: '800' }}>DTM</Text>
            <Text style={{ color: '#A8A8A8' }}>Saison 2026-27</Text>
          </Card>
        </Animated.View>

        <Animated.View style={[styles.face, { transform: [{ perspective: 1000 }, { rotateY: rotateBack }] }]}>
          <Card>
            <Text style={{ color: '#FFD700', fontWeight: '900' }}>{rarete}</Text>
            <Text style={{ color: '#F5F5F5', fontSize: 24, fontWeight: '800' }}>{nom}</Text>
            <Text style={{ color: '#A8A8A8' }}>{`Note ${note}`}</Text>
          </Card>
        </Animated.View>
      </View>
      <GradientButton title="Retour a la boutique" onPress={() => router.replace('/(tabs)/team')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: 'relative',
    width: '100%',
  },
  face: {
    backfaceVisibility: 'hidden',
    width: '100%',
  },
});
