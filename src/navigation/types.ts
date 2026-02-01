import {Player, Category} from '../types';

export type RootStackParamList = {
  Splash: undefined;
  Landing: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  VerifyEmail: {email: string};
  Home: undefined;
  GameLoading: {players: Player[]; categories: Category[]};
  Game: {players: Player[]; categories: Category[]; sessionId?: string};
  GameOver: {players: Player[]};
  Store: undefined;
  UserProfile: undefined;
  AdminPanel: undefined;
};
