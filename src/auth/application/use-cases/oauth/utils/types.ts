export type ConnectProviderType = {
  id: number | string;
  photoUrl: string;
  username: string;
  email: string;
};

export type ProviderDataType = {
  id: number | string;
  login: string;
  email: string;
  photoUrl?: string;
};
