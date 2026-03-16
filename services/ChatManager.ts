import { ChatMessage } from './RecipeAuditorService';

export class ChatManager {
  private messages: ChatMessage[];
  private isTyping: boolean = false;
  private readonly STORAGE_KEY = 'auditor_chat_messages';

  constructor() {
    const stored = sessionStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.messages = JSON.parse(stored);
      } catch (e) {
        this.messages = this.getDefaultMessages();
      }
    } else {
      this.messages = this.getDefaultMessages();
    }
  }

  private getDefaultMessages(): ChatMessage[] {
    return [
      {
        id: '1',
        sender: 'bot',
        text: "Hello! I'm Doc Chef, your personal cooking and health assistant. I can help you discover recipes, audit them for your dietary needs, and create meal plans. What would you like today?"
      }
    ];
  }

  private saveMessages(): void {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.messages));
  }

  public getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  public addUserMessage(text: string): void {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim()
    };
    this.messages.push(newMessage);
    this.saveMessages();
  }

  public addBotMessage(text: string): void {
    const newMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'bot',
      text: text
    };
    this.messages.push(newMessage);
    this.saveMessages();
  }

  public setTyping(isTyping: boolean): void {
    this.isTyping = isTyping;
  }

  public isCurrentlyTyping(): boolean {
    return this.isTyping;
  }

  public clearChat(): void {
    this.messages = [
      {
        id: '1',
        sender: 'bot',
        text: "Hello! I'm Doc Chef, your personal cooking and health assistant. What would you like today?"
      }
    ];
    this.saveMessages();
  }

  public getLastMessage(): ChatMessage | null {
    return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
  }

  public getMessageCount(): number {
    return this.messages.length;
  }
}