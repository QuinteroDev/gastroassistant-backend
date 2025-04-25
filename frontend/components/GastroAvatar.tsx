// components/GastroAvatar.tsx
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface GastroAvatarProps {
  size?: number;
}

const GastroAvatar: React.FC<GastroAvatarProps> = ({ size = 36 }) => {
  return (
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      {/* Círculo base */}
      <Circle cx="50" cy="50" r="45" fill="#ffffff" stroke="#0077B6" strokeWidth="4"/>
      
      {/* Estómago estilizado */}
      <Path d="M35,30 C25,35 20,50 25,65 C30,80 45,80 50,80 C55,80 70,80 75,65 C80,50 75,35 65,30 C60,27 55,35 50,35 C45,35 40,27 35,30" 
            fill="#E6F7FF" stroke="#0077B6" strokeWidth="3" strokeLinejoin="round"/>
      
      {/* Esófago */}
      <Path d="M50,20 L50,35" stroke="#0077B6" strokeWidth="3" strokeLinecap="round"/>
      
      {/* Intestino estilizado */}
      <Path d="M50,80 C50,85 40,85 40,90 C40,95 60,95 60,90 C60,85 50,85 50,80" 
            stroke="#0077B6" strokeWidth="3" fill="none" strokeLinecap="round"/>
      
      {/* Cara sonriente */}
      <Circle cx="40" cy="50" r="3" fill="#0077B6"/>
      <Circle cx="60" cy="50" r="3" fill="#0077B6"/>
      <Path d="M40,60 Q50,70 60,60" stroke="#0077B6" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </Svg>
  );
};

export default GastroAvatar;