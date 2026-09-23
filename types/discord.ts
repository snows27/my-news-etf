export interface DiscordMessage {
  content: string;
}

export interface SendResult {
  success: boolean;
  messagesSent: number;
  error?: string;
}
