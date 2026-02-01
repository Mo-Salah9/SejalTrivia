import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '../theme/colors';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  appTitle?: string;
}

const Logo: React.FC<LogoProps> = ({size = 'md', appTitle = 'سجال'}) => {
  const iconSize = size === 'sm' ? 28 : size === 'md' ? 40 : 56;
  const fontSize = size === 'sm' ? 18 : size === 'md' ? 24 : 32;
  const iconFontSize = size === 'sm' ? 16 : size === 'md' ? 22 : 30;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconBox,
          {width: iconSize, height: iconSize, borderRadius: iconSize * 0.3},
        ]}>
        <Text style={{fontSize: iconFontSize}}>⚔️</Text>
      </View>
      <Text style={[styles.title, {fontSize}]}>{appTitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  title: {
    fontWeight: '900',
    color: Colors.orange500,
  },
});

export default Logo;
