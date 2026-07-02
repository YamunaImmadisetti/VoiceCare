// constants/theme.ts
export const Colors = {
  sageDark:   '#243F38',
  sage:       '#3D6B5F',
  sageMid:    '#5A8F80',
  sageLight:  '#A8CBBF',
  sagePale:   '#EAF3EF',
  cream:      '#FDFAF5',
  amber:      '#C4813A',
  amberSoft:  '#FBF1E4',
  red:        '#C94040',
  redSoft:    '#FCF0F0',
  sky:        '#3876B0',
  skySoft:    '#EBF3FB',
  text:       '#1A2E28',
  textMid:    '#456058',
  textMuted:  '#8FA89F',
  border:     'rgba(61,107,95,0.15)',
  borderMid:  'rgba(61,107,95,0.25)',
  white:      '#FFFFFF',
}

export const Font = {
  serif:      'Lora_400Regular',
  serifBold:  'Lora_600SemiBold',
  sans:       'Nunito_400Regular',
  sansMedium: 'Nunito_600SemiBold',
  sansBold:   'Nunito_700Bold',
}

export const Radius = {
  sm:   10,
  md:   16,
  lg:   24,
  full: 999,
}

export const Shadow = {
  sm: {
    shadowColor: '#243F38',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#243F38',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
}