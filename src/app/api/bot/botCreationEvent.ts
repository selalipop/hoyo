type WebpageScrapedEvent = {
  type: "webpageScraped";
  url: string;
  content: string;
  screenshot: string;
};

type QAGeneratedEvent = {
  type: "qaGenerated";
  siteSummary: string;
  questions: string[];
  answers: string[];
};

type PhoneNumberAssignedEvent = {
  type: "phoneNumberAssigned";
  phoneNumber: string;
};

export type BotCreationEvent =
  | WebpageScrapedEvent
  | QAGeneratedEvent
  | PhoneNumberAssignedEvent;
