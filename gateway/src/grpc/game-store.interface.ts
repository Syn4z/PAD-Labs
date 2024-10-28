export interface BuyGameRequest {
  username: string;
  game_title: string;
}

export interface BuyGameResponse {
  message: string;
  status_code: number;
  callback?: (response: BuyGameResponse) => void;
}