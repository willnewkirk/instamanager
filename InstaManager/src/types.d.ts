declare module 'react-native-paper' {
  export const Provider: any;
  export const Button: any;
  export const Text: any;
  export const Card: any;
}

declare module 'axios' {
  export default any;
}

declare module '@react-native-community/cameraroll' {
  export default {
    save: (url: string) => Promise<void>;
  };
} 