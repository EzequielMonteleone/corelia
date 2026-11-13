import i18n from '@/i18n';

jest.mock('expo-localization', () => ({
  getLocales: () => [
    {languageCode: 'es', languageTag: 'es-AR', regionCode: 'AR'},
  ],
}));

beforeAll(async () => {
  // Pin the language used by legacy assertions.
  await i18n.changeLanguage('es');
});

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  NotificationFeedbackType: {Success: 'success', Error: 'error'},
}));
