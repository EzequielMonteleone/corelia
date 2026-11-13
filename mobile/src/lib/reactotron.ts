import AsyncStorage from '@react-native-async-storage/async-storage';
import Reactotron from 'reactotron-react-native';
import {
  QueryClientManager,
  reactotronReactQuery,
} from 'reactotron-react-query';
import {queryClient} from '@/lib/queryClient';

/**
 * Reactotron is a development-only debugger. It is imported behind `__DEV__`
 * in the root layout so production bundles never connect to it.
 */
const queryClientManager = new QueryClientManager({queryClient});

Reactotron.setAsyncStorageHandler(AsyncStorage)
  .configure({
    name: 'Corelia',
    onDisconnect: () => queryClientManager.unsubscribe(),
  })
  .use(reactotronReactQuery(queryClientManager))
  .useReactNative({
    asyncStorage: {ignore: ['corelia-auth']},
    networking: {ignoreUrls: /symbolicate/},
    overlay: false,
  })
  .connect();
